import { Component, input } from '@angular/core';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-stat-card',
  imports: [IconComponent],
  host: { class: 'block rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200' },
  template: `
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <p class="text-sm font-medium text-slate-500">{{ label() }}</p>
        <p class="mt-2 truncate text-2xl font-semibold tracking-tight text-slate-900">{{ value() }}</p>
        @if (hint()) {
          <p class="mt-1 text-xs text-slate-500">{{ hint() }}</p>
        }
      </div>
      @if (icon()) {
        <span class="rounded-lg bg-indigo-50 p-2 text-indigo-600"><app-icon [name]="icon()!" /></span>
      }
    </div>
  `,
})
export class StatCardComponent {
  label = input.required<string>();
  value = input.required<string | number | null>();
  hint = input<string>();
  icon = input<string>();
}
