import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StatusBadgeComponent } from './status-badge.component';

describe('StatusBadgeComponent', () => {
  let fixture: ComponentFixture<StatusBadgeComponent>;
  const span = () => fixture.nativeElement.querySelector('span') as HTMLSpanElement;

  function render(status: string, customerView = false): void {
    fixture.componentRef.setInput('status', status);
    fixture.componentRef.setInput('customerView', customerView);
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [StatusBadgeComponent] });
    fixture = TestBed.createComponent(StatusBadgeComponent);
  });

  it('should capitalise the status', () => {
    render('accepted');
    expect(span().textContent).toBe('Accepted');
    expect(span().className).toContain('bg-emerald-50');
  });

  for (const s of ['sent', 'viewed']) {
    it(`should show "${s}" as "Awaiting response" in customer view`, () => {
      render(s, true);
      expect(span().textContent).toBe('Awaiting response');
      expect(span().className).toContain('bg-sky-50');
    });
  }

  it('should keep "Viewed" with its own colour for business users', () => {
    render('viewed');
    expect(span().textContent).toBe('Viewed');
    expect(span().className).toContain('bg-violet-50');
  });

  it('should fall back to draft styling for unknown statuses', () => {
    render('mystery');
    expect(span().textContent).toBe('Mystery');
    expect(span().className).toContain('bg-slate-100');
  });
});
