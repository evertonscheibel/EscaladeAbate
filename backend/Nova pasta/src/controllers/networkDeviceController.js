import NetworkDevice from '../models/NetworkDevice.js';
import Notification from '../models/Notification.js';
import * as XLSX from 'xlsx';
import fs from 'fs';

// @desc    Obter todos os dispositivos de rede
// @route   GET /api/network-devices
// @access  Private
export const getNetworkDevices = async (req, res) => {
    try {
        const { type, status, location, search } = req.query;

        const filter = {};

        if (type) filter.type = type;
        if (status) filter.status = status;
        if (location) filter.location = location;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { hostname: { $regex: search, $options: 'i' } },
                { ipAddress: { $regex: search, $options: 'i' } }
            ];
        }

        const devices = await NetworkDevice.find(filter)
            .populate('credential', 'title category')
            .populate('asset', 'assetId description')
            .sort({ location: 1, name: 1 });

        res.json({
            success: true,
            count: devices.length,
            data: devices
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar dispositivos',
            error: error.message
        });
    }
};

// @desc    Obter um dispositivo específico
// @route   GET /api/network-devices/:id
// @access  Private
export const getNetworkDevice = async (req, res) => {
    try {
        const device = await NetworkDevice.findById(req.params.id)
            .populate('credential')
            .populate('asset')
            .populate('connectedTo.device', 'name ipAddress type');

        if (!device) {
            return res.status(404).json({
                success: false,
                message: 'Dispositivo não encontrado'
            });
        }

        res.json({
            success: true,
            data: device
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar dispositivo',
            error: error.message
        });
    }
};

// @desc    Criar novo dispositivo
// @route   POST /api/network-devices
// @access  Private (Admin)
export const createNetworkDevice = async (req, res) => {
    try {
        const device = await NetworkDevice.create(req.body);

        res.status(201).json({
            success: true,
            message: 'Dispositivo criado com sucesso',
            data: device
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Hostname já existe',
                error: 'Dispositivo com este hostname já está cadastrado'
            });
        }

        res.status(400).json({
            success: false,
            message: 'Erro ao criar dispositivo',
            error: error.message
        });
    }
};

// @desc    Atualizar dispositivo
// @route   PUT /api/network-devices/:id
// @access  Private (Admin)
export const updateNetworkDevice = async (req, res) => {
    try {
        const device = await NetworkDevice.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!device) {
            return res.status(404).json({
                success: false,
                message: 'Dispositivo não encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Dispositivo atualizado com sucesso',
            data: device
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Erro ao atualizar dispositivo',
            error: error.message
        });
    }
};

// @desc    Excluir dispositivo
// @route   DELETE /api/network-devices/:id
// @access  Private (Admin)
export const deleteNetworkDevice = async (req, res) => {
    try {
        const device = await NetworkDevice.findById(req.params.id);

        if (!device) {
            return res.status(404).json({
                success: false,
                message: 'Dispositivo não encontrado'
            });
        }

        await device.deleteOne();

        res.json({
            success: true,
            message: 'Dispositivo excluído com sucesso'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao excluir dispositivo',
            error: error.message
        });
    }
};

// @desc    Atualizar status do dispositivo (ping/check)
// @route   PUT /api/network-devices/:id/status
// @access  Private
export const updateDeviceStatus = async (req, res) => {
    try {
        const { status, metrics } = req.body;

        const device = await NetworkDevice.findById(req.params.id);

        if (!device) {
            return res.status(404).json({
                success: false,
                message: 'Dispositivo não encontrado'
            });
        }

        const previousStatus = device.status;

        device.status = status;
        device.lastCheck = new Date();

        if (status === 'online') {
            device.lastSeen = new Date();
        }

        if (metrics) {
            device.metrics = { ...device.metrics, ...metrics };
        }

        await device.save();

        // Criar notificação se mudou de online para offline
        if (previousStatus === 'online' && status === 'offline') {
            await Notification.create({
                title: 'Dispositivo Offline',
                message: `${device.name} (${device.ipAddress}) está offline`,
                type: 'alert',
                priority: 'high',
                link: `/network/${device._id}`
            });
        }

        res.json({
            success: true,
            data: device
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Erro ao atualizar status',
            error: error.message
        });
    }
};

