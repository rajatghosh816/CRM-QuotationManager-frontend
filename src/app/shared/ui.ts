/**
 * Shared Tailwind class strings, so buttons and form controls look the same
 * everywhere. Tailwind scans .ts files too, so these classes are generated.
 */
export const ui = {
  btnPrimary:
    'inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50',
  btnSecondary:
    'inline-flex items-center justify-center gap-2 rounded-lg bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-300 ring-inset hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50',
  btnDanger:
    'inline-flex items-center justify-center gap-2 rounded-lg bg-rose-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-50',
  btnSuccess:
    'inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50',
  btnGhost:
    'inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50',
  btnGhostDanger:
    'inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:opacity-50',
  label: 'mb-1 block text-sm font-medium text-slate-700',
  input:
    'block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm ring-1 ring-slate-300 ring-inset placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-600 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500',
  card: 'rounded-xl bg-white shadow-sm ring-1 ring-slate-200',
  th: 'px-4 py-3 text-left text-xs font-semibold tracking-wide text-slate-500 uppercase',
  td: 'px-4 py-3 text-sm text-slate-700',
  link: 'font-medium text-indigo-600 hover:text-indigo-500',
} as const;
