import { Component, computed, input } from '@angular/core';

const STYLES: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  sent: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  viewed: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  accepted: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  rejected: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  expired: 'bg-amber-50 text-amber-800 ring-amber-600/20',
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  trial: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  suspended: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  disabled: 'bg-slate-100 text-slate-600 ring-slate-500/20',
};

/** Coloured pill for quotation, business and user statuses. */
@Component({
  selector: 'app-status-badge',
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.scss',
})
export class StatusBadgeComponent {
  status = input.required<string>();
  /** Customers see "Awaiting your response" instead of "sent"/"viewed". */
  customerView = input(false);

  label = computed(() => {
    const s = this.status();
    if (this.customerView() && (s === 'sent' || s === 'viewed')) return 'Awaiting response';
    return s.charAt(0).toUpperCase() + s.slice(1);
  });

  classes = computed(() => {
    const s = this.customerView() && this.status() === 'viewed' ? 'sent' : this.status();
    return `inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap ${STYLES[s] ?? STYLES['draft']}`;
  });
}
