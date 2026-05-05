import mongoose from 'mongoose';

const pcpParametroCustoSchema = new mongoose.Schema({
    vigenciaInicio: { type: Date, required: true },
    vigenciaFim: { type: Date, required: true },
    custoMaoDeObraHora: { type: Number, required: true }, // R$/h
    custoOverheadHora: { type: Number, required: true },    // R$/h
    custoEmbalagemPorPeca: { type: Number, default: 0 },
    custoInsumosPorKg: { type: Number, default: 0 },
    custoParadaHora: { type: Number, default: 0 },
    incluirTempoParadoNoCusto: { type: Boolean, default: true }
}, { timestamps: true });

const PcpParametroCusto = mongoose.model('PcpParametroCusto', pcpParametroCustoSchema);
export default PcpParametroCusto;
