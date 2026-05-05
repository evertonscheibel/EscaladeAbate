import mongoose from 'mongoose';

const portSchema = new mongoose.Schema({
    portNumber: { type: Number, required: true },
    status: { type: String, enum: ['up', 'down', 'disabled'], default: 'up' },
    speed: { type: String }, // Ex: 1Gbps, 100Mbps
    connectedDevice: { type: String }, // Descrição do que está conectado
    vlan: { type: Number },
    lastActivity: { type: Date }
});

const networkDeviceSchema = new mongoose.Schema({
    // Identificação
    name: {
        type: String,
        required: [true, 'Nome do dispositivo é obrigatório'],
        trim: true
    },
    hostname: {
        type: String,
        trim: true,
        unique: true,
        sparse: true
    },
    type: {
        type: String,
        enum: ['switch', 'router', 'access_point', 'firewall', 'modem', 'server', 'outro'],
        required: [true, 'Tipo é obrigatório']
    },
    
    // Rede
    ipAddress: {
        type: String,
        required: [true, 'IP é obrigatório'],
        trim: true
    },
    macAddress: {
        type: String,
        trim: true
    },
    subnet: {
        type: String,
        trim: true
    },
    gateway: {
        type: String,
        trim: true
    },
    vlan: {
        type: Number
    },
    
    // Hardware
    brand: {
        type: String,
        trim: true
    },
    model: {
        type: String,
        trim: true
    },
    serialNumber: {
        type: String,
        trim: true
    },
    firmware: {
        type: String,
        trim: true
    },
    
    // Localização
    location: {
        type: String,
        required: [true, 'Localização é obrigatória'],
        trim: true
    },
    rack: {
        type: String,
        trim: true
    },
    rackPosition: {
        type: String,
        trim: true
    },
    
    // Configuração de Portas (para switches)
    totalPorts: {
        type: Number,
        default: 0
    },
    ports: [portSchema],
    
    // Configuração de WiFi (para APs)
    wifi: {
        ssid: { type: String },
        band: { type: String, enum: ['2.4GHz', '5GHz', 'dual'] },
        channel: { type: Number },
        connectedClients: { type: Number, default: 0 },
        maxClients: { type: Number }
    },
    
    // Monitoramento
    status: {
        type: String,
        enum: ['online', 'offline', 'warning', 'maintenance'],
        default: 'online'
    },
    lastSeen: {
        type: Date,
        default: Date.now
    },
    lastCheck: {
        type: Date
    },
    uptime: {
        type: Number, // em segundos
        default: 0
    },
    
    // Métricas
    metrics: {
        cpuUsage: { type: Number, min: 0, max: 100 },
        memoryUsage: { type: Number, min: 0, max: 100 },
        temperature: { type: Number },
        bandwidth: {
            in: { type: Number }, // Mbps
            out: { type: Number }
        }
    },
    
    // Alertas
    alertThresholds: {
        cpuWarning: { type: Number, default: 80 },
        cpuCritical: { type: Number, default: 95 },
        memoryWarning: { type: Number, default: 80 },
        memoryCritical: { type: Number, default: 95 },
        temperatureWarning: { type: Number, default: 60 },
        temperatureCritical: { type: Number, default: 75 }
    },
    
    // Credenciais de acesso (referência ao cofre)
    credential: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Credential'
    },
    
    // Relacionamentos
    connectedTo: [{
        device: { type: mongoose.Schema.Types.ObjectId, ref: 'NetworkDevice' },
        port: { type: String },
        description: { type: String }
    }],
    
    // Vinculação com ativo
    asset: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Asset'
    },
    
    // Metadados
    managedBy: {
        type: String,
        enum: ['snmp', 'api', 'manual'],
        default: 'manual'
    },
    snmpCommunity: {
        type: String,
        trim: true
    },
    notes: {
        type: String
    },
    tags: [{
        type: String,
        trim: true
    }],
    
    // Garantia e Suporte
    purchaseDate: { type: Date },
    warrantyExpiration: { type: Date },
    supportContract: { type: String }
    
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Índices para performance
networkDeviceSchema.index({ status: 1 });
networkDeviceSchema.index({ type: 1 });
networkDeviceSchema.index({ location: 1 });
networkDeviceSchema.index({ ipAddress: 1 });

// Virtual para verificar se está em alerta
networkDeviceSchema.virtual('hasAlert').get(function() {
    if (!this.metrics) return false;
    
    const cpu = this.metrics.cpuUsage || 0;
    const memory = this.metrics.memoryUsage || 0;
    const temp = this.metrics.temperature || 0;
    
    return cpu >= this.alertThresholds.cpuWarning ||
           memory >= this.alertThresholds.memoryWarning ||
           temp >= this.alertThresholds.temperatureWarning;
});

// Virtual para calcular portas ativas
networkDeviceSchema.virtual('activePorts').get(function() {
    if (!this.ports || this.ports.length === 0) return 0;
    return this.ports.filter(p => p.status === 'up').length;
});

const NetworkDevice = mongoose.model('NetworkDevice', networkDeviceSchema);

export default NetworkDevice;
