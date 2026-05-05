import Notification from '../models/Notification.js';

// @desc    Listar notificações do usuário
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res, next) => {
    try {
        const { isRead } = req.query;

        let query = { user: req.user.id };

        if (isRead !== undefined) {
            query.isRead = isRead === 'true';
        }

        const notifications = await Notification.find(query)
            .sort({ createdAt: -1 })
            .limit(50);

        res.json({
            success: true,
            count: notifications.length,
            data: notifications
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Marcar notificação como lida
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res, next) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, user: req.user.id },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notificação não encontrada'
            });
        }

        res.json({
            success: true,
            data: notification
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Marcar todas como lidas
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllAsRead = async (req, res, next) => {
    try {
        await Notification.updateMany(
            { user: req.user.id, isRead: false },
            { isRead: true }
        );

        res.json({
            success: true,
            message: 'Todas as notificações marcadas como lidas'
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Deletar notificação
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req, res, next) => {
    try {
        const notification = await Notification.findOneAndDelete({
            _id: req.params.id,
            user: req.user.id
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notificação não encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Notificação deletada'
        });
    } catch (error) {
        next(error);
    }
};
