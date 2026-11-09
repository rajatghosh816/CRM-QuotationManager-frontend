import { Component } from '@angular/core';

@Component({
  selector: 'app-loading',
  host: { class: 'flex items-center justify-center gap-3 py-16 text-sm text-slate-500' },
  template: `
    <span class="size-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600"></span>
    Loading…
  `,
})
export class LoadingComponent {}
