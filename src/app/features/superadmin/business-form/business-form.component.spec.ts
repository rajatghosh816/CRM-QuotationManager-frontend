import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { adminApiSpy, httpError, makeBusinessOverview, makePlan, settle, Spied, textOf, toastSpy, typeInto } from '../../../../testing/fixtures';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { BusinessFormComponent } from './business-form.component';

describe('BusinessFormComponent', () => {
  let fixture: ComponentFixture<BusinessFormComponent>;
  let component: BusinessFormComponent;
  let api: Spied<AdminApiService>;
  let toast: Spied<ToastService>;
  let router: Router;
  const el = () => fixture.nativeElement as HTMLElement;
  const submit = () => el().querySelector('button[type=submit]') as HTMLButtonElement;
  const plans = [makePlan({ id: 'starter', name: 'Starter' }), makePlan({ id: 'pro', name: 'Pro' })];

  async function setup(id?: string): Promise<void> {
    api = adminApiSpy();
    api.plans.and.returnValue(of(plans));
    api.business.and.returnValue(of(makeBusinessOverview({ id: 'b1', name: 'Acme Corp', planId: 'pro' })));
    toast = toastSpy();
    TestBed.configureTestingModule({
      imports: [BusinessFormComponent],
      providers: [provideRouter([]), { provide: AdminApiService, useValue: api }, { provide: ToastService, useValue: toast }],
    });
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
    fixture = TestBed.createComponent(BusinessFormComponent);
    component = fixture.componentInstance;
    if (id) fixture.componentRef.setInput('id', id);
    await settle(fixture);
  }

  async function fillNew(): Promise<void> {
    await typeInto(fixture, '#name', 'Nimbus IT');
    await typeInto(fixture, '#email', 'hi@nimbus.test');
    await typeInto(fixture, '#prefix', 'NIM');
    await typeInto(fixture, '#adminName', 'Nina');
    await typeInto(fixture, '#adminEmail', 'nina@nimbus.test');
    await typeInto(fixture, '#adminPassword', 'secret1');
  }

  describe('creating', () => {
    beforeEach(() => setup());

    it('should show the add title, default to the first plan and show the admin section', () => {
      expect(textOf(el())).toContain('Add business');
      expect(component.model.planId).toBe('starter');
      expect(el().querySelector('#adminEmail')).not.toBeNull();
      expect(submit().textContent!.trim()).toBe('Create business');
    });

    it('should keep submit disabled until required fields are valid', async () => {
      expect(submit().disabled).toBeTrue();
      await fillNew();
      expect(submit().disabled).toBeFalse();
      await typeInto(fixture, '#adminPassword', '123');
      expect(submit().disabled).toBeTrue();
      await typeInto(fixture, '#adminPassword', 'secret1');
      await typeInto(fixture, '#email', 'not-an-email');
      expect(submit().disabled).toBeTrue();
    });

    it('should preview the quotation number from the prefix', async () => {
      expect(textOf(el())).toContain('QUO-0001');
      await typeInto(fixture, '#prefix', 'abc');
      expect(textOf(el())).toContain('ABC-0001');
    });

    it('should create the business with the admin login and go back to the list', async () => {
      api.createBusiness.and.returnValue(of(makeBusinessOverview({ name: 'Nimbus IT' })));
      await fillNew();
      await typeInto(fixture, '#tax', '');
      submit().click();
      await settle(fixture);

      const body = api.createBusiness.calls.mostRecent().args[0];
      expect(body).toEqual(jasmine.objectContaining({ name: 'Nimbus IT', adminEmail: 'nina@nimbus.test', planId: 'starter', defaultTaxRate: 0 }));
      expect(toast.success).toHaveBeenCalledWith('Nimbus IT created. nina@nimbus.test can now sign in.');
      expect(router.navigateByUrl).toHaveBeenCalledWith('/superadmin/businesses');
    });

    it('should toast and re-enable the form when creation fails', async () => {
      api.createBusiness.and.returnValue(throwError(() => httpError('Email already in use')));
      await fillNew();
      submit().click();
      await settle(fixture);
      expect(toast.error).toHaveBeenCalledWith('Email already in use');
      expect(component.saving()).toBeFalse();
      expect(router.navigateByUrl).not.toHaveBeenCalled();
    });
  });

  describe('editing', () => {
    beforeEach(() => setup('b1'));

    it('should load the business and hide the admin section', () => {
      expect(api.business).toHaveBeenCalledWith('b1');
      expect(textOf(el())).toContain('Edit business');
      expect((el().querySelector('#name') as HTMLInputElement).value).toBe('Acme Corp');
      expect(component.model.planId).toBe('pro');
      expect(el().querySelector('#adminEmail')).toBeNull();
      expect(submit().textContent!.trim()).toBe('Save changes');
    });

    it('should update only business fields', async () => {
      api.updateBusiness.and.returnValue(of(makeBusinessOverview()));
      await typeInto(fixture, '#name', 'Acme Renamed');
      submit().click();
      await settle(fixture);

      const [id, body] = api.updateBusiness.calls.mostRecent().args;
      expect(id).toBe('b1');
      expect(body.name).toBe('Acme Renamed');
      expect(Object.keys(body)).not.toContain('adminEmail');
      expect(Object.keys(body)).not.toContain('planName');
      expect(toast.success).toHaveBeenCalledWith('Business updated.');
    });
  });

  it('should go back to the list when the business cannot be loaded', async () => {
    api = adminApiSpy();
    api.plans.and.returnValue(of(plans));
    api.business.and.returnValue(throwError(() => httpError('Not found', 404)));
    toast = toastSpy();
    TestBed.configureTestingModule({
      imports: [BusinessFormComponent],
      providers: [provideRouter([]), { provide: AdminApiService, useValue: api }, { provide: ToastService, useValue: toast }],
    });
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
    fixture = TestBed.createComponent(BusinessFormComponent);
    fixture.componentRef.setInput('id', 'missing');
    fixture.detectChanges();
    expect(toast.error).toHaveBeenCalledWith('Not found');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/superadmin/businesses');
  });
});
