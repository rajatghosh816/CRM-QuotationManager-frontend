import { Component } from '@angular/core';

@Component({
  selector: 'app-loading',
  host: { class: 'flex items-center justify-center gap-3 py-16 text-sm text-slate-500' },
  templateUrl: './loading.component.html',
  styleUrl: './loading.component.scss',
})
export class LoadingComponent {}
