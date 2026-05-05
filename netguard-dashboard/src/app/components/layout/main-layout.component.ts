import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
    selector: 'app-main-layout',
    standalone: true,
    imports: [CommonModule, RouterOutlet, SidebarComponent],
    template: `
    <div class="flex h-screen bg-slate-50 overflow-hidden">
      <!-- Fixed Sidebar -->
      <app-sidebar class="flex-shrink-0"></app-sidebar>

      <!-- Main Content Area -->
      <main class="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <!-- Top Navigation / Toolbar Placeholder (Can be expanded) -->
        <header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 flex-shrink-0">
          <div class="flex items-center gap-4">
             <div class="h-8 w-[1px] bg-slate-200 mx-2"></div>
             <h2 class="text-sm font-semibold text-slate-600 tracking-wide uppercase">Infrastructure Inventory</h2>
          </div>
          <div class="flex items-center gap-4">
            <button class="p-2 text-slate-400 hover:text-blue-600 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
            </button>
            <div class="flex items-center gap-3 pl-4 border-l border-slate-100">
              <div class="text-right hidden sm:block">
                <p class="text-xs font-bold text-slate-900">NOC Admin</p>
                <p class="text-[10px] text-slate-500">Super User</p>
              </div>
              <div class="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-lg border-2 border-white">
                NA
              </div>
            </div>
          </div>
        </header>

        <!-- Dynamic Content Area -->
        <div class="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
    styles: [`
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #cbd5e1; }
  `]
})
export class MainLayoutComponent { }
