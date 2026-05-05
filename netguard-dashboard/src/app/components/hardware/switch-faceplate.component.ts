import { Component, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Device, PortConfig } from '../../models';

@Component({
    selector: 'app-switch-faceplate',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
      <div class="bg-[#1e293b] rounded-[2rem] shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-700 flex flex-col h-[600px] transform transition-all animate-in fade-in zoom-in duration-300">
        <!-- Header -->
        <div class="px-10 py-8 border-b border-slate-700 flex items-center justify-between bg-slate-800/50">
          <div class="flex items-center gap-6">
             <div class="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-7 h-7">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126a3.375 3.375 0 012.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m-13.5 3a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM16.5 14.25a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                </svg>
             </div>
             <div>
                <h2 class="text-2xl font-black text-white tracking-tight">{{ device().name }}</h2>
                <div class="flex items-center gap-3 mt-1">
                   <span class="text-xs font-mono text-slate-400">IP: {{ device().ip }}</span>
                   <span class="w-1 h-1 bg-slate-600 rounded-full"></span>
                   <span class="text-[10px] font-bold uppercase tracking-widest text-blue-400">24-Port Gigabit PoE+ Managed Switch</span>
                </div>
             </div>
          </div>
          <button (click)="close.emit()" class="text-slate-400 hover:text-white p-3 rounded-2xl hover:bg-slate-700 transition-all group">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6 transform group-hover:rotate-90 transition-transform">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="flex-1 flex overflow-hidden">
          <!-- Main Faceplate Area -->
          <div class="flex-1 p-10 flex flex-col justify-center bg-gradient-to-br from-[#1e293b] to-[#0f172a]">
             <!-- Switch Chassis -->
             <div class="bg-[#2d3748] p-1 rounded-xl shadow-2xl border-t border-slate-600 border-l border-slate-600 mb-8">
               <div class="bg-[#1a202c] rounded-lg p-8 py-12 flex flex-wrap gap-4 justify-center relative overflow-hidden">
                  <!-- Ports Grid -->
                  <div class="grid grid-cols-12 gap-x-4 gap-y-8 relative z-10">
                     <div *ngFor="let port of device().ports" 
                          (click)="selectedPort.set(port)"
                          class="group cursor-pointer flex flex-col items-center gap-2">
                        <!-- Port Status LED -->
                        <div class="flex gap-1 mb-1">
                           <div [ngClass]="port.status === 'UP' ? 'bg-green-400 shadow-[0_0_8px_#4ade80]' : 'bg-slate-700'" class="w-1.5 h-1.5 rounded-full transition-all"></div>
                           <div *ngIf="port.poe" class="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#fbbf24]"></div>
                        </div>
                        
                        <!-- RJ45 Jack -->
                        <div [ngClass]="selectedPort()?.id === port.id ? 'ring-2 ring-blue-500 scale-110' : 'hover:bg-slate-700'" 
                             class="w-12 h-12 bg-slate-800 rounded border border-slate-600 flex items-center justify-center relative transition-all">
                           <div class="w-8 h-6 border-b border-x border-slate-500 rounded-b-sm"></div>
                           <div class="absolute inset-0 flex items-center justify-center">
                              <span class="text-[9px] font-black text-slate-500 mt-4">{{ port.id }}</span>
                           </div>
                        </div>
                     </div>
                  </div>

                  <!-- Chassis Details -->
                  <div class="absolute left-4 top-4 flex flex-col gap-2">
                     <div class="text-[8px] font-bold text-slate-600 uppercase">Status</div>
                     <div class="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]"></div>
                     <div class="w-2 h-2 rounded-full bg-slate-700"></div>
                  </div>
               </div>
             </div>
             
             <!-- Chassis Labels -->
             <div class="flex justify-between px-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                <span>Model: NG-X24-PRO</span>
                <span>HW REV: 2.1</span>
                <span>S/N: NG-{{ device().id.toUpperCase() }}</span>
             </div>
          </div>

          <!-- Port Detail Sidebar -->
          <div class="w-80 bg-slate-900 border-l border-slate-700 p-8 flex flex-col">
             <div *ngIf="selectedPort(); else noPortSelected" class="space-y-8 animate-in slide-in-from-right duration-300">
                <div>
                   <h3 class="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Port {{ selectedPort()?.id }} Details</h3>
                   <div [ngClass]="selectedPort()?.status === 'UP' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'" 
                        class="p-4 rounded-2xl border flex items-center justify-between">
                      <span class="text-sm font-bold uppercase">{{ selectedPort()?.status }}</span>
                      <span class="text-xs">{{ selectedPort()?.speed }} Mbps</span>
                   </div>
                </div>

                <div class="space-y-4">
                   <div>
                      <label class="block text-[10px] font-bold text-slate-500 uppercase mb-2">Connected Device</label>
                      <div class="bg-slate-800 p-3 rounded-xl border border-slate-700 text-sm text-slate-200 font-medium">
                         {{ selectedPort()?.connectedDevice || 'Disconnected' }}
                      </div>
                   </div>

                   <div class="grid grid-cols-2 gap-4">
                      <div>
                         <label class="block text-[10px] font-bold text-slate-500 uppercase mb-2">VLAN</label>
                         <div class="bg-slate-800 p-3 rounded-xl border border-slate-700 text-sm text-slate-200 font-mono">
                            {{ selectedPort()?.vlan }}
                         </div>
                      </div>
                      <div>
                         <label class="block text-[10px] font-bold text-slate-500 uppercase mb-2">PoE Status</label>
                         <div [ngClass]="selectedPort()?.poe ? 'text-amber-400' : 'text-slate-500'" 
                              class="bg-slate-800 p-3 rounded-xl border border-slate-700 text-xs font-bold uppercase">
                            {{ selectedPort()?.poe ? 'Active' : 'Disabled' }}
                         </div>
                      </div>
                   </div>
                </div>

                <div class="pt-6 border-t border-slate-800">
                   <button class="w-full bg-slate-800 hover:bg-slate-700 text-white rounded-xl py-3 text-sm font-bold transition-all mb-3 text-center">
                      Edit Port Config
                   </button>
                   <button class="w-full border border-slate-700 hover:bg-red-500/10 hover:text-red-400 text-slate-400 rounded-xl py-3 text-sm font-bold transition-all">
                      Shutdown Port
                   </button>
                </div>
             </div>
             <ng-template #noPortSelected>
                <div class="h-full flex flex-col items-center justify-center text-center">
                   <div class="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-slate-600 mb-4 animate-pulse">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                      </svg>
                   </div>
                   <h4 class="text-sm font-bold text-slate-400">No Port Selected</h4>
                   <p class="text-xs text-slate-600 mt-2 leading-relaxed px-4">Click on an RJ45 port to see configuration and live metrics.</p>
                </div>
             </ng-template>
          </div>
        </div>
      </div>
    </div>
  `,
    styles: []
})
export class SwitchFaceplateComponent {
    device = input.required<Device>();
    close = output<void>();

    selectedPort = signal<PortConfig | null>(null);
}
