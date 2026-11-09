import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { adminApiSpy, buttonByText, httpError, makePlan, settle, Spied, textOf, toastSpy, typeInto } from '../../../../testing/fixtures';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { PlansComponent } from './plans.component';

describe('PlansComponent', () => {
  let fixture: ComponentFixture<PlansComponent>;
  let component: PlansComponent;
  let api: Spied<AdminApiService>;
  let toast: Spied<ToastService>;
  const el = () => fixture.nativeElement as HTMLElement;
  const cards = () => Array.from(el().querySelectorAll<HTMLElement>('article'));
  const modal = () => el().querySelector('app-modal') as HTMLElement | null;
  const save = () => buttonByText(modal()!, 'Save plan');

  const starter = makePlan({ id: 'starter', name: 'Starter', priceMonthly: 19, features: ['Up to 3 users', 'Email support'] });
  const pro = makePlan({ id: 'pro', name: 'Pro', priceMonthly: 49 });

  beforeEach(async () => {
    api = adminApiSpy();
    api.plans.and.returnValue(of([starter, pro]));
    toast = toastSpy();
    TestBed.configureTestingModule({
      imports: [PlansComponent],
      providers: [{ provide: AdminApiService, useValue: api }, { provide: ToastService, useValue: toast }],
    });
    fixture = TestBed.createComponent(PlansComponent);
    component = fixture.componentInstance;
    await settle(fixture);
  });

  it('should render a card per plan with price and features', () => {
    expect(cards().length).toBe(2);
    const text = textOf(cards()[0]);
    expect(text).toContain('Starter');
    expect(text).toContain('$19');
    expect(cards()[0].querySelectorAll('li').length).toBe(2);
  });

  it('should open an empty form for a new plan', async () => {
    buttonByText(el(), 'New plan').click();
    await settle(fixture);
    expect(modal()!.textContent).toContain('New plan');
    expect((el().querySelector('#pname') as HTMLInputElement).value).toBe('');
  });

  it('should create a plan, trimming name and splitting features by line', async () => {
    api.createPlan.and.returnValue(of(pro));
    buttonByText(el(), 'New plan').click();
    await settle(fixture);
    await typeInto(fixture, '#pname', '  Enterprise  ');
    await typeInto(fixture, '#price', '99');
    await typeInto(fixture, '#features', 'SSO\n\n  Audit log  \n');
    save().click();
    await settle(fixture);

    expect(api.createPlan).toHaveBeenCalledWith({ name: 'Enterprise', priceMonthly: 99, maxUsers: 5, maxQuotationsPerMonth: 100, features: ['SSO', 'Audit log'] });
    expect(toast.success).toHaveBeenCalledWith('Plan saved.');
    expect(modal()).toBeNull();
    expect(api.plans).toHaveBeenCalledTimes(2);
  });

  it('should edit a plan with its features joined by line', async () => {
    api.updatePlan.and.returnValue(of(starter));
    buttonByText(cards()[0], 'Edit').click();
    await settle(fixture);
    expect(modal()!.textContent).toContain('Edit plan');
    expect((el().querySelector('#features') as HTMLTextAreaElement).value).toBe('Up to 3 users\nEmail support');

    save().click();
    await settle(fixture);
    expect(api.updatePlan.calls.mostRecent().args[0]).toBe('starter');
    expect(api.createPlan).not.toHaveBeenCalled();
  });

  it('should require a name', async () => {
    buttonByText(el(), 'New plan').click();
    await settle(fixture);
    expect(save().disabled).toBeTrue();
  });

  it('should keep the form open and toast when saving fails', async () => {
    api.updatePlan.and.returnValue(throwError(() => httpError('Name taken')));
    component.openEdit(starter);
    await settle(fixture);
    save().click();
    await settle(fixture);
    expect(toast.error).toHaveBeenCalledWith('Name taken');
    expect(modal()).not.toBeNull();
    expect(component.saving()).toBeFalse();
  });

  it('should close the form on cancel', async () => {
    component.openNew();
    await settle(fixture);
    buttonByText(modal()!, 'Cancel').click();
    fixture.detectChanges();
    expect(component.form()).toBeNull();
  });

  it('should delete after confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    api.deletePlan.and.returnValue(of({}));
    buttonByText(cards()[1], 'Delete').click();
    expect(window.confirm).toHaveBeenCalledWith('Delete the Pro plan?');
    expect(api.deletePlan).toHaveBeenCalledWith('pro');
    expect(toast.success).toHaveBeenCalledWith('Plan deleted.');
  });

  it('should not delete when cancelled, and toast delete errors', () => {
    const confirmSpy = spyOn(window, 'confirm').and.returnValue(false);
    buttonByText(cards()[1], 'Delete').click();
    expect(api.deletePlan).not.toHaveBeenCalled();

    confirmSpy.and.returnValue(true);
    api.deletePlan.and.returnValue(throwError(() => httpError('Plan in use')));
    buttonByText(cards()[1], 'Delete').click();
    expect(toast.error).toHaveBeenCalledWith('Plan in use');
  });
});
