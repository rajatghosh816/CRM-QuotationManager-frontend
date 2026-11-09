import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { businessApiSpy, buttonByText, httpError, makeCustomer, settle, Spied, toastSpy, typeInto } from '../../../../testing/fixtures';
import { Customer } from '../../../core/models';
import { BusinessApiService } from '../../../core/services/business-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { CustomerFormComponent } from './customer-form.component';

@Component({
  imports: [CustomerFormComponent],
  template: `<app-customer-form [customer]="customer()" (closed)="closed = closed + 1" (saved)="saved = $event" />`,
})
class HostComponent {
  customer = signal<Customer | null>(null);
  closed = 0;
  saved: Customer | null = null;
}

describe('CustomerFormComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let api: Spied<BusinessApiService>;
  let toast: Spied<ToastService>;
  const el = () => fixture.nativeElement as HTMLElement;
  const save = () => buttonByText(el(), 'Save customer');

  async function setup(customer: Customer | null = null): Promise<void> {
    api = businessApiSpy();
    toast = toastSpy();
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [{ provide: BusinessApiService, useValue: api }, { provide: ToastService, useValue: toast }],
    });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    host.customer.set(customer);
    await settle(fixture);
  }

  it('should show an empty "Add customer" form with the portal login note', async () => {
    await setup();
    expect(el().querySelector('h2')!.textContent).toBe('Add customer');
    expect((el().querySelector('#cname') as HTMLInputElement).value).toBe('');
    expect(el().textContent).toContain('customer123');
  });

  it('should require name and a valid email', async () => {
    await setup();
    expect(save().disabled).toBeTrue();
    await typeInto(fixture, '#cname', 'Lena');
    await typeInto(fixture, '#cemail', 'nope');
    expect(save().disabled).toBeTrue();
    await typeInto(fixture, '#cemail', 'lena@studio.test');
    expect(save().disabled).toBeFalse();
  });

  it('should create a customer and emit saved', async () => {
    await setup();
    const created = makeCustomer({ id: 'c9', name: 'Lena' });
    api.createCustomer.and.returnValue(of(created));
    await typeInto(fixture, '#cname', 'Lena');
    await typeInto(fixture, '#cemail', 'lena@studio.test');
    save().click();
    await settle(fixture);

    expect(api.createCustomer).toHaveBeenCalledWith({ name: 'Lena', company: '', email: 'lena@studio.test', phone: '', address: '' });
    expect(toast.success).toHaveBeenCalledWith('Lena added.');
    expect(host.saved).toBe(created);
  });

  it('should prefill and update an existing customer', async () => {
    await setup(makeCustomer());
    expect(el().querySelector('h2')!.textContent).toBe('Edit customer');
    expect((el().querySelector('#cname') as HTMLInputElement).value).toBe('John Carter');
    expect(el().textContent).not.toContain('customer123');

    api.updateCustomer.and.returnValue(of(makeCustomer({ name: 'John C.' })));
    await typeInto(fixture, '#cname', 'John C.');
    save().click();
    await settle(fixture);

    expect(api.updateCustomer.calls.mostRecent().args).toEqual(['c1', jasmine.objectContaining({ name: 'John C.', email: 'john@carter.test' })]);
    expect(toast.success).toHaveBeenCalledWith('Customer updated.');
  });

  it('should toast and not emit when saving fails', async () => {
    await setup(makeCustomer());
    api.updateCustomer.and.returnValue(throwError(() => httpError('Email taken')));
    save().click();
    await settle(fixture);
    expect(toast.error).toHaveBeenCalledWith('Email taken');
    expect(host.saved).toBeNull();
    expect(save().disabled).toBeFalse();
  });

  it('should emit closed on cancel', async () => {
    await setup();
    buttonByText(el(), 'Cancel').click();
    expect(host.closed).toBe(1);
  });
});
