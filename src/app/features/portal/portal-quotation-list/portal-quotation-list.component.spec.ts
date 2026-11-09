import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { makeQuotation, textOf } from '../../../../testing/fixtures';
import { PortalQuotationListComponent } from './portal-quotation-list.component';

describe('PortalQuotationListComponent', () => {
  let fixture: ComponentFixture<PortalQuotationListComponent>;
  const rows = () => Array.from(fixture.nativeElement.querySelectorAll('li') as NodeListOf<HTMLElement>);

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [PortalQuotationListComponent], providers: [provideRouter([])] });
    fixture = TestBed.createComponent(PortalQuotationListComponent);
  });

  it('should render one linked row per quotation', () => {
    fixture.componentRef.setInput('quotations', [makeQuotation({ id: 'q1' }), makeQuotation({ id: 'q2', number: 'ACM-0002' })]);
    fixture.detectChanges();
    expect(rows().length).toBe(2);
    expect(rows()[1].querySelector('a')!.getAttribute('href')).toBe('/portal/quotations/q2');
    expect(textOf(rows()[1])).toContain('ACM-0002');
  });

  it('should show the total including tax and discount in the business currency', () => {
    const q = makeQuotation({ items: [{ description: 'X', quantity: 2, unitPrice: 500, taxRate: 10 }], discountPercent: 10 });
    expect(fixture.componentInstance.total(q)).toBe(990);
    fixture.componentRef.setInput('quotations', [q]);
    fixture.detectChanges();
    expect(textOf(rows()[0])).toContain('$990.00');
  });

  it('should show "Respond by" for open quotations and "Issued" otherwise', () => {
    fixture.componentRef.setInput('quotations', [makeQuotation({ id: 'a', status: 'sent' }), makeQuotation({ id: 'b', status: 'accepted' })]);
    fixture.detectChanges();
    expect(textOf(rows()[0])).toContain('Respond by');
    expect(textOf(rows()[1])).toContain('Issued');
  });

  it('should use the customer wording on status badges', () => {
    fixture.componentRef.setInput('quotations', [makeQuotation({ status: 'viewed' })]);
    fixture.detectChanges();
    expect(textOf(rows()[0])).toContain('Awaiting response');
  });
});
