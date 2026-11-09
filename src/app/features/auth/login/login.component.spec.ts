import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { authMock, AuthMock, buttonByText, httpError, makeUser, provideAuth, settle, Spied, toastSpy, typeInto } from '../../../../testing/fixtures';
import { mockDb } from '../../../core/mock/mock-db';
import { ToastService } from '../../../core/services/toast.service';
import { LoginComponent } from './login.component';

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let auth: AuthMock;
  let toast: Spied<ToastService>;
  let router: Router;
  const el = () => fixture.nativeElement as HTMLElement;
  const submitBtn = () => el().querySelector('button[type=submit]') as HTMLButtonElement;

  async function setup(query: Record<string, string> = {}): Promise<void> {
    auth = authMock();
    auth.homeUrl.and.callFake((role: string) => ({ superadmin: '/superadmin', business_admin: '/business', customer: '/portal' })[role]);
    toast = toastSpy();
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        provideAuth(auth),
        { provide: ToastService, useValue: toast },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(query) } } },
      ],
    });
    router = TestBed.inject(Router);
    spyOn(router, 'navigateByUrl').and.resolveTo(true);
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    await settle(fixture);
  }

  async function signIn(email = 'jane@test.dev', password = 'secret'): Promise<void> {
    await typeInto(fixture, '#email', email);
    await typeInto(fixture, '#password', password);
    submitBtn().click();
    await settle(fixture);
  }

  it('should disable sign in until both email and password are filled', async () => {
    await setup();
    expect(submitBtn().disabled).toBeTrue();
    await typeInto(fixture, '#email', 'a@b.co');
    expect(submitBtn().disabled).toBeTrue();
    await typeInto(fixture, '#password', 'x');
    expect(submitBtn().disabled).toBeFalse();
  });

  it('should sign in and go to the home page for the role', async () => {
    await setup();
    auth.login.and.returnValue(of(makeUser({ role: 'business_admin' })));
    await signIn();
    expect(auth.login).toHaveBeenCalledWith('jane@test.dev', 'secret');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/business');
  });

  it('should honour a returnUrl inside the user\'s own area', async () => {
    await setup({ returnUrl: '/portal/quotations/q1' });
    auth.login.and.returnValue(of(makeUser({ role: 'customer' })));
    await signIn();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/portal/quotations/q1');
  });

  it('should ignore a returnUrl outside the user\'s area', async () => {
    await setup({ returnUrl: '/superadmin/users' });
    auth.login.and.returnValue(of(makeUser({ role: 'customer' })));
    await signIn();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/portal');
  });

  it('should show the error and re-enable the form when sign in fails', async () => {
    await setup();
    auth.login.and.returnValue(throwError(() => httpError('Invalid email or password.', 401)));
    await signIn();
    expect(el().textContent).toContain('Invalid email or password.');
    expect(component.busy()).toBeFalse();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should show "Signing in…" while the request is in flight', async () => {
    await setup();
    auth.login.and.returnValue(of());
    await signIn();
    expect(submitBtn().textContent!.trim()).toBe('Signing in…');
  });

  it('should list demo accounts and sign in with one', async () => {
    await setup();
    auth.login.and.returnValue(of(makeUser({ role: 'superadmin' })));
    const demos = el().querySelectorAll('ul button');
    expect(demos.length).toBe(component.demos.length);

    (demos[0] as HTMLButtonElement).click();
    expect(auth.login).toHaveBeenCalledWith('admin@crm.test', 'admin123');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/superadmin');
  });

  it('should reset the demo data', async () => {
    await setup();
    const reset = spyOn(mockDb, 'reset');
    buttonByText(el(), 'Reset demo data').click();
    expect(reset).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith('Demo data has been reset.');
  });
});
