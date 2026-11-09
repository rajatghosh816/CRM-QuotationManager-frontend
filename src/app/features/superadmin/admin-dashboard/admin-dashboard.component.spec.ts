import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { adminApiSpy, httpError, makeBusiness, makePlatformStats, Spied, textOf, toastSpy } from '../../../../testing/fixtures';
import { PlatformStats } from '../../../core/models';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { AdminDashboardComponent } from './admin-dashboard.component';

describe('AdminDashboardComponent', () => {
  let fixture: ComponentFixture<AdminDashboardComponent>;
  let api: Spied<AdminApiService>;
  let toast: Spied<ToastService>;
  const el = () => fixture.nativeElement as HTMLElement;

  function setup(stats: PlatformStats | null = makePlatformStats()): void {
    api = adminApiSpy();
    api.stats.and.returnValue(stats ? of(stats) : throwError(() => httpError('Down', 500)));
    toast = toastSpy();
    TestBed.configureTestingModule({
      imports: [AdminDashboardComponent],
      providers: [provideRouter([]), { provide: AdminApiService, useValue: api }, { provide: ToastService, useValue: toast }],
    });
    fixture = TestBed.createComponent(AdminDashboardComponent);
    fixture.detectChanges();
  }

  it('should render the four stat cards with the status breakdown', () => {
    setup();
    expect(el().querySelectorAll('app-stat-card').length).toBe(4);
    const text = textOf(el());
    expect(text).toContain('2 active · 1 trial · 1 suspended');
    expect(text).toContain('$196');
  });

  it('should draw plan bars proportional to the number of businesses', () => {
    setup(
      makePlatformStats({
        businesses: 4,
        planBreakdown: [
          { planId: 'a', planName: 'Starter', count: 1 },
          { planId: 'b', planName: 'Pro', count: 3 },
        ],
      }),
    );
    const bars = Array.from(el().querySelectorAll<HTMLElement>('.bg-indigo-500'));
    expect(bars.map((b) => b.style.width)).toEqual(['25%', '75%']);
  });

  it('should not divide by zero when there are no businesses', () => {
    setup(makePlatformStats({ businesses: 0, planBreakdown: [{ planId: 'a', planName: 'Starter', count: 0 }] }));
    expect(el().querySelector<HTMLElement>('.bg-indigo-500')!.style.width).toBe('0%');
  });

  it('should list the newest businesses with edit links', () => {
    setup(makePlatformStats({ recentBusinesses: [makeBusiness({ id: 'b9', name: 'Nimbus IT' })] }));
    const link = el().querySelector<HTMLAnchorElement>('tbody a')!;
    expect(link.textContent).toBe('Nimbus IT');
    expect(link.getAttribute('href')).toBe('/superadmin/businesses/b9/edit');
  });

  it('should toast an error and keep showing loading when stats fail', () => {
    setup(null);
    expect(toast.error).toHaveBeenCalledWith('Down');
    expect(el().querySelector('app-loading')).not.toBeNull();
  });
});
