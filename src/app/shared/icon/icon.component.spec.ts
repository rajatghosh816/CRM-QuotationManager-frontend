import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IconComponent } from './icon.component';

describe('IconComponent', () => {
  let fixture: ComponentFixture<IconComponent>;
  const svg = () => fixture.nativeElement.querySelector('svg') as SVGElement;
  const path = () => fixture.nativeElement.querySelector('path') as SVGPathElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [IconComponent] });
    fixture = TestBed.createComponent(IconComponent);
  });

  it('should render the path for a known icon', () => {
    fixture.componentRef.setInput('name', 'plus');
    fixture.detectChanges();
    expect(path().getAttribute('d')).toBe('M12 4.5v15m7.5-7.5h-15');
  });

  it('should render an empty path for an unknown icon', () => {
    fixture.componentRef.setInput('name', 'does-not-exist');
    fixture.detectChanges();
    expect(path().getAttribute('d')).toBe('');
  });

  it('should default to size-5 and accept a custom size', () => {
    fixture.componentRef.setInput('name', 'x');
    fixture.detectChanges();
    expect(svg().getAttribute('class')).toBe('size-5');

    fixture.componentRef.setInput('size', 'size-8');
    fixture.detectChanges();
    expect(svg().getAttribute('class')).toBe('size-8');
  });

  it('should be hidden from assistive technology', () => {
    fixture.componentRef.setInput('name', 'x');
    fixture.detectChanges();
    expect(svg().getAttribute('aria-hidden')).toBe('true');
  });
});
