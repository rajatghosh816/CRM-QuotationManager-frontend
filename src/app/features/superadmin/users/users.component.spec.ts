import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { adminApiSpy, authMock, buttonByText, httpError, makeBusinessOverview, makeUser, provideAuth, settle, Spied, textOf, toastSpy, typeInto } from '../../../../testing/fixtures';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { UsersComponent } from './users.component';

describe('UsersComponent', () => {
  let fixture: ComponentFixture<UsersComponent>;
  let component: UsersComponent;
  let api: Spied<AdminApiService>;
  let toast: Spied<ToastService>;
  const el = () => fixture.nativeElement as HTMLElement;
  const rows = () => Array.from(el().querySelectorAll<HTMLElement>('tbody tr'));

  const me = makeUser({ id: 'admin', name: 'Platform Admin', email: 'admin@crm.test', role: 'superadmin' });
  const owner = makeUser({ id: 'u2', name: 'Alex Owner', email: 'owner@acme.test', role: 'business_admin', businessId: 'b1' });
  const customer = makeUser({ id: 'u3', name: 'John Carter', email: 'john@carter.test', role: 'customer', businessId: 'gone', status: 'disabled' });

  beforeEach(async () => {
    api = adminApiSpy();
    api.users.and.returnValue(of([me, owner, customer]));
    api.businesses.and.returnValue(of([makeBusinessOverview({ id: 'b1', name: 'Acme Corp' })]));
    toast = toastSpy();
    TestBed.configureTestingModule({
      imports: [UsersComponent],
      providers: [{ provide: AdminApiService, useValue: api }, { provide: ToastService, useValue: toast }, provideAuth(authMock(me))],
    });
    fixture = TestBed.createComponent(UsersComponent);
    component = fixture.componentInstance;
    await settle(fixture);
  });

  it('should list users with role labels and business names', () => {
    expect(rows().length).toBe(3);
    expect(textOf(rows()[1])).toContain('Business admin');
    expect(textOf(rows()[1])).toContain('Acme Corp');
  });

  it('should show a dash for users without a known business', () => {
    expect(rows()[0].querySelectorAll('td')[2].textContent!.trim()).toBe('—');
    expect(rows()[2].querySelectorAll('td')[2].textContent!.trim()).toBe('—');
  });

  it('should not let the admin disable themselves', () => {
    expect(rows()[0].querySelector('button')).toBeNull();
    expect(rows()[1].querySelector('button')!.textContent!.trim()).toBe('Disable');
    expect(rows()[2].querySelector('button')!.textContent!.trim()).toBe('Enable');
  });

  it('should search by name or email', async () => {
    await typeInto(fixture, 'input[type=search]', 'CARTER');
    expect(component.filtered().map((u) => u.id)).toEqual(['u3']);
  });

  it('should filter by role and show the empty state when nothing matches', async () => {
    await typeInto(fixture, 'select', 'customer');
    expect(rows().length).toBe(1);
    await typeInto(fixture, 'input[type=search]', 'nobody');
    expect(el().textContent).toContain('No users match');
  });

  it('should disable an active user and update the row in place', () => {
    api.setUserStatus.and.returnValue(of({ ...owner, status: 'disabled' }));
    buttonByText(rows()[1], 'Disable').click();
    fixture.detectChanges();
    expect(api.setUserStatus).toHaveBeenCalledWith('u2', 'disabled');
    expect(toast.success).toHaveBeenCalledWith('Alex Owner disabled.');
    expect(rows()[1].querySelector('button')!.textContent!.trim()).toBe('Enable');
  });

  it('should enable a disabled user', () => {
    api.setUserStatus.and.returnValue(of({ ...customer, status: 'active' }));
    buttonByText(rows()[2], 'Enable').click();
    expect(api.setUserStatus).toHaveBeenCalledWith('u3', 'active');
    expect(toast.success).toHaveBeenCalledWith('John Carter enabled.');
  });

  it('should toast when the status change fails', () => {
    api.setUserStatus.and.returnValue(throwError(() => httpError('Forbidden', 403)));
    buttonByText(rows()[1], 'Disable').click();
    expect(toast.error).toHaveBeenCalledWith('Forbidden');
  });
});
