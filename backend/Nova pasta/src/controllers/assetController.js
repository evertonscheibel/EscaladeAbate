import Asset from '../models/Asset.js';
import AssetTimeline from '../models/AssetTimeline.js';
import * as XLSX from 'xlsx';
import fs from 'fs';

// ... existing imports and functions ...

export const getAssets = async (req, res, next) => {
    try {
        const assets = await Asset.find()
            .populate('assignedTo', 'name email')
            .populate('responsible', 'name email')
            .populate('linkedDocuments');
        res.status(200).json(assets);
    } catch (error) {
        next(error);
    }
};

export const getAsset = async (req, res, next) => {
    try {
        const asset = await Asset.findById(req.params.id)
            .populate('assignedTo', 'name email')
            .populate('responsible', 'name email')
            .populate('linkedDocuments');
        if (!asset) {
            return res.status(404).json({ message: 'Ativo não encontrado' });
        }
        res.status(200).json(asset);
    } catch (error) {
        next(error);
    }
};

export const createAsset = async (req, res, next) => {
    try {
        const asset = await Asset.create(req.body);

        // Criar evento inicial na timeline
        await AssetTimeline.create({
            asset: asset._id,
            eventType: 'aquisicao',
            itilCategory: 'asset_management',
            cobitProcess: 'BAI09',
            eventDate: asset.acquisitionDate || asset.purchaseDate || new Date(),
            user: req.user._id,
            title: 'Ativo adquirido',
            description: `Ativo ${asset.assetId} - ${asset.description} foi registrado no sistema`,
            newData: {
                status: asset.status,
                location: asset.location,
                responsible: asset.responsible,
                value: asset.purchaseValue
            },
            cost: asset.purchaseValue || 0
        });

        const populatedAsset = await Asset.findById(asset._id)
            .populate('assignedTo', 'name email')
            .populate('responsible', 'name email')
            .populate('linkedDocuments');

        res.status(201).json(populatedAsset);
    } catch (error) {
        next(error);
    }
};

export const updateAsset = async (req, res, next) => {
    try {
        const oldAsset = await Asset.findById(req.params.id);
        if (!oldAsset) {
            return res.status(404).json({ message: 'Ativo não encontrado' });
        }

        const asset = await Asset.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
            .populate('assignedTo', 'name email')
            .populate('responsible', 'name email')
            .populate('linkedDocuments');

        // Detectar mudanças importantes para timeline
        const changes = [];
        if (oldAsset.status !== asset.status) changes.push(`Status alterado de ${oldAsset.status} para ${asset.status}`);
        if (oldAsset.location !== asset.location) changes.push(`Localização alterada de ${oldAsset.location} para ${asset.location}`);
        if (oldAsset.assignedTo?.toString() !== asset.assignedTo?._id.toString()) changes.push('Usuário atribuído alterado');

        if (changes.length > 0) {
            await AssetTimeline.create({
                asset: asset._id,
                eventType: 'atualizacao',
                itilCategory: 'asset_management',
                cobitProcess: 'BAI09',
                user: req.user._id,
                title: 'Ativo atualizado',
                description: changes.join(', '),
                previousData: {
                    status: oldAsset.status,
                    location: oldAsset.location,
                    assignedTo: oldAsset.assignedTo
                },
                newData: {
                    status: asset.status,
                    location: asset.location,
                    assignedTo: asset.assignedTo
                }
            });
        }

        res.status(200).json(asset);
    } catch (error) {
        next(error);
    }
};

export const deleteAsset = async (req, res, next) => {
    try {
        const asset = await Asset.findById(req.params.id);
        if (!asset) {
            return res.status(404).json({ message: 'Ativo não encontrado' });
        }

        // Em vez de deletar fisicamente, podemos marcar como descartado ou apenas registrar na timeline antes de deletar
        // Se for deletar fisicamente:
        await AssetTimeline.create({
            asset: asset._id,
            eventType: 'baixa',
            itilCategory: 'asset_management',
            cobitProcess: 'BAI09',
            user: req.user._id,
            title: 'Ativo removido',
            description: `Ativo ${asset.assetId} foi removido do sistema`,
            previousData: asset.toObject()
        });

        await asset.deleteOne();
        res.status(200).json({ message: 'Ativo excluído com sucesso' });
    } catch (error) {
        next(error);
    }
};

