import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { businessApiSpy, buttonByText, httpError, makeCustomer, settle, Spied, textOf, toastSpy, typeInto } from '../../../../testing/fixtures';
import { BusinessApiService } from '../../../core/services/business-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { CustomersComponent } from './customers.component';

describe('CustomersComponent', () => {
  let fixture: ComponentFixture<CustomersComponent>;
  let component: CustomersComponent;
  let api: Spied<BusinessApiService>;
  let toast: Spied<ToastService>;
  let router: Router;
  const el = () => fixture.nativeElement as HTMLElement;
  const rows = () => Array.from(el().querySelectorAll<HTMLElement>('tbody tr'));
  const form = () => el().querySelector('app-customer-form');

  const john = makeCustomer({ id: 'c1' });
  const priya = makeCustomer({ id: 'c2', name: 'Priya Sharma', company: '', email: 'priya@sharma.test' });

  async function setup(query: Record<string, string> = {}, fail = false): Promise<void> {
    api = businessApiSpy();
    api.customers.and.returnValue(fail ? throwError(() => httpError('Down', 500)) : of([john, priya]));
    toast = toastSpy();
    TestBed.configureTestingModule({
      imports: [CustomersComponent],
      providers: [
        provideRouter([]),
        { provide: BusinessApiService, useValue: api },
        { provide: ToastService, useValue: toast },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(query) } } },
      ],
    });
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(CustomersComponent);
    component = fixture.componentInstance;
    await settle(fixture);
  }

  it('should list customers with a dash for missing company', async () => {
    await setup();
    expect(rows().length).toBe(2);
    expect(rows()[1].querySelectorAll('td')[1].textContent!.trim()).toBe('—');
  });

  it('should link "New quote" with the customer id', async () => {
    await setup();
    const link = Array.from(rows()[0].querySelectorAll('a')).find((a) => a.textContent!.includes('New quote'))!;
    expect(link.getAttribute('href')).toBe('/business/quotations/new?customerId=c1');
  });

  it('should search by name, company or email', async () => {
    await setup();
    await typeInto(fixture, 'input[type=search]', 'carter homes');
    expect(component.filtered().map((c) => c.id)).toEqual(['c1']);
    await typeInto(fixture, 'input[type=search]', 'zzz');
    expect(el().textContent).toContain('No customers found');
  });

  it('should open the add form from the header and close it', async () => {
    await setup();
    expect(form()).toBeNull();
    buttonByText(el(), 'Add customer').click();
    await settle(fixture);
    expect(component.editing()).toBe('new');
    expect(textOf(form()!)).toContain('Add customer');

    component.closeForm();
    fixture.detectChanges();
    expect(form()).toBeNull();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('should open the edit form for a row', async () => {
    await setup();
    buttonByText(rows()[1], 'Edit').click();
    await settle(fixture);
    expect(component.editing()).toBe(priya);
    expect(textOf(form()!)).toContain('Edit customer');
  });

  it('should open the add form when ?new is in the URL and clear it on close', async () => {
    await setup({ new: '' });
    expect(component.editing()).toBe('new');
    component.closeForm();
    expect(router.navigate).toHaveBeenCalledWith([], { queryParams: {} });
  });

  it('should close the form and reload after saving', async () => {
    await setup();
    component.editing.set('new');
    component.onSaved();
    expect(component.editing()).toBeNull();
    expect(api.customers).toHaveBeenCalledTimes(2);
  });

  it('should delete after confirmation', async () => {
    await setup();
    spyOn(window, 'confirm').and.returnValue(true);
    api.deleteCustomer.and.returnValue(of({}));
    buttonByText(rows()[0], 'Delete').click();
    expect(api.deleteCustomer).toHaveBeenCalledWith('c1');
    expect(toast.success).toHaveBeenCalledWith('John Carter deleted.');
    expect(api.customers).toHaveBeenCalledTimes(2);
  });

  it('should not delete when cancelled, and toast delete errors', async () => {
    await setup();
    const confirmSpy = spyOn(window, 'confirm').and.returnValue(false);
    buttonByText(rows()[0], 'Delete').click();
    expect(api.deleteCustomer).not.toHaveBeenCalled();

    confirmSpy.and.returnValue(true);
    api.deleteCustomer.and.returnValue(throwError(() => httpError('Has quotations')));
    buttonByText(rows()[0], 'Delete').click();
    expect(toast.error).toHaveBeenCalledWith('Has quotations');
  });

  it('should toast and stop loading when the list fails', async () => {
    await setup({}, true);
    expect(toast.error).toHaveBeenCalledWith('Down');
    expect(component.loading()).toBeFalse();
  });
});
