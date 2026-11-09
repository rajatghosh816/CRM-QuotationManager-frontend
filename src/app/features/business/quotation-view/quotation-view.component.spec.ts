import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { businessApiSpy, buttonByText, httpError, makeQuotation, Spied, textOf, toastSpy } from '../../../../testing/fixtures';
import { QuotationDetail } from '../../../core/models';
import { BusinessApiService } from '../../../core/services/business-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { QuotationViewComponent } from './quotation-view.component';

const FUTURE = '2999-12-31';
const PAST = '2000-01-01';

describe('QuotationViewComponent', () => {
  let fixture: ComponentFixture<QuotationViewComponent>;
  let component: QuotationViewComponent;
  let api: Spied<BusinessApiService>;
  let toast: Spied<ToastService>;
  let router: Router;
  const el = () => fixture.nativeElement as HTMLElement;
  const text = () => textOf(el());
  const hasButton = (t: string) => Array.from(el().querySelectorAll('button')).some((b) => b.textContent!.includes(t));

  function setup(q: QuotationDetail | HttpErrorResponse = makeQuotation({ validUntil: FUTURE })): void {
    api = businessApiSpy();
    api.quotation.and.returnValue(q instanceof HttpErrorResponse ? throwError(() => q) : of(q));
    toast = toastSpy();
    TestBed.configureTestingModule({
      imports: [QuotationViewComponent],
      providers: [provideRouter([]), { provide: BusinessApiService, useValue: api }, { provide: ToastService, useValue: toast }],
    });
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture = TestBed.createComponent(QuotationViewComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('id', 'q1');
    fixture.detectChanges();
  }

  it('should load and render the quotation, total, customer link and activity', () => {
    setup();
    expect(api.quotation).toHaveBeenCalledWith('q1');
    expect(text()).toContain('$1,100.00');
    expect(el().querySelector('a[href="/business/customers/c1"]')).not.toBeNull();
    expect(el().querySelector('app-activity-log li')).not.toBeNull();
  });

  it('should go back to the list when loading fails', () => {
    setup(httpError('Not found', 404));
    expect(toast.error).toHaveBeenCalledWith('Not found');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/business/quotations');
  });

  it('should offer "Send to customer" and a draft hint for drafts', () => {
    setup(makeQuotation({ status: 'draft', validUntil: FUTURE }));
    expect(hasButton('Send to customer')).toBeTrue();
    expect(text()).toContain("The customer can't see this quotation until you send it.");
  });

  it('should offer "Re-send" for sent quotations', () => {
    setup(makeQuotation({ status: 'sent', validUntil: FUTURE }));
    expect(hasButton('Re-send')).toBeTrue();
  });

  it('should not allow sending or editing an accepted quotation', () => {
    setup(makeQuotation({ status: 'accepted', validUntil: FUTURE }));
    expect(component.canSend()).toBeFalse();
    expect(hasButton('Re-send')).toBeFalse();
    expect(el().querySelector('a[href$="/edit"]')).toBeNull();
  });

  it('should not allow sending past the validity date', () => {
    setup(makeQuotation({ status: 'expired', validUntil: PAST }));
    expect(component.canSend()).toBeFalse();
    expect(text()).toContain('This quotation expired.');
  });

  it('should show the customer comment styled by outcome', () => {
    setup(makeQuotation({ status: 'rejected', customerComment: 'Too pricey', validUntil: FUTURE }));
    expect(text()).toContain('“Too pricey”');
    expect(el().querySelector('.bg-rose-50')).not.toBeNull();
  });

  it('should send and toast the recipient', () => {
    setup(makeQuotation({ status: 'draft', validUntil: FUTURE }));
    const sent = makeQuotation({ status: 'sent', validUntil: FUTURE });
    api.sendQuotation.and.returnValue(of(sent));
    buttonByText(el(), 'Send to customer').click();
    expect(api.sendQuotation).toHaveBeenCalledWith('q1');
    expect(component.q()).toBe(sent);
    expect(toast.success).toHaveBeenCalledWith('Sent to John Carter (john@carter.test).');
    expect(component.busy()).toBeFalse();
  });

  it('should duplicate and open the copy in the editor', () => {
    setup();
    api.duplicateQuotation.and.returnValue(of(makeQuotation({ id: 'q2', number: 'ACM-0002' })));
    buttonByText(el(), 'Duplicate').click();
    expect(toast.success).toHaveBeenCalledWith('Created ACM-0002 as a draft copy.');
    expect(router.navigate).toHaveBeenCalledWith(['/business/quotations', 'q2', 'edit']);
  });

  it('should delete after confirmation', () => {
    setup();
    spyOn(window, 'confirm').and.returnValue(true);
    api.deleteQuotation.and.returnValue(of({}));
    buttonByText(el(), 'Delete quotation').click();
    expect(window.confirm).toHaveBeenCalledWith('Delete ACM-0001? This cannot be undone.');
    expect(api.deleteQuotation).toHaveBeenCalledWith('q1');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/business/quotations');
  });

  it('should not delete when cancelled', () => {
    setup();
    spyOn(window, 'confirm').and.returnValue(false);
    buttonByText(el(), 'Delete quotation').click();
    expect(api.deleteQuotation).not.toHaveBeenCalled();
  });

  it('should toast and clear busy when an action fails', () => {
    setup();
    api.duplicateQuotation.and.returnValue(throwError(() => httpError('Limit reached')));
    buttonByText(el(), 'Duplicate').click();
    expect(toast.error).toHaveBeenCalledWith('Limit reached');
    expect(component.busy()).toBeFalse();
  });

  it('should print', () => {
    setup();
    const print = spyOn(window, 'print');
    buttonByText(el(), 'Print / PDF').click();
    expect(print).toHaveBeenCalled();
  });
});
