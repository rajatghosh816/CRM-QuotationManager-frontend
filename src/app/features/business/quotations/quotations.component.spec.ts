import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { businessApiSpy, buttonByText, httpError, makeCustomer, makeQuotation, settle, Spied, textOf, toastSpy, typeInto } from '../../../../testing/fixtures';
import { BusinessApiService } from '../../../core/services/business-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { QuotationsComponent } from './quotations.component';

describe('QuotationsComponent', () => {
  let fixture: ComponentFixture<QuotationsComponent>;
  let component: QuotationsComponent;
  let api: Spied<BusinessApiService>;
  let toast: Spied<ToastService>;
  let router: Router;
  const el = () => fixture.nativeElement as HTMLElement;
  const rows = () => Array.from(el().querySelectorAll<HTMLElement>('tbody tr'));

  const list = [
    makeQuotation({ id: '1', number: 'ACM-0001', status: 'draft', title: 'Kitchen' }),
    makeQuotation({ id: '2', number: 'ACM-0002', status: 'sent', title: 'Bedroom', customer: makeCustomer({ name: 'Priya Sharma', company: 'Sharma & Co' }) }),
    makeQuotation({ id: '3', number: 'ACM-0003', status: 'sent', title: 'Office' }),
  ];

  async function setup(fail = false): Promise<void> {
    api = businessApiSpy();
    api.quotations.and.returnValue(fail ? throwError(() => httpError('Down', 500)) : of(list));
    toast = toastSpy();
    TestBed.configureTestingModule({
      imports: [QuotationsComponent],
      providers: [provideRouter([]), { provide: BusinessApiService, useValue: api }, { provide: ToastService, useValue: toast }],
    });
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(QuotationsComponent);
    component = fixture.componentInstance;
    await settle(fixture);
  }

  it('should list all quotations with totals', async () => {
    await setup();
    expect(rows().length).toBe(3);
    expect(textOf(rows()[0])).toContain('$1,100.00');
  });

  it('should show a count on each status tab', async () => {
    await setup();
    expect(component.count('')).toBe(3);
    expect(component.count('sent')).toBe(2);
    expect(component.count('accepted')).toBe(0);
    expect(textOf(buttonByText(el(), 'Sent'))).toBe('Sent 2');
  });

  it('should filter by status tab', async () => {
    await setup();
    buttonByText(el(), 'Draft').click();
    fixture.detectChanges();
    expect(component.filtered().map((q) => q.id)).toEqual(['1']);
  });

  it('should search number, title, customer name and company', async () => {
    await setup();
    await typeInto(fixture, 'input[type=search]', 'sharma');
    expect(component.filtered().map((q) => q.id)).toEqual(['2']);
    await typeInto(fixture, 'input[type=search]', '0003');
    expect(component.filtered().map((q) => q.id)).toEqual(['3']);
    await typeInto(fixture, 'input[type=search]', 'office');
    expect(component.filtered().map((q) => q.id)).toEqual(['3']);
  });

  it('should show the empty state when nothing matches', async () => {
    await setup();
    buttonByText(el(), 'Expired').click();
    fixture.detectChanges();
    expect(el().textContent).toContain('No quotations here');
  });

  it('should open a quotation when its row is clicked', async () => {
    await setup();
    rows()[1].click();
    expect(router.navigate).toHaveBeenCalledWith(['/business/quotations', '2']);
  });

  it('should toast and stop loading when the list fails', async () => {
    await setup(true);
    expect(toast.error).toHaveBeenCalledWith('Down');
    expect(component.loading()).toBeFalse();
  });
});
