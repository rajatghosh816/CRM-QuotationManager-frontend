import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { businessApiSpy, buttonByText, httpError, makeBusiness, makeProduct, settle, Spied, textOf, toastSpy, typeInto } from '../../../../testing/fixtures';
import { BusinessApiService } from '../../../core/services/business-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { ProductsComponent } from './products.component';

describe('ProductsComponent', () => {
  let fixture: ComponentFixture<ProductsComponent>;
  let component: ProductsComponent;
  let api: Spied<BusinessApiService>;
  let toast: Spied<ToastService>;
  const el = () => fixture.nativeElement as HTMLElement;
  const rows = () => Array.from(el().querySelectorAll<HTMLElement>('tbody tr'));
  const modal = () => el().querySelector('app-modal') as HTMLElement | null;
  const save = () => buttonByText(modal()!, 'Save product');

  const table = makeProduct({ id: 'p1', name: 'Oak Table', sku: 'OAK-1' });
  const hidden = makeProduct({ id: 'p2', name: 'Old Chair', sku: '', active: false });

  async function setup(fail = false): Promise<void> {
    api = businessApiSpy();
    api.products.and.returnValue(fail ? throwError(() => httpError('Down', 500)) : of([table, hidden]));
    api.profile.and.returnValue(of(makeBusiness({ currency: 'EUR', defaultTaxRate: 12 })));
    toast = toastSpy();
    TestBed.configureTestingModule({
      imports: [ProductsComponent],
      providers: [{ provide: BusinessApiService, useValue: api }, { provide: ToastService, useValue: toast }],
    });
    fixture = TestBed.createComponent(ProductsComponent);
    component = fixture.componentInstance;
    await settle(fixture);
  }

  it('should list products in the business currency', async () => {
    await setup();
    expect(rows().length).toBe(2);
    expect(textOf(rows()[0])).toContain('€500.00');
    expect(textOf(rows()[0])).toContain('Active');
  });

  it('should dim hidden products and show a dash for missing SKU', async () => {
    await setup();
    expect(rows()[1].classList).toContain('opacity-60');
    expect(textOf(rows()[1])).toContain('Hidden');
    expect(rows()[1].querySelectorAll('td')[1].textContent!.trim()).toBe('—');
  });

  it('should search by name or SKU', async () => {
    await setup();
    await typeInto(fixture, 'input[type=search]', 'oak-1');
    expect(component.filtered().map((p) => p.id)).toEqual(['p1']);
    await typeInto(fixture, 'input[type=search]', 'chair');
    expect(component.filtered().map((p) => p.id)).toEqual(['p2']);
    await typeInto(fixture, 'input[type=search]', 'zzz');
    expect(el().textContent).toContain('No products found');
  });

  it('should open a new product with the business default tax rate', async () => {
    await setup();
    buttonByText(el(), 'Add product').click();
    await settle(fixture);
    expect(modal()!.textContent).toContain('Add product');
    expect(component.form()).toEqual(jasmine.objectContaining({ taxRate: 12, unit: 'unit', active: true }));
    expect(save().disabled).toBeTrue();
  });

  it('should create a product with numeric fields', async () => {
    await setup();
    api.createProduct.and.returnValue(of(table));
    component.openNew();
    await settle(fixture);
    await typeInto(fixture, '#pname', 'Lamp');
    await typeInto(fixture, '#price', '40');
    await typeInto(fixture, '#ptax', '');
    save().click();
    await settle(fixture);

    expect(api.createProduct).toHaveBeenCalledWith(jasmine.objectContaining({ name: 'Lamp', unitPrice: 40, taxRate: 0 }));
    expect(api.createProduct.calls.mostRecent().args[0] as object).not.toEqual(jasmine.objectContaining({ id: jasmine.anything() }));
    expect(toast.success).toHaveBeenCalledWith('Product saved.');
    expect(modal()).toBeNull();
    expect(api.products).toHaveBeenCalledTimes(2);
  });

  it('should edit a product without sending businessId', async () => {
    await setup();
    api.updateProduct.and.returnValue(of(table));
    buttonByText(rows()[0], 'Edit').click();
    await settle(fixture);
    expect(modal()!.textContent).toContain('Edit product');
    save().click();
    await settle(fixture);

    const [id, body] = api.updateProduct.calls.mostRecent().args;
    expect(id).toBe('p1');
    expect(Object.keys(body)).not.toContain('businessId');
    expect(Object.keys(body)).not.toContain('id');
  });

  it('should keep the form open and toast when saving fails', async () => {
    await setup();
    api.updateProduct.and.returnValue(throwError(() => httpError('SKU exists')));
    component.openEdit(table);
    await settle(fixture);
    save().click();
    await settle(fixture);
    expect(toast.error).toHaveBeenCalledWith('SKU exists');
    expect(modal()).not.toBeNull();
  });

  it('should delete after confirmation and do nothing when cancelled', async () => {
    await setup();
    const confirmSpy = spyOn(window, 'confirm').and.returnValue(false);
    buttonByText(rows()[0], 'Delete').click();
    expect(api.deleteProduct).not.toHaveBeenCalled();

    confirmSpy.and.returnValue(true);
    api.deleteProduct.and.returnValue(of({}));
    buttonByText(rows()[0], 'Delete').click();
    expect(api.deleteProduct).toHaveBeenCalledWith('p1');
    expect(toast.success).toHaveBeenCalledWith('Product deleted.');
  });

  it('should toast when loading fails', async () => {
    await setup(true);
    expect(toast.error).toHaveBeenCalledWith('Down');
  });
});
