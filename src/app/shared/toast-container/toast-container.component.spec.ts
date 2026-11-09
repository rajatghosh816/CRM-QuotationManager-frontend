import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastService } from '../../core/services/toast.service';
import { ToastContainerComponent } from './toast-container.component';

describe('ToastContainerComponent', () => {
  let fixture: ComponentFixture<ToastContainerComponent>;
  let toast: ToastService;
  const toasts = () => Array.from(fixture.nativeElement.querySelectorAll('.pointer-events-auto') as NodeListOf<HTMLElement>);

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ToastContainerComponent] });
    toast = TestBed.inject(ToastService);
    fixture = TestBed.createComponent(ToastContainerComponent);
    fixture.detectChanges();
  });

  it('should render nothing when there are no toasts', () => {
    expect(toasts().length).toBe(0);
  });

  it('should render each toast with a style for its kind', () => {
    toast.toasts.set([
      { id: 1, kind: 'success', text: 'Saved' },
      { id: 2, kind: 'error', text: 'Failed' },
      { id: 3, kind: 'info', text: 'FYI' },
    ]);
    fixture.detectChanges();
    const [ok, err, info] = toasts();
    expect(ok.textContent).toContain('Saved');
    expect(ok.className).toContain('bg-emerald-50');
    expect(err.className).toContain('bg-rose-50');
    expect(info.className).toContain('bg-white');
  });

  it('should dismiss a toast when its button is clicked', () => {
    toast.toasts.set([{ id: 7, kind: 'info', text: 'Bye' }]);
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('button[aria-label=Dismiss]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(toast.toasts()).toEqual([]);
    expect(toasts().length).toBe(0);
  });
});
