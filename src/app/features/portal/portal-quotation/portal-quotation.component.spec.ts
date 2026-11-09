import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { buttonByText, httpError, makeQuotation, portalApiSpy, settle, Spied, textOf, toastSpy, typeInto } from '../../../../testing/fixtures';
import { QuotationDetail } from '../../../core/models';
import { PortalApiService } from '../../../core/services/portal-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { PortalQuotationComponent } from './portal-quotation.component';

describe('PortalQuotationComponent', () => {
  let fixture: ComponentFixture<PortalQuotationComponent>;
  let component: PortalQuotationComponent;
  let api: Spied<PortalApiService>;
  let toast: Spied<ToastService>;
  let router: Router;
  const el = () => fixture.nativeElement as HTMLElement;
  const text = () => textOf(el());
  const modal = () => el().querySelector('app-modal') as HTMLElement | null;

  async function setup(q: QuotationDetail | HttpErrorResponse = makeQuotation({ status: 'sent' })): Promise<void> {
    api = portalApiSpy();
    api.quotation.and.returnValue(q instanceof HttpErrorResponse ? throwError(() => q) : of(q));
    toast = toastSpy();
    TestBed.configureTestingModule({
      imports: [PortalQuotationComponent],
      providers: [provideRouter([]), { provide: PortalApiService, useValue: api }, { provide: ToastService, useValue: toast }],
    });
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
    fixture = TestBed.createComponent(PortalQuotationComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('id', 'q1');
    await settle(fixture);
  }

  it('should load the quotation by id and render the document', async () => {
    await setup();
    expect(api.quotation).toHaveBeenCalledWith('q1');
    expect(el().querySelector('app-quotation-document')).not.toBeNull();
    expect(text()).toContain('ACM-0001');
  });

  it('should go back to the list with a toast when loading fails', async () => {
    await setup(httpError('Not found', 404));
    expect(toast.error).toHaveBeenCalledWith('Not found');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/portal/quotations');
  });

  for (const status of ['sent', 'viewed'] as const) {
    it(`should offer accept/decline for a ${status} quotation`, async () => {
      await setup(makeQuotation({ status }));
      expect(component.open()).toBeTrue();
      expect(text()).toContain('is waiting for your decision');
      expect(text()).toContain('$1,100.00');
    });
  }

  it('should show the outcome for an accepted quotation with the customer comment', async () => {
    await setup(makeQuotation({ status: 'accepted', customerComment: 'Great, go ahead' }));
    expect(component.open()).toBeFalse();
    expect(text()).toContain('You accepted this quotation.');
    expect(text()).toContain('Your comment: “Great, go ahead”');
    expect(text()).not.toContain('Accept quotation');
  });

  it('should explain rejected and expired quotations', async () => {
    await setup(makeQuotation({ status: 'rejected' }));
    expect(text()).toContain('You declined this quotation.');
    component.q.set(makeQuotation({ status: 'expired' }));
    fixture.detectChanges();
    expect(text()).toContain('This quotation expired on');
  });

  it('should accept with an optional message', async () => {
    await setup();
    const accepted = makeQuotation({ status: 'accepted' });
    api.accept.and.returnValue(of(accepted));

    buttonByText(el(), 'Accept quotation').click();
    await settle(fixture);
    expect(modal()!.textContent).toContain('Accept quotation ACM-0001');
    await typeInto(fixture, '#comment', 'Install next month');

    buttonByText(modal()!, 'Accept').click();
    await settle(fixture);

    expect(api.accept).toHaveBeenCalledWith('q1', 'Install next month');
    expect(toast.success).toHaveBeenCalledWith('Quotation accepted. Thank you!');
    expect(component.q()).toBe(accepted);
    expect(component.comment).toBe('');
    expect(modal()).toBeNull();
  });

  it('should require a reason before declining', async () => {
    await setup();
    api.reject.and.returnValue(of(makeQuotation({ status: 'rejected' })));

    buttonByText(el(), 'Decline').click();
    await settle(fixture);
    const submit = () => modal()!.querySelector('button[type=submit]') as HTMLButtonElement;
    expect(submit().disabled).toBeTrue();

    await typeInto(fixture, '#comment', '   ');
    expect(submit().disabled).toBeTrue();

    await typeInto(fixture, '#comment', 'Too expensive');
    expect(submit().disabled).toBeFalse();
    submit().click();
    await settle(fixture);

    expect(api.reject).toHaveBeenCalledWith('q1', 'Too expensive');
    expect(toast.success).toHaveBeenCalledWith('Your response has been sent.');
  });

  it('should keep the dialog open and toast when the decision fails', async () => {
    await setup();
    api.accept.and.returnValue(throwError(() => httpError('Quotation has expired')));
    component.decision.set('accept');
    await settle(fixture);
    buttonByText(modal()!, 'Accept').click();
    await settle(fixture);

    expect(toast.error).toHaveBeenCalledWith('Quotation has expired');
    expect(component.busy()).toBeFalse();
    expect(modal()).not.toBeNull();
  });

  it('should close the dialog on cancel', async () => {
    await setup();
    component.decision.set('reject');
    await settle(fixture);
    buttonByText(modal()!, 'Cancel').click();
    fixture.detectChanges();
    expect(component.decision()).toBeNull();
  });

  it('should print', async () => {
    await setup();
    const print = spyOn(window, 'print');
    buttonByText(el(), 'Print / PDF').click();
    expect(print).toHaveBeenCalled();
  });
});
