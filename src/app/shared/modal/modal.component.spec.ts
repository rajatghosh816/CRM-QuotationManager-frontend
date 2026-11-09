import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalComponent } from './modal.component';

@Component({
  imports: [ModalComponent],
  template: `<app-modal title="Edit" (closed)="closedCount = closedCount + 1"><p class="body">Hello</p></app-modal>`,
})
class HostComponent {
  closedCount = 0;
}

describe('ModalComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  const el = () => fixture.nativeElement as HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render the title, an accessible dialog and projected content', () => {
    expect(el().querySelector('h2')!.textContent).toBe('Edit');
    const dialog = el().querySelector('[role=dialog]')!;
    expect(dialog.getAttribute('aria-label')).toBe('Edit');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(el().querySelector('.body')!.textContent).toBe('Hello');
  });

  it('should apply the default width class', () => {
    expect(el().querySelector('[role=dialog]')!.classList).toContain('sm:max-w-lg');
  });

  it('should emit closed when the close button is clicked', () => {
    (el().querySelector('button[aria-label=Close]') as HTMLButtonElement).click();
    expect(host.closedCount).toBe(1);
  });

  it('should emit closed when the backdrop is clicked', () => {
    (el().querySelector('.fixed') as HTMLElement).click();
    expect(host.closedCount).toBe(1);
  });

  it('should not emit closed when clicking inside the dialog', () => {
    (el().querySelector('[role=dialog]') as HTMLElement).click();
    expect(host.closedCount).toBe(0);
  });

  it('should emit closed on Escape', () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(host.closedCount).toBe(1);
  });
});
