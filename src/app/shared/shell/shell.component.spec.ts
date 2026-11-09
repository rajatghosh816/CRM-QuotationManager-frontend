import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { authMock, AuthMock, makeUser, provideAuth } from '../../../testing/fixtures';
import { NavItem, ShellComponent } from './shell.component';

describe('ShellComponent', () => {
  let fixture: ComponentFixture<ShellComponent>;
  let component: ShellComponent;
  let auth: AuthMock;
  const el = () => fixture.nativeElement as HTMLElement;
  const nav: NavItem[] = [
    { label: 'Home', path: '/portal', icon: 'home', exact: true },
    { label: 'Profile', path: '/portal/profile', icon: 'user' },
  ];

  beforeEach(() => {
    auth = authMock(makeUser({ name: 'jane mary doe', email: 'jane@test.dev' }));
    TestBed.configureTestingModule({ imports: [ShellComponent], providers: [provideRouter([]), provideAuth(auth)] });
    fixture = TestBed.createComponent(ShellComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('areaLabel', 'Customer portal');
    fixture.componentRef.setInput('nav', nav);
    fixture.detectChanges();
  });

  it('should render the area label and nav links', () => {
    expect(el().textContent).toContain('Customer portal');
    const links = Array.from(el().querySelectorAll('nav a'));
    expect(links.map((a) => a.textContent!.trim())).toEqual(['Home', 'Profile']);
    expect(links[1].getAttribute('href')).toBe('/portal/profile');
  });

  it('should show the user name, email and up to two initials', () => {
    expect(component.initials()).toBe('JM');
    expect(el().textContent).toContain('jane mary doe');
    expect(el().textContent).toContain('jane@test.dev');
  });

  it('should fall back to "?" initials without a user', () => {
    auth.user.set(null);
    expect(component.initials()).toBe('?');
  });

  it('should open and close the mobile menu', () => {
    const aside = el().querySelector('aside')!;
    expect(aside.classList).toContain('-translate-x-full');

    (el().querySelector('button[aria-label="Open menu"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(component.open()).toBeTrue();
    expect(aside.classList).not.toContain('-translate-x-full');

    (el().querySelector('button[aria-label="Close menu"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(component.open()).toBeFalse();
  });

  it('should close the menu when the backdrop is clicked', () => {
    component.open.set(true);
    fixture.detectChanges();
    (el().querySelector('.bg-slate-900\\/50') as HTMLElement).click();
    expect(component.open()).toBeFalse();
  });

  it('should sign out', () => {
    (el().querySelector('button[aria-label="Sign out"]') as HTMLButtonElement).click();
    expect(auth.logout).toHaveBeenCalled();
  });
});
