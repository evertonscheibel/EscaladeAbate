import os from 'os';
import mongoose from 'mongoose';

/**
 * @desc    Check de saúde do sistema (Monitoramento Estruturado)
 * @route   GET /api/health
 * @access  Public
 */
export const getHealth = async (req, res, next) => {
    try {
        const uptime = process.uptime();
        const memoryUsage = process.memoryUsage();
        const cpuLoad = os.loadavg();

        const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

        res.json({
            success: true,
            status: 'UP',
            environment: process.env.NODE_ENV || 'development',
            uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
            timestamp: new Date().toISOString(),
            metrics: {
                memory: {
                    rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
                    heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
                    heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`
                },
                cpu: {
                    loadAvg: cpuLoad
                },
                db: {
                    status: dbStatus
                }
            },
            version: '1.2.0'
        });
    } catch (error) {
        next(error);
    }
};
