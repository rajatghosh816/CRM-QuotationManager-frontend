import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { authMock, AuthMock, buttonByText, httpError, makeCustomer, portalApiSpy, provideAuth, settle, Spied, toastSpy, typeInto } from '../../../../testing/fixtures';
import { Customer } from '../../../core/models';
import { PortalApiService } from '../../../core/services/portal-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { PortalProfileComponent } from './portal-profile.component';

describe('PortalProfileComponent', () => {
  let fixture: ComponentFixture<PortalProfileComponent>;
  let component: PortalProfileComponent;
  let api: Spied<PortalApiService>;
  let toast: Spied<ToastService>;
  let auth: AuthMock;
  const el = () => fixture.nativeElement as HTMLElement;
  const input = (id: string) => el().querySelector(`#${id}`) as HTMLInputElement;
  const save = () => buttonByText(el(), 'Save changes');

  async function setup(profile: Customer | HttpErrorResponse = makeCustomer()): Promise<void> {
    api = portalApiSpy();
    api.profile.and.returnValue(profile instanceof HttpErrorResponse ? throwError(() => profile) : of(profile));
    toast = toastSpy();
    auth = authMock();
    auth.refreshUser.and.returnValue(of(auth.user()));
    TestBed.configureTestingModule({
      imports: [PortalProfileComponent],
      providers: [{ provide: PortalApiService, useValue: api }, { provide: ToastService, useValue: toast }, provideAuth(auth)],
    });
    fixture = TestBed.createComponent(PortalProfileComponent);
    component = fixture.componentInstance;
    await settle(fixture);
  }

  it('should fill the form from the profile with email read-only', async () => {
    await setup();
    expect(input('name').value).toBe('John Carter');
    expect(input('company').value).toBe('Carter Homes');
    expect(input('email').value).toBe('john@carter.test');
    expect(input('email').disabled).toBeTrue();
  });

  it('should toast and keep loading when the profile cannot be loaded', async () => {
    await setup(httpError('Nope'));
    expect(toast.error).toHaveBeenCalledWith('Nope');
    expect(el().querySelector('app-loading')).not.toBeNull();
  });

  it('should disable save when the name is empty', async () => {
    await setup();
    await typeInto(fixture, '#name', '');
    expect(save().disabled).toBeTrue();
  });

  it('should save only the editable fields, toast and refresh the signed-in user', async () => {
    await setup();
    const saved = makeCustomer({ name: 'Johnny Carter' });
    api.updateProfile.and.returnValue(of(saved));
    await typeInto(fixture, '#name', 'Johnny Carter');
    await typeInto(fixture, '#phone', '+1 000');

    save().click();
    await settle(fixture);

    expect(api.updateProfile).toHaveBeenCalledWith({ name: 'Johnny Carter', company: 'Carter Homes', phone: '+1 000', address: '4 Lake Road' });
    expect(toast.success).toHaveBeenCalledWith('Profile saved.');
    expect(auth.refreshUser).toHaveBeenCalled();
    expect(component.model()).toBe(saved);
    expect(component.saving()).toBeFalse();
  });

  it('should toast when saving fails', async () => {
    await setup();
    api.updateProfile.and.returnValue(throwError(() => httpError('Invalid phone')));
    save().click();
    await settle(fixture);
    expect(toast.error).toHaveBeenCalledWith('Invalid phone');
    expect(component.saving()).toBeFalse();
    expect(auth.refreshUser).not.toHaveBeenCalled();
  });

  it('should include the change-password section', async () => {
    await setup();
    expect(el().querySelector('app-change-password')).not.toBeNull();
  });
});
