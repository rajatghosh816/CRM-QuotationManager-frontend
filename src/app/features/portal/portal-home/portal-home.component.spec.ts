import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, Subject, throwError } from 'rxjs';
import { Business, CustomerStats, QuotationDetail, QuotationStatus, User } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { PortalApiService } from '../../../core/services/portal-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { PortalHomeComponent } from './portal-home.component';

const business = {
  id: 'b1',
  name: 'Acme Corp',
  email: 'sales@acme.test',
  phone: '+1 555 0100',
  currency: 'USD',
} as Business;

const stats: CustomerStats = { total: 5, awaitingResponse: 2, accepted: 1, acceptedValue: 1234 };

function quotation(id: string, status: QuotationStatus): QuotationDetail {
  return {
    id,
    number: `Q-${id}`,
    status,
    title: `Quotation ${id}`,
    issueDate: '2026-01-01',
    validUntil: '2026-02-01',
    items: [],
    discountPercent: 0,
    notes: '',
    terms: '',
    activity: [],
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    business,
    customer: { id: 'c1', name: 'Jane Doe' },
  } as unknown as QuotationDetail;
}

describe('PortalHomeComponent', () => {
  let fixture: ComponentFixture<PortalHomeComponent>;
  let component: PortalHomeComponent;
  let api: jasmine.SpyObj<PortalApiService>;
  let toast: jasmine.SpyObj<ToastService>;
  let user: ReturnType<typeof signal<User | null>>;

  function setup(quotations$: Observable<QuotationDetail[]> = of([])): void {
    api = jasmine.createSpyObj<PortalApiService>('PortalApiService', ['stats', 'business', 'quotations']);
    api.stats.and.returnValue(of(stats));
    api.business.and.returnValue(of(business));
    api.quotations.and.returnValue(quotations$);
    toast = jasmine.createSpyObj<ToastService>('ToastService', ['error', 'success', 'info']);
    user = signal<User | null>({ id: 'u1', name: 'Jane Doe', email: 'jane@test', role: 'customer' } as User);

    TestBed.configureTestingModule({
      imports: [PortalHomeComponent],
      providers: [
        provideRouter([]),
        { provide: PortalApiService, useValue: api },
        { provide: ToastService, useValue: toast },
        { provide: AuthService, useValue: { user } },
      ],
    });

    fixture = TestBed.createComponent(PortalHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  const el = (): HTMLElement => fixture.nativeElement;

  it('should create and load stats, business and quotations', () => {
    setup();
    expect(component).toBeTruthy();
    expect(api.stats).toHaveBeenCalledTimes(1);
    expect(api.business).toHaveBeenCalledTimes(1);
    expect(api.quotations).toHaveBeenCalledTimes(1);
    expect(component.data()).toEqual({ stats, business, quotations: [] });
  });

  it('should show the loading state until all requests complete', () => {
    const pending = new Subject<QuotationDetail[]>();
    setup(pending);
    expect(component.data()).toBeNull();
    expect(el().querySelector('app-loading')).not.toBeNull();
    expect(el().querySelector('app-page-header')).toBeNull();

    pending.next([]);
    pending.complete();
    fixture.detectChanges();
    expect(el().querySelector('app-loading')).toBeNull();
    expect(el().querySelector('app-page-header')).not.toBeNull();
  });

  it('should greet the user by first name and mention the business', () => {
    setup();
    expect(component.firstName()).toBe('Jane');
    const text = el().textContent ?? '';
    expect(text).toContain('Welcome, Jane');
    expect(text).toContain('Quotations from Acme Corp');
  });

  it('should fall back to an empty first name when no user is signed in', () => {
    setup();
    user.set(null);
    expect(component.firstName()).toBe('');
  });

  it('should render the three stat cards with formatted accepted value', () => {
    setup();
    const cards = el().querySelectorAll('app-stat-card');
    expect(cards.length).toBe(3);
    const text = el().textContent ?? '';
    expect(text).toContain('Waiting for your response');
    expect(text).toContain('$1,234');
  });

  it('should only treat sent and viewed quotations as awaiting a response', () => {
    setup(
      of([
        quotation('1', 'sent'),
        quotation('2', 'viewed'),
        quotation('3', 'accepted'),
        quotation('4', 'rejected'),
        quotation('5', 'draft'),
        quotation('6', 'expired'),
      ]),
    );
    expect(component.awaiting().map((q) => q.id)).toEqual(['1', '2']);
    expect(el().querySelector('app-portal-quotation-list')).not.toBeNull();
    expect(el().querySelector('app-empty-state')).toBeNull();
  });

  it('should show the empty state when nothing needs a response', () => {
    setup(of([quotation('1', 'accepted')]));
    expect(component.awaiting()).toEqual([]);
    expect(el().querySelector('app-portal-quotation-list')).toBeNull();
    expect(el().textContent).toContain("You're all caught up");
  });

  it('should link to all quotations and to the business email', () => {
    setup();
    const allLink = el().querySelector<HTMLAnchorElement>('a[href="/portal/quotations"]');
    expect(allLink?.textContent?.trim()).toBe('All quotations');

    const mail = el().querySelector<HTMLAnchorElement>('a[href^="mailto:"]');
    expect(mail?.getAttribute('href')).toBe('mailto:sales@acme.test');
    expect(el().textContent).toContain('+1 555 0100');
  });

  it('should show an error toast and stay in the loading state when a request fails', () => {
    setup(throwError(() => new HttpErrorResponse({ status: 500, error: { message: 'Server exploded' } })));
    expect(toast.error).toHaveBeenCalledOnceWith('Server exploded');
    expect(component.data()).toBeNull();
    expect(el().querySelector('app-loading')).not.toBeNull();
  });
});
