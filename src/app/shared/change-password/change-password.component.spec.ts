import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { authMock, AuthMock, httpError, provideAuth, Spied, toastSpy } from '../../../testing/fixtures';
import { ToastService } from '../../core/services/toast.service';
import { ChangePasswordComponent } from './change-password.component';

describe('ChangePasswordComponent', () => {
  let fixture: ComponentFixture<ChangePasswordComponent>;
  let component: ChangePasswordComponent;
  let auth: AuthMock;
  let toast: Spied<ToastService>;

  const input = (id: string) => fixture.nativeElement.querySelector(`#${id}`) as HTMLInputElement;
  const button = () => fixture.nativeElement.querySelector('button[type=submit]') as HTMLButtonElement;

  async function type(id: string, value: string): Promise<void> {
    const el = input(id);
    el.value = value;
    el.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  async function fillValid(): Promise<void> {
    await type('cur-pw', 'oldpass');
    await type('new-pw', 'newpass1');
    await type('confirm-pw', 'newpass1');
  }

  beforeEach(async () => {
    auth = authMock();
    toast = toastSpy();
    TestBed.configureTestingModule({
      imports: [ChangePasswordComponent],
      providers: [provideAuth(auth), { provide: ToastService, useValue: toast }],
    });
    fixture = TestBed.createComponent(ChangePasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should disable submit while the form is empty', () => {
    expect(button().disabled).toBeTrue();
  });

  it('should warn and stay disabled when the passwords do not match', async () => {
    await type('cur-pw', 'oldpass');
    await type('new-pw', 'newpass1');
    await type('confirm-pw', 'different');
    expect(fixture.nativeElement.textContent).toContain('Passwords do not match.');
    expect(button().disabled).toBeTrue();
  });

  it('should stay disabled when the new password is shorter than 6 characters', async () => {
    await type('cur-pw', 'oldpass');
    await type('new-pw', 'abc');
    await type('confirm-pw', 'abc');
    expect(button().disabled).toBeTrue();
  });

  it('should change the password, toast success and reset the form', async () => {
    auth.changePassword.and.returnValue(of({}));
    await fillValid();
    expect(button().disabled).toBeFalse();

    button().click();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(auth.changePassword).toHaveBeenCalledOnceWith('oldpass', 'newpass1');
    expect(toast.success).toHaveBeenCalledWith('Password updated.');
    expect(component.busy()).toBeFalse();
    expect(component.current).toBeFalsy();
    expect(component.next).toBeFalsy();
  });

  it('should toast the error and keep the values when the change fails', async () => {
    auth.changePassword.and.returnValue(throwError(() => httpError('Current password is wrong.')));
    await fillValid();
    button().click();
    fixture.detectChanges();

    expect(toast.error).toHaveBeenCalledWith('Current password is wrong.');
    expect(component.busy()).toBeFalse();
    expect(component.current).toBe('oldpass');
  });
});
