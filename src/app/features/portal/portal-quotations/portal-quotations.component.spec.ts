import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { buttonByText, httpError, makeQuotation, portalApiSpy, Spied, toastSpy } from '../../../../testing/fixtures';
import { QuotationDetail } from '../../../core/models';
import { PortalApiService } from '../../../core/services/portal-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { PortalQuotationsComponent } from './portal-quotations.component';

describe('PortalQuotationsComponent', () => {
  let fixture: ComponentFixture<PortalQuotationsComponent>;
  let component: PortalQuotationsComponent;
  let api: Spied<PortalApiService>;
  let toast: Spied<ToastService>;
  const el = () => fixture.nativeElement as HTMLElement;

  const list: QuotationDetail[] = [
    makeQuotation({ id: '1', status: 'sent' }),
    makeQuotation({ id: '2', status: 'viewed' }),
    makeQuotation({ id: '3', status: 'accepted' }),
    makeQuotation({ id: '4', status: 'rejected' }),
    makeQuotation({ id: '5', status: 'expired' }),
  ];

  function setup(source = of(list)): void {
    api = portalApiSpy();
    api.quotations.and.returnValue(source);
    toast = toastSpy();
    TestBed.configureTestingModule({
      imports: [PortalQuotationsComponent],
      providers: [provideRouter([]), { provide: PortalApiService, useValue: api }, { provide: ToastService, useValue: toast }],
    });
    fixture = TestBed.createComponent(PortalQuotationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should show loading until quotations arrive', () => {
    const pending = new Subject<QuotationDetail[]>();
    setup(pending);
    expect(el().querySelector('app-loading')).not.toBeNull();
    pending.next(list);
    fixture.detectChanges();
    expect(component.loading()).toBeFalse();
    expect(el().querySelectorAll('app-portal-quotation-list li').length).toBe(5);
  });

  const cases: [string, string[]][] = [
    ['Awaiting response', ['1', '2']],
    ['Accepted', ['3']],
    ['Declined / expired', ['4', '5']],
    ['All', ['1', '2', '3', '4', '5']],
  ];
  for (const [tab, ids] of cases) {
    it(`should filter by the "${tab}" tab`, () => {
      setup();
      buttonByText(el(), tab).click();
      fixture.detectChanges();
      expect(component.filtered().map((q) => q.id)).toEqual(ids);
      expect(buttonByText(el(), tab).className).toContain('bg-indigo-50');
    });
  }

  it('should show the empty state when the filter matches nothing', () => {
    setup(of([makeQuotation({ status: 'accepted' })]));
    buttonByText(el(), 'Declined / expired').click();
    fixture.detectChanges();
    expect(el().textContent).toContain('No quotations match this filter.');
  });

  it('should toast an error and stop loading when the request fails', () => {
    setup(throwError(() => httpError('Boom')));
    expect(toast.error).toHaveBeenCalledWith('Boom');
    expect(component.loading()).toBeFalse();
    expect(el().querySelector('app-empty-state')).not.toBeNull();
  });
});
