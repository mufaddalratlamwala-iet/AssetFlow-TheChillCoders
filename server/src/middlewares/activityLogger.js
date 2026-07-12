const ActivityLog = require('../models/ActivityLog');

const logActivity = (entityType) => {
    return (req, res, next) => {
        res.on('finish', async () => {
            if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) && res.statusCode >= 200 && res.statusCode < 300) {
                try {
                    const entityId = req.params.id || null;
                    const employeeId = req.user ? req.user.id : null;

                    if (employeeId) {
                        await ActivityLog.create({
                            employeeId,
                            action: req.method,
                            entityType,
                            entityId,
                            metadata: {
                                path: req.originalUrl,
                                body: req.body
                            }
                        });
                    }
                } catch (error) {
                    console.error('Error logging activity:', error);
                }
            }
        });

        next();
    };
};

module.exports = {
    logActivity
};
