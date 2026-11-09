import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatCardComponent } from './stat-card.component';

describe('StatCardComponent', () => {
  let fixture: ComponentFixture<StatCardComponent>;
  const el = () => fixture.nativeElement as HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [StatCardComponent] });
    fixture = TestBed.createComponent(StatCardComponent);
    fixture.componentRef.setInput('label', 'Accepted');
    fixture.componentRef.setInput('value', 42);
  });

  it('should show label and value', () => {
    fixture.detectChanges();
    expect(el().textContent).toContain('Accepted');
    expect(el().textContent).toContain('42');
  });

  it('should hide hint and icon by default', () => {
    fixture.detectChanges();
    expect(el().querySelector('app-icon')).toBeNull();
    expect(el().querySelectorAll('p').length).toBe(2);
  });

  it('should show hint and icon when given', () => {
    fixture.componentRef.setInput('hint', 'This month');
    fixture.componentRef.setInput('icon', 'check');
    fixture.detectChanges();
    expect(el().textContent).toContain('This month');
    expect(el().querySelector('app-icon')).not.toBeNull();
  });

  it('should render an empty value for null', () => {
    fixture.componentRef.setInput('value', null);
    fixture.detectChanges();
    expect(el().querySelectorAll('p')[1].textContent!.trim()).toBe('');
  });
});
