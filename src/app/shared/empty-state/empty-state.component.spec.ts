import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EmptyStateComponent } from './empty-state.component';

@Component({
  imports: [EmptyStateComponent],
  template: `<app-empty-state title="Nothing here"><button>Add one</button></app-empty-state>`,
})
class HostComponent {}

describe('EmptyStateComponent', () => {
  let fixture: ComponentFixture<EmptyStateComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [EmptyStateComponent, HostComponent] });
    fixture = TestBed.createComponent(EmptyStateComponent);
    fixture.componentRef.setInput('title', 'No quotations');
  });

  it('should show the title and default to the document icon', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No quotations');
    expect(fixture.componentInstance.icon()).toBe('document');
  });

  it('should show the message only when given', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('p').length).toBe(1);

    fixture.componentRef.setInput('message', 'Create your first one.');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Create your first one.');
  });

  it('should pass a custom icon to app-icon', () => {
    fixture.componentRef.setInput('icon', 'check');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('path').getAttribute('d')).toContain('m4.5 12.75');
  });

  it('should project content', () => {
    const host = TestBed.createComponent(HostComponent);
    host.detectChanges();
    expect(host.nativeElement.querySelector('app-empty-state button').textContent).toBe('Add one');
  });
});
