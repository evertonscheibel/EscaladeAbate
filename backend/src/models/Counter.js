import mongoose from 'mongoose';

/**
 * Counter atômico para geração de IDs sequenciais seguros.
 * Substitui Math.random() e countDocuments() que são vulneráveis a colisões.
 * 
 * Uso:
 *   const counter = await Counter.findByIdAndUpdate(
 *     { _id: 'ticket' },
 *     { $inc: { seq: 1 } },
 *     { new: true, upsert: true }
 *   );
 *   const ticketNumber = `TK-${year}${month}-${counter.seq}`;
 */

const counterSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true
    },
    seq: {
        type: Number,
        default: 0
    }
});

const Counter = mongoose.model('Counter', counterSchema);

export default Counter;
