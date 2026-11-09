import { Component, input } from '@angular/core';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-empty-state',
  imports: [IconComponent],
  host: { class: 'block px-6 py-14 text-center' },
  template: `
    <span class="mx-auto mb-3 inline-flex rounded-xl bg-indigo-50 p-3 text-indigo-600">
      <app-icon [name]="icon()" size="size-6" />
    </span>
    <p class="text-sm font-semibold text-slate-900">{{ title() }}</p>
    @if (message()) {
      <p class="mx-auto mt-1 max-w-sm text-sm text-slate-500">{{ message() }}</p>
    }
    <div class="mt-4 flex justify-center"><ng-content /></div>
  `,
})
export class EmptyStateComponent {
  icon = input('document');
  title = input.required<string>();
  message = input<string>();
}
