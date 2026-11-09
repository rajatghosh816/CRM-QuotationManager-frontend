import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { businessApiSpy, buttonByText, httpError, makeBusiness, makeCustomer, makeQuotation, settle, Spied, textOf, toastSpy } from '../../../../testing/fixtures';
import { BusinessApiService } from '../../../core/services/business-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { CustomerDetailComponent } from './customer-detail.component';

describe('CustomerDetailComponent', () => {
  let fixture: ComponentFixture<CustomerDetailComponent>;
  let component: CustomerDetailComponent;
  let api: Spied<BusinessApiService>;
  let toast: Spied<ToastService>;
  let router: Router;
  const el = () => fixture.nativeElement as HTMLElement;

  const quotes = [
    makeQuotation({ id: 'q1', customerId: 'c1', status: 'accepted' }),
    makeQuotation({ id: 'q2', customerId: 'c1', status: 'accepted', items: [{ description: 'X', quantity: 1, unitPrice: 100, taxRate: 0 }] }),
    makeQuotation({ id: 'q3', customerId: 'c1', status: 'sent' }),
    makeQuotation({ id: 'q4', customerId: 'other', status: 'accepted' }),
  ];

  async function setup(fail = false, customer = makeCustomer({ id: 'c1' })): Promise<void> {
    api = businessApiSpy();
    api.customer.and.returnValue(fail ? throwError(() => httpError('Not found', 404)) : of(customer));
    api.quotations.and.returnValue(of(quotes));
    api.profile.and.returnValue(of(makeBusiness({ currency: 'EUR' })));
    toast = toastSpy();
    TestBed.configureTestingModule({
      imports: [CustomerDetailComponent],
      providers: [provideRouter([]), { provide: BusinessApiService, useValue: api }, { provide: ToastService, useValue: toast }],
    });
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
    fixture = TestBed.createComponent(CustomerDetailComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('id', 'c1');
    await settle(fixture);
  }

  it('should load the customer and show contact details', async () => {
    await setup();
    expect(api.customer).toHaveBeenCalledWith('c1');
    expect(el().querySelector('h1')!.textContent).toBe('John Carter');
    expect(textOf(el())).toContain('Signs in to the customer portal with john@carter.test');
  });

  it('should show dashes for missing phone and address', async () => {
    await setup(false, makeCustomer({ id: 'c1', phone: '', address: '' }));
    const dds = Array.from(el().querySelectorAll('dd')).map((d) => d.textContent!.trim());
    expect(dds[1]).toBe('—');
    expect(dds[2]).toBe('—');
  });

  it('should only list this customer\'s quotations, in the business currency', async () => {
    await setup();
    expect(component.quotes().map((q) => q.id)).toEqual(['q1', 'q2', 'q3']);
    expect(el().querySelectorAll('tbody tr').length).toBe(3);
    expect(component.currency()).toBe('EUR');
    expect(textOf(el())).toContain('€');
  });

  it('should total the accepted quotations', async () => {
    await setup();
    expect(component.won()).toEqual({ count: 2, value: 1200 });
  });

  it('should show the empty state when the customer has no quotations', async () => {
    api = businessApiSpy();
    await setup();
    component.quotes.set([]);
    fixture.detectChanges();
    expect(textOf(el())).toContain('No quotations for this customer yet');
  });

  it('should open the edit form and apply the saved customer', async () => {
    await setup();
    buttonByText(el(), 'Edit').click();
    await settle(fixture);
    expect(el().querySelector('app-customer-form')).not.toBeNull();

    component.customer.set(makeCustomer({ id: 'c1', name: 'John Updated' }));
    component.editing.set(false);
    fixture.detectChanges();
    expect(el().querySelector('app-customer-form')).toBeNull();
    expect(el().querySelector('h1')!.textContent).toBe('John Updated');
  });

  it('should go back to customers when loading fails', async () => {
    await setup(true);
    expect(toast.error).toHaveBeenCalledWith('Not found');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/business/customers');
  });
});