// @desc    Obter dashboard de rede
// @route   GET /api/network-devices/dashboard
// @access  Private
export const getNetworkDashboard = async (req, res) => {
    try {
        // Total por tipo
        const byType = await NetworkDevice.aggregate([
            { $group: { _id: '$type', count: { $sum: 1 } } }
        ]);

        // Total por status
        const byStatus = await NetworkDevice.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        // Total por localização
        const byLocation = await NetworkDevice.aggregate([
            { $group: { _id: '$location', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        // Dispositivos offline
        const offlineDevices = await NetworkDevice.find({ status: 'offline' })
            .select('name ipAddress type location lastSeen')
            .sort({ lastSeen: -1 });

        // Dispositivos com alertas (métricas altas)
        const devicesWithAlerts = await NetworkDevice.find({
            $or: [
                { 'metrics.cpuUsage': { $gte: 80 } },
                { 'metrics.memoryUsage': { $gte: 80 } },
                { 'metrics.temperature': { $gte: 60 } }
            ]
        }).select('name ipAddress metrics alertThresholds');

        // Totais
        const total = await NetworkDevice.countDocuments();
        const online = await NetworkDevice.countDocuments({ status: 'online' });
        const offline = await NetworkDevice.countDocuments({ status: 'offline' });
        const warning = await NetworkDevice.countDocuments({ status: 'warning' });

        // Switches e APs específicos
        const switches = await NetworkDevice.find({ type: 'switch' })
            .select('name ipAddress location status totalPorts ports');

        const accessPoints = await NetworkDevice.find({ type: 'access_point' })
            .select('name ipAddress location status wifi');

        res.json({
            success: true,
            data: {
                summary: {
                    total,
                    online,
                    offline,
                    warning,
                    uptime: total > 0 ? ((online / total) * 100).toFixed(1) : 0
                },
                byType,
                byStatus,
                byLocation,
                offlineDevices,
                devicesWithAlerts,
                switches,
                accessPoints
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar dashboard',
            error: error.message
        });
    }
};

// @desc    Obter topologia de rede
// @route   GET /api/network-devices/topology
// @access  Private
export const getNetworkTopology = async (req, res) => {
    try {
        const devices = await NetworkDevice.find()
            .select('name type ipAddress location status connectedTo')
            .populate('connectedTo.device', 'name type ipAddress');

        // Formatar para visualização de grafo
        const nodes = devices.map(d => ({
            id: d._id,
            label: d.name,
            type: d.type,
            ip: d.ipAddress,
            location: d.location,
            status: d.status
        }));

        const edges = [];
        devices.forEach(d => {
            if (d.connectedTo && d.connectedTo.length > 0) {
                d.connectedTo.forEach(conn => {
                    if (conn.device) {
                        edges.push({
                            from: d._id,
                            to: conn.device._id,
                            port: conn.port,
                            description: conn.description
                        });
                    }
                });
            }
        });

        res.json({
            success: true,
            data: { nodes, edges }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar topologia',
            error: error.message
        });
    }
};

// @desc    Atualizar portas do switch
// @route   PUT /api/network-devices/:id/ports
// @access  Private
export const updateSwitchPorts = async (req, res) => {
    try {
        const { ports } = req.body;

        const device = await NetworkDevice.findById(req.params.id);

        if (!device) {
            return res.status(404).json({
                success: false,
                message: 'Dispositivo não encontrado'
            });
        }

        if (device.type !== 'switch') {
            return res.status(400).json({
                success: false,
                message: 'Apenas switches podem ter portas atualizadas'
            });
        }

        device.ports = ports;
        await device.save();

        res.json({
            success: true,
            message: 'Portas atualizadas com sucesso',
            data: device
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Erro ao atualizar portas',
            error: error.message
        });
    }
};

// @desc    Buscar dispositivos por localização
// @route   GET /api/network-devices/location/:location
// @access  Private
export const getDevicesByLocation = async (req, res) => {
    try {
        const devices = await NetworkDevice.find({
            location: { $regex: req.params.location, $options: 'i' }
        })
            .populate('credential', 'title')
            .sort({ type: 1, name: 1 });

        res.json({
            success: true,
            count: devices.length,
            data: devices
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar dispositivos',
            error: error.message
        });
    }
};

// @desc    Importar dispositivos de rede via Excel
// @route   POST /api/network-devices/import
// @access  Private (Admin)
export const importNetworkDevices = async (req, res) => {
    let filePath = null;
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Nenhum arquivo enviado' });
        }

        filePath = req.file.path;
        console.log('Iniciando importação de dispositivos de rede:', filePath);

        const fileBuffer = fs.readFileSync(filePath);
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (!rows || rows.length === 0) {
            throw new Error('A planilha está vazia');
        }

        const normalize = (str) => String(str || '').toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

        let headerRowIndex = -1;
        let headers = [];

        for (let i = 0; i < Math.min(rows.length, 20); i++) {
            const rowStr = rows[i].map(c => normalize(c));
            if (rowStr.includes('IP') || rowStr.includes('NOME') || rowStr.includes('HOSTNAME')) {
                headerRowIndex = i;
                headers = rows[i].map(h => normalize(h));
                break;
            }
        }

        if (headerRowIndex === -1) {
            headerRowIndex = 0;
            headers = rows[0].map(h => normalize(h));
        }

        const results = { success: 0, errors: 0, details: [] };
        const getExactVal = (rowArray, possibleNames) => {
            const index = headers.findIndex(h => possibleNames.includes(h));
            return index >= 0 ? rowArray[index] : undefined;
        };

        const dataRows = rows.slice(headerRowIndex + 1);

        for (const row of dataRows) {
            if (!row || row.length === 0 || !row.some(c => !!c)) continue;

            try {
                const name = getExactVal(row, ['NOME', 'DISPOSITIVO', 'DEVICE', 'TITLE']);
                const hostname = getExactVal(row, ['HOSTNAME', 'HOST']);
                const ipAddress = getExactVal(row, ['IP', 'IPADDRESS', 'ENDERECO IP']);
                const macAddress = getExactVal(row, ['MAC', 'MACADDRESS', 'ENDERECO MAC']);
                const typeImp = String(getExactVal(row, ['TIPO', 'TYPE', 'CATEGORY']) || '').toLowerCase();
                const location = getExactVal(row, ['LOCALIZACAO', 'LOCAL', 'LOCATION', 'SETOR']);
                const brand = getExactVal(row, ['MARCA', 'BRAND', 'FABRICANTE']);
                const model = getExactVal(row, ['MODELO', 'MODEL']);
                const serialNumber = getExactVal(row, ['NUMEROSERIE', 'SERIAL', 'S/N']);

                if (!name && !hostname) continue;

                // Determinar o tipo válido
                let type = 'outro';
                const validTypes = ['switch', 'router', 'access_point', 'firewall', 'modem', 'server', 'outro'];
                if (typeImp) {
                    if (typeImp.includes('switch')) type = 'switch';
                    else if (typeImp.includes('ap') || typeImp.includes('access')) type = 'access_point';
                    else if (typeImp.includes('roteador') || typeImp.includes('router')) type = 'router';
                    else if (typeImp.includes('firewall')) type = 'firewall';
                    else if (typeImp.includes('modem')) type = 'modem';
                    else if (typeImp.includes('servidor') || typeImp.includes('server')) type = 'server';
                }

                const deviceData = {
                    name: name || hostname || 'Disp. Importado',
                    hostname: hostname ? String(hostname).trim() : undefined,
                    ipAddress: ipAddress ? String(ipAddress).trim() : '0.0.0.0',
                    macAddress: macAddress ? String(macAddress).trim() : undefined,
                    type: type,
                    location: location ? String(location).trim() : 'Matriz',
                    brand: brand ? String(brand).trim() : undefined,
                    model: model ? String(model).trim() : undefined,
                    serialNumber: serialNumber ? String(serialNumber).trim() : undefined,
                    status: 'online'
                };

                // Tenta encontrar por hostname (único) ou IP
                let existing = null;
                if (deviceData.hostname) {
                    existing = await NetworkDevice.findOne({ hostname: deviceData.hostname });
                }
                if (!existing && deviceData.ipAddress && deviceData.ipAddress !== '0.0.0.0') {
                    existing = await NetworkDevice.findOne({ ipAddress: deviceData.ipAddress });
                }

                if (existing) {
                    Object.assign(existing, deviceData);
                    await existing.save();
                } else {
                    await NetworkDevice.create(deviceData);
                }

                results.success++;
            } catch (err) {
                results.errors++;
                results.details.push({ rowPreview: String(row[0] || 'N/A'), error: err.message });
            }
        }

        res.status(200).json({ success: true, message: 'Importação concluída', results });

    } catch (error) {
        console.error('Erro na importação de rede:', error);
        res.status(500).json({ success: false, message: 'Erro ao processar arquivo', error: error.message });
    } finally {
        if (filePath && fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch (e) { console.error('Limpeza falhou', e); }
        }
    }
};
