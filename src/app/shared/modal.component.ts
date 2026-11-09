import { Component, input, output } from '@angular/core';
import { IconComponent } from './icon.component';

/** Centered dialog. Render it inside an @if and close it via (closed). */
@Component({
  selector: 'app-modal',
  imports: [IconComponent],
  host: { '(document:keydown.escape)': 'closed.emit()' },
  template: `
    <div class="fixed inset-0 z-40 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4"
      (click)="closed.emit()">
      <div role="dialog" aria-modal="true" [attr.aria-label]="title()"
        class="flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl"
        [class]="width()" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h2 class="text-base font-semibold text-slate-900">{{ title() }}</h2>
          <button type="button" class="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            (click)="closed.emit()" aria-label="Close">
            <app-icon name="x" />
          </button>
        </div>
        <div class="overflow-y-auto px-5 py-4">
          <ng-content />
        </div>
      </div>
    </div>
  `,
})
export class ModalComponent {
  title = input.required<string>();
  width = input('sm:max-w-lg');
  closed = output<void>();
}
