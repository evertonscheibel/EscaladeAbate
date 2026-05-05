import mongoose from 'mongoose';

/**
 * Plugin Mongoose para implementar Soft Delete globalmente.
 * Adiciona campos deletedAt e isDeleted, e sobrescreve métodos de busca.
 */
export const softDeletePlugin = (schema) => {
    schema.add({
        isDeleted: {
            type: Boolean,
            default: false,
            index: true
        },
        deletedAt: {
            type: Date
        },
        deletedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    });

    // Filtro global para find, findOne, etc.
    // Usar { $ne: true } para garantir compatibilidade com registros antigos que não possuem o campo
    const excludeDeleted = function () {
        this.where({ isDeleted: { $ne: true } });
    };

    schema.pre('find', excludeDeleted);
    schema.pre('findOne', excludeDeleted);
    schema.pre('findOneAndUpdate', excludeDeleted);
    schema.pre('count', excludeDeleted);
    schema.pre('countDocuments', excludeDeleted);
    schema.pre('aggregate', function (next) {
        // Adiciona um $match no início do pipeline se não houver um
        this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
        next();
    });

    // Método de instância para deletar (soft)
    schema.methods.softDelete = async function (userId) {
        this.isDeleted = true;
        this.deletedAt = new Date();
        this.deletedBy = userId;
        return this.save();
    };

    // Método estático para deletar por ID (soft)
    schema.statics.softDeleteById = async function (id, userId) {
        return this.findByIdAndUpdate(id, {
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: userId
        }, { new: true });
    };
};