export const getAssetWithDetails = async (req, res, next) => {
    try {
        const asset = await Asset.findById(req.params.id)
            .populate('assignedTo', 'name email')
            .populate('responsible', 'name email')
            .populate('linkedDocuments');

        if (!asset) {
            return res.status(404).json({ message: 'Ativo não encontrado' });
        }

        // Buscar manutenções e timeline (poderia ser via virtuals populate também)
        // Mas como são models separados e queremos controle, faremos buscas paralelas ou usaremos os virtuals se configurados
        // Vamos usar os virtuals configurados no model Asset
        await asset.populate('maintenances');
        await asset.populate('timeline');

        res.status(200).json(asset);
    } catch (error) {
        next(error);
    }
};

export const getAssetReport = async (req, res, next) => {
    try {
        const totalValue = await Asset.aggregate([
            { $group: { _id: null, total: { $sum: "$purchaseValue" } } }
        ]);

        const byStatus = await Asset.aggregate([
            { $group: { _id: "$status", count: { $sum: 1 } } }
        ]);

        const byLocation = await Asset.aggregate([
            {
                $group: {
                    _id: "$location",
                    count: { $sum: 1 },
                    totalValue: { $sum: "$purchaseValue" }
                }
            },
            { $sort: { count: -1 } }
        ]);

        const warrantyExpiring = await Asset.find({
            warrantyExpiration: {
                $gte: new Date(),
                $lte: new Date(new Date().setDate(new Date().getDate() + 90))
            }
        }).select('assetId description warrantyExpiration location');

        res.status(200).json({
            totalValue,
            byStatus,
            byLocation,
            warrantyExpiring
        });
    } catch (error) {
        next(error);
    }
};

