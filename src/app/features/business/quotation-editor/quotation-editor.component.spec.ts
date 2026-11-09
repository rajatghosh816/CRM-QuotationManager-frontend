import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { businessApiSpy, buttonByText, httpError, makeBusiness, makeCustomer, makeProduct, makeQuotation, settle, Spied, textOf, toastSpy, typeInto } from '../../../../testing/fixtures';
import { QuotationDetail } from '../../../core/models';
import { BusinessApiService } from '../../../core/services/business-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { QuotationEditorComponent } from './quotation-editor.component';

describe('QuotationEditorComponent', () => {
  let fixture: ComponentFixture<QuotationEditorComponent>;
  let component: QuotationEditorComponent;
  let api: Spied<BusinessApiService>;
  let toast: Spied<ToastService>;
  let router: Router;
  const el = () => fixture.nativeElement as HTMLElement;
  const text = () => textOf(el());
  const sendBtn = () => buttonByText(el(), 'Save &');
  const draftBtn = () => buttonByText(el(), 'Save as draft');

  const table = makeProduct({ id: 'p1', name: 'Oak Table', unitPrice: 500, taxRate: 10 });
  const hiddenProduct = makeProduct({ id: 'p2', name: 'Hidden', active: false });

  interface Opts {
    id?: string;
    quotation?: QuotationDetail;
    query?: Record<string, string>;
    failLoad?: boolean;
  }

  async function setup({ id, quotation, query = {}, failLoad = false }: Opts = {}): Promise<void> {
    api = businessApiSpy();
    api.profile.and.returnValue(failLoad ? throwError(() => httpError('Down', 500)) : of(makeBusiness({ defaultTaxRate: 18, defaultTerms: 'Net 30' })));
    api.customers.and.returnValue(of([makeCustomer({ id: 'c1' }), makeCustomer({ id: 'c2', name: 'Priya', company: '' })]));
    api.products.and.returnValue(of([table, hiddenProduct]));
    if (quotation) api.quotation.and.returnValue(of(quotation));
    toast = toastSpy();
    TestBed.configureTestingModule({
      imports: [QuotationEditorComponent],
      providers: [
        provideRouter([]),
        { provide: BusinessApiService, useValue: api },
        { provide: ToastService, useValue: toast },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(query) } } },
      ],
    });
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
    fixture = TestBed.createComponent(QuotationEditorComponent);
    component = fixture.componentInstance;
    if (id) fixture.componentRef.setInput('id', id);
    await settle(fixture);
  }

  async function fillValidNew(): Promise<void> {
    await typeInto(fixture, '#title', 'Kitchen');
    await typeInto(fixture, '#customer', 'c1');
    await typeInto(fixture, 'select[name=addProduct]', 'p1');
  }

  describe('new quotation', () => {
    it('should start with default terms, dates and no items', async () => {
      await setup();
      expect(text()).toContain('New quotation');
      expect(component.model.terms).toBe('Net 30');
      expect(component.model.items).toEqual([]);
      expect(component.model.validUntil > component.model.issueDate).toBeTrue();
      expect(text()).toContain('No items yet.');
      expect(api.quotation).not.toHaveBeenCalled();
    });

    it('should preselect the customer from the query string', async () => {
      await setup({ query: { customerId: 'c2' } });
      expect(component.model.customerId).toBe('c2');
    });

    it('should only offer active products in the catalog', async () => {
      await setup();
      expect(component.products().map((p) => p.id)).toEqual(['p1']);
    });

    it('should add a catalog product as a line', async () => {
      await setup();
      await typeInto(fixture, 'select[name=addProduct]', 'p1');
      expect(component.model.items).toEqual([{ productId: 'p1', description: 'Oak Table', quantity: 1, unitPrice: 500, taxRate: 10 }]);
    });

    it('should ignore unknown product ids', async () => {
      await setup();
      component.addProduct('nope');
      expect(component.model.items).toEqual([]);
    });

    it('should add a blank line with the default tax rate and remove lines', async () => {
      await setup();
      buttonByText(el(), 'Custom line').click();
      await settle(fixture);
      expect(component.model.items).toEqual([{ description: '', quantity: 1, unitPrice: 0, taxRate: 18 }]);

      (el().querySelector('button[aria-label="Remove line"]') as HTMLButtonElement).click();
      await settle(fixture);
      expect(component.model.items).toEqual([]);
    });

    it('should recalculate totals as lines and discount change', async () => {
      await setup();
      await typeInto(fixture, 'select[name=addProduct]', 'p1');
      await typeInto(fixture, '#qty0', '2');
      await typeInto(fixture, '#discount', '10');
      expect(component.totals()).toEqual({ subtotal: 1000, discount: 100, tax: 90, total: 990 });
      expect(text()).toContain('$990.00');
    });

    it('should block saving until the form is complete and has items', async () => {
      await setup();
      expect(draftBtn().disabled).toBeTrue();
      expect(text()).toContain('at least one complete line item');
      await typeInto(fixture, '#title', 'Kitchen');
      await typeInto(fixture, '#customer', 'c1');
      expect(draftBtn().disabled).toBeTrue();
      await typeInto(fixture, 'select[name=addProduct]', 'p1');
      expect(draftBtn().disabled).toBeFalse();
      expect(sendBtn().textContent!.trim()).toBe('Save & send');
    });

    it('should save as draft and open the quotation', async () => {
      await setup();
      api.createQuotation.and.returnValue(of(makeQuotation({ id: 'q9', number: 'ACM-0009' })));
      await fillValidNew();
      draftBtn().click();
      await settle(fixture);

      const [body, send] = api.createQuotation.calls.mostRecent().args;
      expect(send).toBeFalse();
      expect(body).toEqual(jasmine.objectContaining({ title: 'Kitchen', customerId: 'c1' }));
      expect(toast.success).toHaveBeenCalledWith('ACM-0009 saved as draft.');
      expect(router.navigate).toHaveBeenCalledWith(['/business/quotations', 'q9']);
    });

    it('should save and send', async () => {
      await setup();
      api.createQuotation.and.returnValue(of(makeQuotation({ id: 'q9', number: 'ACM-0009' })));
      await fillValidNew();
      sendBtn().click();
      await settle(fixture);
      expect(api.createQuotation.calls.mostRecent().args[1]).toBeTrue();
      expect(toast.success).toHaveBeenCalledWith('ACM-0009 sent to John Carter.');
    });

    it('should toast and re-enable saving when the request fails', async () => {
      await setup();
      api.createQuotation.and.returnValue(throwError(() => httpError('Monthly limit reached')));
      await fillValidNew();
      draftBtn().click();
      await settle(fixture);
      expect(toast.error).toHaveBeenCalledWith('Monthly limit reached');
      expect(component.saving()).toBeFalse();
      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('editing', () => {
    it('should load the quotation into the form with copied items', async () => {
      const q = makeQuotation({ id: 'q1', status: 'sent', title: 'Lounge' });
      await setup({ id: 'q1', quotation: q });
      expect(api.quotation).toHaveBeenCalledWith('q1');
      expect(text()).toContain('Edit ACM-0001');
      expect(component.model.title).toBe('Lounge');
      expect(component.model.items).toEqual(q.items);
      expect(component.model.items[0]).not.toBe(q.items[0]);
      expect(sendBtn().textContent!.trim()).toBe('Save & re-send');
    });

    it('should update the existing quotation', async () => {
      await setup({ id: 'q1', quotation: makeQuotation({ id: 'q1', status: 'draft' }) });
      api.updateQuotation.and.returnValue(of(makeQuotation({ id: 'q1' })));
      draftBtn().click();
      await settle(fixture);
      expect(api.updateQuotation.calls.mostRecent().args[0]).toBe('q1');
      expect(api.createQuotation).not.toHaveBeenCalled();
    });

    it('should refuse to edit an accepted quotation', async () => {
      await setup({ id: 'q1', quotation: makeQuotation({ id: 'q1', status: 'accepted' }) });
      expect(toast.info).toHaveBeenCalledWith('Accepted quotations cannot be edited.');
      expect(router.navigate).toHaveBeenCalledWith(['/business/quotations', 'q1']);
      expect(component.loading()).toBeTrue();
    });
  });

  it('should go back to the list when loading fails', async () => {
    await setup({ failLoad: true });
    expect(toast.error).toHaveBeenCalledWith('Down');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/business/quotations');
  });
});
