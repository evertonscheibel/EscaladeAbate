import mongoose from 'mongoose';

const closureLineSchema = new mongoose.Schema({
    sequence: { type: Number, required: true },
    preLotRefId: { type: String, required: true }, // chave de dedupe vinda da pré-escala
    producerName: { type: String, required: true },
    municipio: { type: String, default: '' },
    uf: { type: String, maxlength: 2, uppercase: true, default: '' },

    brokerCode: String,
    brokerName: String,
    boi: { type: Number, default: 0, min: 0 },
    vaca: { type: Number, default: 0, min: 0 },
    novilha: { type: Number, default: 0, min: 0 },
    bubalino: { type: Number, default: 0, min: 0 },
    touro: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0 },
    // --- Campos específicos do Fechamento SIF ---
    curral: { type: String, trim: true },       // obrigatório ao fechar
    cor: { type: String, trim: true },           // cor da ficha/brinco
    nf: { type: String, trim: true },            // nota fiscal
    gta: { type: String, trim: true },           // GTA
    observations: String
});

closureLineSchema.pre('save', function () {
    this.total = (this.boi || 0) + (this.vaca || 0) + (this.novilha || 0) + (this.bubalino || 0) + (this.touro || 0);
});

const slaughterClosureSchema = new mongoose.Schema({
    date: { type: Date, required: true, unique: true },
    scheduleId: { type: mongoose.Schema.Types.ObjectId, ref: 'SlaughterSchedule' },
    status: { type: String, enum: ['DRAFT', 'CLOSED'], default: 'DRAFT' },

    header: {
        slaughterDate: Date,
        sifNumber: { type: String, default: 'SIF XXXX' }, // número fixo do estabelecimento
        veterinarian: String,
        notes: String
    },
    lines: [closureLineSchema],
    totalCattle: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    closedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    closedAt: Date,
    reopenLog: [{
        by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        at: { type: Date, default: Date.now },
        reason: { type: String, required: true }
    }]
}, { timestamps: true });

slaughterClosureSchema.pre('save', function () {
    this.totalCattle = this.lines.reduce((sum, line) => sum + (line.total || 0), 0);
});

slaughterClosureSchema.index({ date: 1 }, { unique: true });

const SlaughterClosure = mongoose.model('SlaughterClosure', slaughterClosureSchema);
export default SlaughterClosure;
