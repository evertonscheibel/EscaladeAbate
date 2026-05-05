import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DeviceService } from '../../services/device.service';
import { Device, DeviceType, DeviceStatus } from '../../models';
import { DeviceDialogComponent } from './device-dialog.component';
import { SwitchFaceplateComponent } from '../hardware/switch-faceplate.component';
import { AiAuditService } from '../../services/ai-audit.service';
import { AiReportModalComponent } from '../ai/ai-report-modal.component';

@Component({
    selector: 'app-inventory-grid',
    standalone: true,
    imports: [CommonModule, FormsModule, DeviceDialogComponent, SwitchFaceplateComponent, AiReportModalComponent],
    template: `
    <div class="space-y-6">
      <app-device-dialog 
        *ngIf="showModal()" 
        [device]="selectedDevice()"
        (close)="closeModal()"
        (save)="saveDevice($event)">
      </app-device-dialog>

      <app-switch-faceplate
        *ngIf="showFaceplate()"
        [device]="selectedDevice()!"
        (close)="closeFaceplate()">
      </app-switch-faceplate>

      <app-ai-report-modal
        *ngIf="showAiReport()"
        [report]="aiReport()"
        (close)="closeAiReport()">
      </app-ai-report-modal>

      <!-- Toolbar -->
      <div class="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div class="flex items-center gap-4 flex-1 min-w-[300px]">
          <div class="relative flex-1 max-w-md">
            <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </span>
            <input 
              type="text" 
              [(ngModel)]="searchQuery"
              placeholder="Search by name, IP or location..." 
              class="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            >
          </div>
          
          <div class="flex bg-slate-100 p-1 rounded-xl gap-1">
            <button 
              *ngFor="let type of filterTypes"
              (click)="selectedType.set(type)"
              [ngClass]="selectedType() === type ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'"
              class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
            >
              {{ type }}
            </button>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <button 
            (click)="triggerAiAudit()"
            class="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-purple-200 hover:shadow-purple-300 transform transition-all active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
            </svg>
            AI Audit
          </button>
          <button 
            (click)="openAddDeviceModal()"
            class="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all active:scale-95"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Add Device
          </button>
        </div>
      </div>

      <!-- Grid / Table -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50/50 border-b border-slate-100">
                <th class="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Device</th>
                <th class="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th class="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Métricas</th>
                <th class="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Location</th>
                <th class="px-6 py-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let device of filteredDevices()" class="hover:bg-slate-50/80 transition-colors group">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div [ngClass]="getTypeIconClass(device.type)" class="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm">
                      <svg *ngIf="device.type === 'Switch'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126a3.375 3.375 0 012.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m-13.5 3a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM16.5 14.25a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" /></svg>
                      <svg *ngIf="device.type === 'AP'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" /></svg>
                      <svg *ngIf="device.type !== 'Switch' && device.type !== 'AP'" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-10.5v10.5" /></svg>
                    </div>
                    <div>
                      <div class="text-sm font-bold text-slate-900">{{ device.name }}</div>
                      <div class="text-[11px] text-slate-500 font-mono">{{ device.ip }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span [ngClass]="getStatusClass(device.status)" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    <span class="w-1.5 h-1.5 rounded-full bg-current"></span>
                    {{ device.status }}
                  </span>
                </td>
                <td class="px-6 py-4">
                  <div class="w-48 space-y-2">
                    <div class="flex items-center justify-between text-[10px] font-semibold text-slate-600">
                      <span>CPU</span>
                      <span>{{ device.metrics.cpu }}%</span>
                    </div>
                    <div class="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div [style.width.%]="device.metrics.cpu" 
                           [ngClass]="getMetricColor(device.metrics.cpu)"
                           class="h-full transition-all duration-500"></div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center gap-2 text-xs text-slate-600">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-slate-400">
                       <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                     </svg>
                     {{ device.location }}
                  </div>
                </td>
                <td class="px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button *ngIf="device.type === 'Switch'" (click)="openSwitchFaceplate(device)" class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Manage Ports">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 013.75 9.375v-4.5zM3.75 14.625c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5a1.125 1.125 0 01-1.125-1.125v-4.5zM13.5 4.875c0-.621.504-1.125 1.125-1.125h4.5c.621 0 1.125.504 1.125 1.125v4.5c0 .621-.504 1.125-1.125 1.125h-4.5A1.125 1.125 0 0113.5 9.375v-4.5z" />
                      </svg>
                    </button>
                    <button class="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                      </svg>
                    </button>
                    <button (click)="deviceService.deleteDevice(device.id)" class="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredDevices().length === 0">
                <td colspan="5" class="px-6 py-20 text-center">
                  <div class="flex flex-col items-center">
                    <div class="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                       <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
                         <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                       </svg>
                    </div>
                    <h3 class="text-sm font-bold text-slate-900">No devices found</h3>
                    <p class="text-xs text-slate-500 mt-1">Try adjusting your search or filters.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
    styles: []
})
export class InventoryGridComponent {
    deviceService = inject(DeviceService);

    searchQuery = '';
    selectedType = signal<string>('All');
    filterTypes = ['All', 'Switch', 'AP', 'Server', 'Camera'];

    showModal = signal(false);
    showFaceplate = signal(false);
    showAiReport = signal(false);
    aiReport = signal('');
    isAuditing = signal(false);
    selectedDevice = signal<Device | null>(null);

    private aiAuditService = inject(AiAuditService);

    filteredDevices = computed(() => {
        let devs = this.deviceService.allDevices();

        // Type Filter
        if (this.selectedType() !== 'All') {
            devs = devs.filter(d => d.type === this.selectedType());
        }

        // Search Query
        const query = this.searchQuery.toLowerCase().trim();
        if (query) {
            devs = devs.filter(d =>
                d.name.toLowerCase().includes(query) ||
                d.ip.includes(query) ||
                d.location.toLowerCase().includes(query)
            );
        }

        return devs;
    });

    getTypeIconClass(type: DeviceType) {
        switch (type) {
            case 'Switch': return 'bg-blue-600';
            case 'AP': return 'bg-purple-600';
            case 'Router': return 'bg-indigo-600';
            case 'Firewall': return 'bg-rose-600';
            case 'Server': return 'bg-emerald-600';
            case 'Camera': return 'bg-teal-600';
            default: return 'bg-slate-600';
        }
    }

    getStatusClass(status: DeviceStatus) {
        switch (status) {
            case 'Online': return 'bg-green-50 text-green-600';
            case 'Offline': return 'bg-red-50 text-red-600';
            case 'Warning': return 'bg-yellow-50 text-yellow-600';
            case 'Maintenance': return 'bg-slate-50 text-slate-600';
            default: return 'bg-slate-50 text-slate-600';
        }
    }

    getMetricColor(value: number) {
        if (value > 85) return 'bg-rose-500';
        if (value > 60) return 'bg-yellow-500';
        return 'bg-blue-500';
    }

    async triggerAiAudit() {
        if (this.isAuditing()) return;

        this.isAuditing.set(true);
        try {
            const report = await this.aiAuditService.generateNetworkAudit(this.deviceService.allDevices());
            this.aiReport.set(report);
            this.showAiReport.set(true);
        } finally {
            this.isAuditing.set(false);
        }
    }

    closeAiReport() {
        this.showAiReport.set(false);
        this.aiReport.set('');
    }

    openAddDeviceModal() {
        this.selectedDevice.set(null);
        this.showModal.set(true);
    }

    closeModal() {
        this.showModal.set(false);
        this.selectedDevice.set(null);
    }

    saveDevice(data: any) {
        if (this.selectedDevice()) {
            this.deviceService.updateDevice(this.selectedDevice()!.id, data);
        } else {
            this.deviceService.addDevice({
                ...data,
                metrics: { cpu: 0, ram: 0, temp: 40, uptime: '0d' }
            } as Device);
        }
        this.closeModal();
    }

    closeFaceplate() {
        this.showFaceplate.set(false);
        this.selectedDevice.set(null);
    }

    openSwitchFaceplate(device: Device) {
        this.selectedDevice.set(device);
        this.showFaceplate.set(true);
    }
}
