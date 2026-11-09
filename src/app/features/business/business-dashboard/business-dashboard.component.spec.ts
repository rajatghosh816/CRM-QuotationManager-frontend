import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { businessApiSpy, httpError, makeBusiness, makeBusinessStats, makeQuotation, Spied, textOf, toastSpy } from '../../../../testing/fixtures';
import { BusinessStats } from '../../../core/models';
import { BusinessApiService } from '../../../core/services/business-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { BusinessDashboardComponent } from './business-dashboard.component';

describe('BusinessDashboardComponent', () => {
  let fixture: ComponentFixture<BusinessDashboardComponent>;
  let api: Spied<BusinessApiService>;
  let toast: Spied<ToastService>;
  const el = () => fixture.nativeElement as HTMLElement;

  function setup(stats: BusinessStats = makeBusinessStats(), fail = false): void {
    api = businessApiSpy();
    api.stats.and.returnValue(fail ? throwError(() => httpError('Down', 500)) : of(stats));
    api.profile.and.returnValue(of(makeBusiness({ name: 'Acme Interiors', currency: 'USD' })));
    toast = toastSpy();
    TestBed.configureTestingModule({
      imports: [BusinessDashboardComponent],
      providers: [provideRouter([]), { provide: BusinessApiService, useValue: api }, { provide: ToastService, useValue: toast }],
    });
    fixture = TestBed.createComponent(BusinessDashboardComponent);
    fixture.detectChanges();
  }

  it('should show the business name and the four stat cards', () => {
    setup();
    const text = textOf(el());
    expect(el().querySelector('h1')!.textContent).toBe('Acme Interiors');
    expect(el().querySelectorAll('app-stat-card').length).toBe(4);
    expect(text).toContain('$5,000 in open quotes');
    expect(text).toContain('$8,000');
    expect(text).toContain('80%');
    expect(text).toContain('4 won · 1 lost');
    expect(text).toContain('6 customers · 12 products');
  });

  it('should show the empty state when there are no recent quotations', () => {
    setup();
    expect(text()).toContain('No quotations yet');
    function text() {
      return textOf(el());
    }
  });

  it('should list recent quotations with totals and links', () => {
    setup(makeBusinessStats({ recent: [makeQuotation({ id: 'q7', number: 'ACM-0007' })] }));
    const row = el().querySelector('tbody tr') as HTMLElement;
    expect(row.querySelector('a')!.getAttribute('href')).toBe('/business/quotations/q7');
    expect(textOf(row)).toContain('John Carter');
    expect(textOf(row)).toContain('$1,100.00');
  });

  it('should toast an error and keep loading when data fails', () => {
    setup(undefined, true);
    expect(toast.error).toHaveBeenCalledWith('Down');
    expect(el().querySelector('app-loading')).not.toBeNull();
  });
});
