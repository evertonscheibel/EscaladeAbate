import { Component, inject, input, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Device, DeviceType } from '../../models';

@Component({
    selector: 'app-device-dialog',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    template: `
    <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 transform transition-all">
        <!-- Header -->
        <div class="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 class="text-xl font-bold text-slate-900">{{ device() ? 'Edit' : 'Add New' }} Device</h2>
            <p class="text-xs text-slate-500 mt-1">Configure network infrastructure parameters</p>
          </div>
          <button (click)="close.emit()" class="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-white transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-6 h-6">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Form -->
        <form [formGroup]="deviceForm" (ngSubmit)="submit()" class="p-8">
          <div class="grid grid-cols-2 gap-6">
            <div class="col-span-2">
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Device Name</label>
              <input type="text" formControlName="name" 
                     class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">IP Address</label>
              <input type="text" formControlName="ip" placeholder="192.168.1.0"
                     class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Type</label>
              <select formControlName="type" 
                      class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium">
                <option *ngFor="let type of deviceTypes" [value]="type">{{ type }}</option>
              </select>
            </div>

            <div class="col-span-2">
              <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Location / Rack</label>
              <input type="text" formControlName="location" 
                     class="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium">
            </div>

            <div *ngIf="isAP()" class="col-span-2 p-5 bg-purple-50 rounded-2xl border border-purple-100 flex items-center justify-between">
              <div class="flex items-center gap-3 text-purple-700">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-8 h-8 opacity-40">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" />
                </svg>
                <div>
                  <h4 class="text-sm font-bold">WiFi Configuration</h4>
                  <p class="text-[11px] opacity-70">Automatic management</p>
                </div>
              </div>
              <label class="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" formControlName="isMesh" class="sr-only peer">
                <div class="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:bg-purple-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all after:peer-checked:translate-x-full"></div>
              </label>
            </div>
          </div>

          <div class="mt-10 flex gap-4">
            <button type="button" (click)="close.emit()" 
                    class="flex-1 px-6 py-3 border border-slate-200 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-50 transition-all">
              Cancel
            </button>
            <button type="submit" [disabled]="deviceForm.invalid"
                    class="flex-[2] px-6 py-3 bg-blue-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-200 hover:shadow-blue-300 disabled:opacity-50 transition-all">
              {{ device() ? 'Save Changes' : 'Create Device' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
    styles: []
})
export class DeviceDialogComponent implements OnInit {
    device = input<Device | null>(null);
    close = output<void>();
    save = output<any>();

    private fb = inject(FormBuilder);
    deviceForm!: FormGroup;

    deviceTypes: DeviceType[] = ['Switch', 'AP', 'Router', 'Firewall', 'Server', 'Camera'];

    ngOnInit() {
        this.deviceForm = this.fb.group({
            name: [this.device()?.name || '', [Validators.required]],
            ip: [this.device()?.ip || '', [Validators.required]],
            type: [this.device()?.type || 'Switch', [Validators.required]],
            location: [this.device()?.location || '', [Validators.required]],
            isMesh: [false]
        });
    }

    isAP() {
        return this.deviceForm.get('type')?.value === 'AP';
    }

    submit() {
        if (this.deviceForm.valid) {
            this.save.emit(this.deviceForm.value);
        }
    }
}
