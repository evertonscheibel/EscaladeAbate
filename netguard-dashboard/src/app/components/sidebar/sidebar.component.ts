import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DeviceService } from '../../services/device.service';

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="h-full flex flex-col bg-white border-r border-slate-200 w-80 overflow-hidden shadow-sm">
      <!-- Header -->
      <div class="p-6 border-b border-slate-100 bg-slate-50/50">
        <h1 class="text-xl font-bold text-slate-900 flex items-center gap-2">
          <span class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5-10.5l-22.5 9A1.125 1.125 0 002.25 12V21" />
            </svg>
          </span>
          NetGuard
        </h1>
        <p class="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">NOC Dashboard v2.0</p>
      </div>

      <!-- Health Score -->
      <div class="p-6 border-b border-slate-100">
        <div class="flex items-center justify-between mb-4">
          <span class="text-sm font-medium text-slate-700">Health Score</span>
          <span class="text-xs font-bold px-2 py-1 rounded bg-green-100 text-green-700">Real-time</span>
        </div>
        <div class="relative pt-1">
          <div class="flex mb-2 items-center justify-between">
            <div>
              <span class="text-3xl font-bold inline-block text-blue-600">
                {{ deviceService.healthScore() }}%
              </span>
            </div>
            <div class="text-right">
              <span class="text-xs font-semibold inline-block text-slate-600">
                {{ deviceService.allDevices().length }} Devices
              </span>
            </div>
          </div>
          <div class="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-slate-100">
            <div [style.width.%]="deviceService.healthScore()" 
                 class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-1000"
                 [ngClass]="getHealthColorClass()"></div>
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-3">
          <div class="bg-blue-50 p-3 rounded-xl border border-blue-100">
             <div class="text-xs text-blue-600 font-bold uppercase mb-1">Alerts</div>
             <div class="text-xl font-bold text-blue-900">{{ deviceService.allAlerts().length }}</div>
          </div>
          <div class="bg-red-50 p-3 rounded-xl border border-red-100">
             <div class="text-xs text-red-600 font-bold uppercase mb-1">Critical</div>
             <div class="text-xl font-bold text-red-900">{{ deviceService.criticalAlertsCount() }}</div>
          </div>
        </div>
      </div>

      <!-- Feed Section -->
      <div class="flex-1 flex flex-col min-h-0 bg-slate-50/30">
        <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white/50 backdrop-blur-sm">
          <h2 class="text-xs font-bold text-slate-500 uppercase tracking-widest">Activity Feed</h2>
          <span class="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
        </div>
        <div class="flex-1 overflow-y-auto px-4 py-4 space-y-3 custom-scrollbar">
          <div *ngFor="let alert of deviceService.allAlerts()" 
               class="p-4 rounded-2xl bg-white border border-slate-100 shadow-sm transition-all hover:shadow-md hover:border-blue-200 group">
            <div class="flex items-start gap-3">
              <div [ngClass]="getSeverityClass(alert.severity)" class="mt-1 w-2 h-2 rounded-full flex-shrink-0"></div>
              <div class="flex-1 min-w-0">
                <div class="flex justify-between items-start mb-1">
                  <span class="text-xs font-bold text-slate-800 truncate">{{ alert.deviceName }}</span>
                  <span class="text-[10px] text-slate-400">{{ formatTime(alert.timestamp) }}</span>
                </div>
                <p class="text-xs text-slate-600 leading-relaxed">{{ alert.message }}</p>
                <div class="mt-2 flex gap-2 overflow-hidden">
                   <span class="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">#{{ alert.id }}</span>
                   <span class="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider" 
                         [ngClass]="getSeverityTextClass(alert.severity)">
                        {{ alert.severity }}
                   </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
  `]
})
export class SidebarComponent {
    deviceService = inject(DeviceService);

    getHealthColorClass() {
        const score = this.deviceService.healthScore();
        if (score >= 90) return 'bg-green-500';
        if (score >= 70) return 'bg-yellow-500';
        return 'bg-red-500';
    }

    getSeverityClass(severity: string) {
        if (severity === 'Critical') return 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]';
        if (severity === 'Warning') return 'bg-yellow-500';
        return 'bg-blue-500';
    }

    getSeverityTextClass(severity: string) {
        if (severity === 'Critical') return 'bg-red-50 text-red-600';
        if (severity === 'Warning') return 'bg-yellow-50 text-yellow-600';
        return 'bg-blue-50 text-blue-600';
    }

    formatTime(timestamp: string) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}
