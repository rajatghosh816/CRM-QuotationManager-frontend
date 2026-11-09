import { TestBed } from '@angular/core/testing';
import { authMock, makeUser, provideAuth, textOf, toastSpy } from '../../../../testing/fixtures';
import { ToastService } from '../../../core/services/toast.service';
import { AdminAccountComponent } from './admin-account.component';

describe('AdminAccountComponent', () => {
  it('should show the signed-in admin and the change-password form', () => {
    TestBed.configureTestingModule({
      imports: [AdminAccountComponent],
      providers: [
        provideAuth(authMock(makeUser({ name: 'Platform Admin', email: 'admin@crm.test', role: 'superadmin' }))),
        { provide: ToastService, useValue: toastSpy() },
      ],
    });
    const fixture = TestBed.createComponent(AdminAccountComponent);
    fixture.detectChanges();
    const text = textOf(fixture.nativeElement);
    expect(text).toContain('My account');
    expect(text).toContain('Platform Admin');
    expect(text).toContain('admin@crm.test');
    expect(text).toContain('Super admin');
    expect(fixture.nativeElement.querySelector('app-change-password')).not.toBeNull();
  });
});
