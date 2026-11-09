import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { authMock, businessApiSpy, buttonByText, httpError, makeBusiness, provideAuth, settle, Spied, toastSpy, typeInto } from '../../../../testing/fixtures';
import { Business } from '../../../core/models';
import { BusinessApiService } from '../../../core/services/business-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { BusinessSettingsComponent } from './business-settings.component';

describe('BusinessSettingsComponent', () => {
  let fixture: ComponentFixture<BusinessSettingsComponent>;
  let component: BusinessSettingsComponent;
  let api: Spied<BusinessApiService>;
  let toast: Spied<ToastService>;
  const el = () => fixture.nativeElement as HTMLElement;
  const save = () => buttonByText(el(), 'Save changes');

  async function setup(profile: Business | HttpErrorResponse = makeBusiness()): Promise<void> {
    api = businessApiSpy();
    api.profile.and.returnValue(profile instanceof HttpErrorResponse ? throwError(() => profile) : of(profile));
    toast = toastSpy();
    TestBed.configureTestingModule({
      imports: [BusinessSettingsComponent],
      providers: [{ provide: BusinessApiService, useValue: api }, { provide: ToastService, useValue: toast }, provideAuth(authMock())],
    });
    fixture = TestBed.createComponent(BusinessSettingsComponent);
    component = fixture.componentInstance;
    await settle(fixture);
  }

  it('should fill the form from the business profile', async () => {
    await setup();
    expect((el().querySelector('#name') as HTMLInputElement).value).toBe('Acme Corp');
    expect((el().querySelector('#currency') as HTMLSelectElement).value).toBe('USD');
    expect((el().querySelector('#prefix') as HTMLInputElement).value).toBe('ACM');
    expect(el().querySelector('app-change-password')).not.toBeNull();
  });

  it('should toast and keep loading when the profile fails', async () => {
    await setup(httpError('Down', 500));
    expect(toast.error).toHaveBeenCalledWith('Down');
    expect(el().querySelector('app-loading')).not.toBeNull();
  });

  it('should disable save when required fields are invalid', async () => {
    await setup();
    expect(save().disabled).toBeFalse();
    await typeInto(fixture, '#email', 'bad');
    expect(save().disabled).toBeTrue();
    await typeInto(fixture, '#email', 'ok@acme.test');
    await typeInto(fixture, '#prefix', '');
    expect(save().disabled).toBeTrue();
  });

  it('should save the edited profile', async () => {
    await setup();
    const saved = makeBusiness({ name: 'Acme Renamed', currency: 'EUR' });
    api.updateProfile.and.returnValue(of(saved));
    await typeInto(fixture, '#name', 'Acme Renamed');
    await typeInto(fixture, '#currency', 'EUR');
    save().click();
    await settle(fixture);

    expect(api.updateProfile).toHaveBeenCalledWith(jasmine.objectContaining({ name: 'Acme Renamed', currency: 'EUR' }));
    expect(toast.success).toHaveBeenCalledWith('Settings saved.');
    expect(component.model()).toBe(saved);
    expect(component.saving()).toBeFalse();
  });

  it('should toast when saving fails', async () => {
    await setup();
    api.updateProfile.and.returnValue(throwError(() => httpError('Prefix taken')));
    save().click();
    await settle(fixture);
    expect(toast.error).toHaveBeenCalledWith('Prefix taken');
    expect(component.saving()).toBeFalse();
  });
});
