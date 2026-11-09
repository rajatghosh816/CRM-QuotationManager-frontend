import { TestBed } from '@angular/core/testing';
import { LoadingComponent } from './loading.component';

describe('LoadingComponent', () => {
  it('should render a spinner and loading text', () => {
    TestBed.configureTestingModule({ imports: [LoadingComponent] });
    const fixture = TestBed.createComponent(LoadingComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Loading…');
    expect(el.querySelector('.animate-spin')).not.toBeNull();
  });
});