export const importAssets = async (req, res, next) => {
    let filePath = null;
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Nenhum arquivo enviado' });
        }

        filePath = req.file.path;
        console.log('Iniciando importação de:', filePath);

        // Ler o arquivo com fs e parsear com XLSX
        const fileBuffer = fs.readFileSync(filePath);
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Ler como matriz
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (!rows || rows.length === 0) {
            throw new Error('A planilha está vazia');
        }

        // Helper para normalizar string (remove acentos e uppercase)
        const normalize = (str) => String(str || '').toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

        // Localizar linha de cabeçalho
        let headerRowIndex = -1;
        let headers = [];

        // Estratégia de detecção
        for (let i = 0; i < Math.min(rows.length, 20); i++) {
            const rowStr = rows[i].map(c => normalize(c));

            // Critério 1: Planilha do Cliente (MAC e IP)
            if (rowStr.includes('MAC') && rowStr.includes('IP')) {
                headerRowIndex = i;
                headers = rows[i].map(h => normalize(h));
                console.log('Layout detectado: Planilha Cliente (MAC/IP) na linha', i + 1);
                break;
            }

            // Critério 2: Exportação do Sistema (ID e DESCRICAO)
            if (rowStr.includes('ID') && (rowStr.includes('DESCRICAO') || rowStr.includes('DESCRIPTION'))) {
                headerRowIndex = i;
                headers = rows[i].map(h => normalize(h));
                console.log('Layout detectado: Exportação Sistema (ID/Descricao) na linha', i + 1);
                break;
            }
        }

        if (headerRowIndex === -1) {
            // Tenta assumir linha 0 se tiver colunas com nomes razoáveis
            const firstRow = rows[0].map(c => normalize(c));
            if (firstRow.some(h => ['ID', 'NOME', 'DESCRICAO', 'MODELO', 'ETIQUETA'].includes(h))) {
                console.log('Layout não explícito, assumindo cabeçalho na linha 1');
                headerRowIndex = 0;
                headers = rows[0].map(h => normalize(h));
            } else {
                throw new Error('Cabeçalho não identificado. Certifique-se que a planilha tem colunas como "ID", "Descrição", "MAC" ou "IP".');
            }
        }

        console.log('Colunas encontradas:', headers);

        const results = {
            success: 0,
            errors: 0,
            details: []
        };

        const getExactVal = (rowArray, possibleNames) => {
            if (!rowArray) return undefined;
            const index = headers.findIndex(h => possibleNames.includes(h));
            return index >= 0 ? rowArray[index] : undefined;
        }

        const dataRows = rows.slice(headerRowIndex + 1);

        for (const row of dataRows) {
            if (!row || row.length === 0 || !row.some(c => !!c)) continue;

            try {
                // Mapeamento Unificado baseado na nova estrutura
                const etiqueta = getExactVal(row, ['ID', 'ETIQUETA', 'PATRIMONIO']);
                const descricao = getExactVal(row, ['DESCRICAO', 'DESCRIPTION']);
                const hostnameVal = getExactVal(row, ['HOSTNAME', 'NOME']);
                const tipoImp = String(getExactVal(row, ['TIPO', 'TYPE']) || '').toLowerCase();
                const modeloPc = getExactVal(row, ['MODELO', 'MODEL', 'MODELO DO PC']);
                const marca = getExactVal(row, ['MARCA', 'BRAND']);
                const ip = getExactVal(row, ['IP', 'IPADDRESS']);
                const mac = getExactVal(row, ['MAC']);
                const anydesk = getExactVal(row, ['ANYDESK', 'ANYDESKID']);
                const local = getExactVal(row, ['LOCALIZACAO', 'LOCAL', 'LOCATION']);
                const statusImp = getExactVal(row, ['STATUS']);

                // Specs
                const processador = getExactVal(row, ['PROCESSADOR', 'CPU', 'PROCESSOR']);
                const memoria = getExactVal(row, ['MEMORIA', 'RAM', 'MEMORY']);
                const ssd = getExactVal(row, ['SSD', 'STORAGE']);
                const entradaPc = getExactVal(row, ['ENTRADA PC', 'VIDEOOUTPUTPC']);
                const entradaTela = getExactVal(row, ['ENTRADA TELA', 'VIDEOOUTPUTMONITOR']);
                const acessorios = getExactVal(row, ['ACESSORIOS', 'ACCESSORIES']);

                // Financeiro
                const dataCompra = getExactVal(row, ['DATACOMPRA', 'DATA', 'PURCHASEDATE']);
                const valor = getExactVal(row, ['VALOR', 'VALUE', 'PURCHASEVALUE']);
                const garantia = getExactVal(row, ['GARANTIA', 'WARRANTY', 'WARRANTYEXPIRATION']);

                // Processamento de ID e Tipo
                const assetId = etiqueta ? String(etiqueta).trim() : `AUTO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

                let type = 'outro';
                const validTypes = ['notebook', 'desktop', 'monitor', 'impressora', 'servidor', 'rede', 'periferico', 'software', 'outro'];

                if (tipoImp) {
                    if (tipoImp === 'switch') {
                        type = 'rede';
                    } else if (validTypes.includes(tipoImp)) {
                        type = tipoImp;
                    }
                }

                // Datas
                const parseDate = (val) => {
                    if (!val) return undefined;
                    const d = new Date(val);
                    if (!isNaN(d.getTime())) return d;
                    return undefined;
                };

                const assetData = {
                    assetId: assetId,
                    description: descricao ? String(descricao) : (hostnameVal ? String(hostnameVal) : 'Ativo Importado'),
                    hostname: hostnameVal ? String(hostnameVal) : undefined,
                    type: type,
                    model: modeloPc ? String(modeloPc) : '',
                    brand: marca ? String(marca) : '',
                    serialNumber: getExactVal(row, ['NUMEROSERIE', 'SERIAL']) ? String(getExactVal(row, ['NUMEROSERIE', 'SERIAL'])) : undefined,
                    location: local ? String(local) : 'Matriz',
                    status: statusImp ? String(statusImp).toLowerCase() : 'ativo',
                    purchaseDate: parseDate(dataCompra),
                    purchaseValue: valor ? Number(valor) : 0,
                    warrantyExpiration: parseDate(garantia),

                    macAddress: mac ? String(mac) : undefined,
                    ipAddress: ip ? String(ip) : undefined,
                    anydeskId: anydesk ? String(anydesk) : undefined,

                    specs: {
                        processor: processador ? String(processador) : undefined,
                        ram: memoria ? String(memoria) : undefined,
                        storage: ssd ? String(ssd) : undefined,
                        videoOutputPc: entradaPc ? String(entradaPc) : undefined,
                        videoOutputMonitor: entradaTela ? String(entradaTela) : undefined,
                        accessories: acessorios ? String(acessorios) : undefined
                    }
                };

                const validStatuses = ['ativo', 'em_manutencao', 'disponivel', 'descartado', 'perdido'];
                if (!validStatuses.includes(assetData.status)) assetData.status = 'ativo';

                const existing = await Asset.findOne({ assetId: assetData.assetId });

                if (existing) {
                    Object.assign(existing, assetData);
                    await existing.save();
                } else {
                    const asset = await Asset.create(assetData);
                    await AssetTimeline.create({
                        asset: asset._id,
                        eventType: 'aquisicao',
                        itilCategory: 'asset_management',
                        cobitProcess: 'BAI09',
                        eventDate: new Date(),
                        user: req.user._id,
                        title: 'Importação Excel',
                        description: `Importado: ${assetData.description}`,
                        cost: 0
                    });
                }

                results.success++;
            } catch (innerError) {
                console.error('Erro na linha:', row, innerError);
                results.errors++;
                results.details.push({
                    rowPreview: String(row[0] || 'N/A'),
                    error: innerError.message
                });
            }
        }

        res.status(200).json({
            message: 'Processamento concluído',
            results
        });

    } catch (error) {
        console.error('Erro geral na importação:', error);
        res.status(500).json({
            message: 'Erro ao processar arquivo',
            error: error.message
        });
    } finally {
        if (filePath && fs.existsSync(filePath)) {
            try {
                fs.unlinkSync(filePath);
            } catch (e) { console.error('Limpeza falhou', e); }
        }
    }
};

export const exportAssets = async (req, res, next) => {
    try {
        const assets = await Asset.find().lean();

        const data = assets.map(asset => ({
            'ID': asset.assetId,
            'Descricao': asset.description,
            'Hostname': asset.hostname || '',
            'Tipo': asset.type,
            'Marca': asset.brand,
            'Modelo': asset.model,
            'NumeroSerie': asset.serialNumber,
            'MAC': asset.macAddress || '',
            'IP': asset.ipAddress || '',
            'AnyDesk': asset.anydeskId || '',
            'Localizacao': asset.location,
            'Status': asset.status,
            'DataCompra': asset.purchaseDate ? new Date(asset.purchaseDate).toISOString().split('T')[0] : '',
            'Valor': asset.purchaseValue,
            'Garantia': asset.warrantyExpiration ? new Date(asset.warrantyExpiration).toISOString().split('T')[0] : '',
            // Specs
            'Processador': asset.specs?.processor || '',
            'Memoria': asset.specs?.ram || '',
            'SSD': asset.specs?.storage || '',
            'Entrada PC': asset.specs?.videoOutputPc || '',
            'Entrada Tela': asset.specs?.videoOutputMonitor || '',
            'Acessorios': asset.specs?.accessories || ''
        }));

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Ativos');

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Disposition', 'attachment; filename="ativos.xlsx"');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.send(buffer);

    } catch (error) {
        next(error);
    }
};

export const clearAllAssets = async (req, res, next) => {
    try {
        const assetsResult = await Asset.deleteMany({});
        const timelineResult = await AssetTimeline.deleteMany({});

        res.status(200).json({
            message: 'Todos os ativos foram removidos',
            deletedAssets: assetsResult.deletedCount,
            deletedTimelines: timelineResult.deletedCount
        });
    } catch (error) {
        next(error);
    }
};
