import { Injectable, signal, computed } from '@angular/core';
import { Device, Alert, DeviceType, DeviceStatus } from '../models';

@Injectable({
    providedIn: 'root'
})
export class DeviceService {
    private devices = signal<Device[]>([]);
    private alerts = signal<Alert[]>([]);

    readonly allDevices = this.devices.asReadonly();
    readonly allAlerts = this.alerts.asReadonly();

    readonly healthScore = computed(() => {
        const total = this.devices().length;
        if (total === 0) return 100;
        const online = this.devices().filter(d => d.status === 'Online').length;
        return Math.round((online / total) * 100);
    });

    readonly criticalAlertsCount = computed(() =>
        this.alerts().filter(a => a.severity === 'Critical').length
    );

    constructor() {
        this.generateMockData();
    }

    private generateMockData() {
        const types: DeviceType[] = ['Switch', 'AP', 'Router', 'Firewall', 'Server', 'Camera'];
        const statuses: DeviceStatus[] = ['Online', 'Online', 'Online', 'Warning', 'Offline', 'Maintenance'];

        const mockDevices: Device[] = [];
        for (let i = 1; i <= 25; i++) {
            const type = types[Math.floor(Math.random() * types.length)];
            const status = statuses[Math.floor(Math.random() * statuses.length)];

            mockDevices.push({
                id: `dev-${i}`,
                name: `${type}-${i.toString().padStart(3, '0')}`,
                ip: `192.168.1.${10 + i}`,
                type,
                status,
                location: ['Data Center A', 'Office Floor 1', 'Main Entrance', 'Server Room'][Math.floor(Math.random() * 4)],
                metrics: {
                    cpu: Math.floor(Math.random() * 100),
                    ram: Math.floor(Math.random() * 100),
                    temp: 35 + Math.floor(Math.random() * 30),
                    uptime: `${Math.floor(Math.random() * 30)}d ${Math.floor(Math.random() * 24)}h`
                },
                lastSeen: new Date().toISOString(),
                ...(type === 'Switch' ? { ports: this.generateMockPorts() } : {})
            });
        }

        const mockAlerts: Alert[] = [
            { id: 'a1', deviceId: 'dev-1', deviceName: 'Switch-001', severity: 'Critical', message: 'Port 5 Link Down', timestamp: new Date().toISOString() },
            { id: 'a2', deviceId: 'dev-5', deviceName: 'Server-005', severity: 'Warning', message: 'High CPU Usage (85%)', timestamp: new Date(Date.now() - 3600000).toISOString() },
            { id: 'a3', deviceId: 'dev-10', deviceName: 'AP-010', severity: 'Info', message: 'Firmware Update Available', timestamp: new Date(Date.now() - 7200000).toISOString() }
        ];

        this.devices.set(mockDevices);
        this.alerts.set(mockAlerts);
    }

    private generateMockPorts() {
        return Array.from({ length: 24 }, (_, i) => ({
            id: i + 1,
            status: Math.random() > 0.2 ? 'UP' : 'DOWN' as 'UP' | 'DOWN',
            poe: Math.random() > 0.5,
            vlan: [10, 20, 30, 40][Math.floor(Math.random() * 4)],
            speed: ['10', '100', '1000'][Math.floor(Math.random() * 3)] as '10' | '100' | '1000',
            connectedDevice: Math.random() > 0.4 ? `User-PC-${i}` : undefined
        }));
    }

    addDevice(device: Partial<Device>) {
        const newDevice = { ...device, id: `dev-${Date.now()}` } as Device;
        this.devices.update(devs => [...devs, newDevice]);
    }

    updateDevice(id: string, updates: Partial<Device>) {
        this.devices.update(devs => devs.map(d => d.id === id ? { ...d, ...updates } : d));
    }

    deleteDevice(id: string) {
        this.devices.update(devs => devs.filter(d => d.id !== id));
    }
}
