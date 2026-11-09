import { ComponentFixture, TestBed } from '@angular/core/testing';
import { makeCustomer, makeQuotation, textOf } from '../../../testing/fixtures';
import { QuotationDocumentComponent } from './quotation-document.component';

describe('QuotationDocumentComponent', () => {
  let fixture: ComponentFixture<QuotationDocumentComponent>;
  const text = () => textOf(fixture.nativeElement);

  function render(q = makeQuotation()): void {
    fixture.componentRef.setInput('quotation', q);
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [QuotationDocumentComponent] });
    fixture = TestBed.createComponent(QuotationDocumentComponent);
  });

  it('should show business, customer, number and subject', () => {
    render();
    expect(text()).toContain('Acme Corp');
    expect(text()).toContain('ACM-0001');
    expect(text()).toContain('John Carter');
    expect(text()).toContain('Carter Homes');
    expect(text()).toContain('Living room fit-out');
  });

  it('should render one row per item with line amount', () => {
    render(
      makeQuotation({
        items: [
          { description: 'Table', quantity: 2, unitPrice: 500, taxRate: 10 },
          { description: 'Chair', quantity: 4, unitPrice: 50, taxRate: 0 },
        ],
      }),
    );
    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
    expect(textOf(rows[0])).toContain('$1,000.00');
    expect(textOf(rows[1])).toContain('$200.00');
  });

  it('should compute totals with discount and tax', () => {
    render(makeQuotation({ items: [{ description: 'Table', quantity: 2, unitPrice: 500, taxRate: 10 }], discountPercent: 10 }));
    expect(fixture.componentInstance.totals()).toEqual({ subtotal: 1000, discount: 100, tax: 90, total: 990 });
    expect(text()).toContain('Discount (10%)');
    expect(text()).toContain('$990.00');
  });

  it('should hide the discount row when there is no discount', () => {
    render(makeQuotation({ discountPercent: 0 }));
    expect(text()).not.toContain('Discount');
  });

  it('should hide notes, terms and company when empty', () => {
    render(makeQuotation({ notes: '', terms: '', customer: makeCustomer({ company: '' }) }));
    expect(text()).not.toContain('Notes');
    expect(text()).not.toContain('Terms & conditions');
    expect(text()).not.toContain('Carter Homes');
  });

  it('should use the business currency', () => {
    render(makeQuotation({ business: { ...makeQuotation().business, currency: 'EUR' } }));
    expect(text()).toContain('€');
  });
});
