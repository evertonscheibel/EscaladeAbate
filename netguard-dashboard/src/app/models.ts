export type DeviceType = 'Switch' | 'AP' | 'Router' | 'Firewall' | 'Server' | 'Camera';
export type DeviceStatus = 'Online' | 'Offline' | 'Warning' | 'Maintenance';

export interface PortConfig {
    id: number;
    status: 'UP' | 'DOWN';
    poe: boolean;
    vlan: number;
    speed: '10' | '100' | '1000';
    connectedDevice?: string;
}

export interface Device {
    id: string;
    name: string;
    ip: string;
    type: DeviceType;
    status: DeviceStatus;
    metrics: {
        cpu: number;
        ram: number;
        temp: number;
        uptime: string;
    };
    ports?: PortConfig[];
    location: string;
    lastSeen: string;
}

export interface Alert {
    id: string;
    deviceId: string;
    deviceName: string;
    severity: 'Critical' | 'Warning' | 'Info';
    message: string;
    timestamp: string;
}
