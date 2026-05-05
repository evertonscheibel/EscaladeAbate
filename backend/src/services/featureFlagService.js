const features = {
    maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
    enableAuditLogs: true,
    enableBullMQ: true,
    enableSifVersioning: true,
    newDashboard: process.env.NEW_DASHBOARD === 'true'
};

export const isFeatureEnabled = (featureName) => {
    return !!features[featureName];
};

export const getFeatureFlags = () => ({ ...features });

export const setFeatureFlag = (name, value) => {
    if (features[name] !== undefined) {
        features[name] = value;
        return true;
    }
    return false;
};
