import { Component, input } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-stat-card',
  imports: [IconComponent],
  host: { class: 'block rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200' },
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.scss',
})
export class StatCardComponent {
  label = input.required<string>();
  value = input.required<string | number | null>();
  hint = input<string>();
  icon = input<string>();
}
