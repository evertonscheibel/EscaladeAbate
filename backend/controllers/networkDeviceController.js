import NetworkDevice from '../models/NetworkDevice.js';
import Notification from '../models/Notification.js';

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
