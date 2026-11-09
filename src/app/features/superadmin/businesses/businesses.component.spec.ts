import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { adminApiSpy, buttonByText, httpError, makeBusinessOverview, settle, Spied, textOf, toastSpy, typeInto } from '../../../../testing/fixtures';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { BusinessesComponent } from './businesses.component';

describe('BusinessesComponent', () => {
  let fixture: ComponentFixture<BusinessesComponent>;
  let component: BusinessesComponent;
  let api: Spied<AdminApiService>;
  let toast: Spied<ToastService>;
  const el = () => fixture.nativeElement as HTMLElement;
  const rows = () => Array.from(el().querySelectorAll<HTMLElement>('tbody tr'));

  const acme = makeBusinessOverview({ id: 'b1', name: 'Acme Interiors', status: 'active', adminName: 'Alex', adminEmail: 'alex@acme.test' });
  const bright = makeBusinessOverview({ id: 'b2', name: 'BrightWave', status: 'suspended', adminName: 'Bea', adminEmail: 'bea@bright.test', email: 'hi@bright.test' });

  beforeEach(async () => {
    api = adminApiSpy();
    api.businesses.and.returnValue(of([acme, bright]));
    toast = toastSpy();
    TestBed.configureTestingModule({
      imports: [BusinessesComponent],
      providers: [provideRouter([]), { provide: AdminApiService, useValue: api }, { provide: ToastService, useValue: toast }],
    });
    fixture = TestBed.createComponent(BusinessesComponent);
    component = fixture.componentInstance;
    await settle(fixture);
  });

  it('should list businesses with admin, plan and counts', () => {
    expect(rows().length).toBe(2);
    const text = textOf(rows()[0]);
    expect(text).toContain('Acme Interiors');
    expect(text).toContain('alex@acme.test');
    expect(text).toContain('Pro');
  });

  it('should search across name, admin and emails', async () => {
    await typeInto(fixture, 'input[type=search]', 'BEA@');
    expect(component.filtered().map((b) => b.id)).toEqual(['b2']);
    await typeInto(fixture, 'input[type=search]', 'acme');
    expect(component.filtered().map((b) => b.id)).toEqual(['b1']);
  });

  it('should filter by status', async () => {
    await typeInto(fixture, 'select', 'suspended');
    expect(rows().length).toBe(1);
    expect(textOf(rows()[0])).toContain('BrightWave');
  });

  it('should show the empty state when nothing matches', async () => {
    await typeInto(fixture, 'input[type=search]', 'zzz');
    expect(el().textContent).toContain('No businesses found');
  });

  it('should suspend after confirmation, sending all editable fields', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    api.updateBusiness.and.returnValue(of(acme));
    buttonByText(rows()[0], 'Suspend').click();

    const [id, body] = api.updateBusiness.calls.mostRecent().args;
    expect(id).toBe('b1');
    expect(body.status).toBe('suspended');
    expect(body.name).toBe('Acme Interiors');
    expect(body as object).not.toEqual(jasmine.objectContaining({ adminName: jasmine.anything() }));
    expect(toast.success).toHaveBeenCalledWith('Suspended Acme Interiors.');
    expect(api.businesses).toHaveBeenCalledTimes(2);
  });

  it('should not suspend when the confirmation is cancelled', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    buttonByText(rows()[0], 'Suspend').click();
    expect(api.updateBusiness).not.toHaveBeenCalled();
  });

  it('should activate a suspended business without asking', () => {
    const confirmSpy = spyOn(window, 'confirm');
    api.updateBusiness.and.returnValue(of(bright));
    buttonByText(rows()[1], 'Activate').click();
    expect(confirmSpy).not.toHaveBeenCalled();
    expect(api.updateBusiness.calls.mostRecent().args[1].status).toBe('active');
    expect(toast.success).toHaveBeenCalledWith('Activated BrightWave.');
  });

  it('should delete after confirmation and reload', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    api.deleteBusiness.and.returnValue(of({}));
    buttonByText(rows()[0], 'Delete').click();
    expect(api.deleteBusiness).toHaveBeenCalledWith('b1');
    expect(toast.success).toHaveBeenCalledWith('Acme Interiors deleted.');
    expect(api.businesses).toHaveBeenCalledTimes(2);
  });

  it('should toast when an action fails', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    api.deleteBusiness.and.returnValue(throwError(() => httpError('Cannot delete')));
    buttonByText(rows()[0], 'Delete').click();
    expect(toast.error).toHaveBeenCalledWith('Cannot delete');
  });
});

describe('BusinessesComponent load failure', () => {
  it('should toast and stop loading', () => {
    const api = adminApiSpy();
    api.businesses.and.returnValue(throwError(() => httpError('Down', 500)));
    const toast = toastSpy();
    TestBed.configureTestingModule({
      imports: [BusinessesComponent],
      providers: [provideRouter([]), { provide: AdminApiService, useValue: api }, { provide: ToastService, useValue: toast }],
    });
    const fixture = TestBed.createComponent(BusinessesComponent);
    fixture.detectChanges();
    expect(toast.error).toHaveBeenCalledWith('Down');
    expect(fixture.componentInstance.loading()).toBeFalse();
  });
});
