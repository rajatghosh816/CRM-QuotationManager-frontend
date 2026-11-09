import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PageHeaderComponent } from './page-header.component';

@Component({
  imports: [PageHeaderComponent],
  template: `<app-page-header title="T"><a back class="back">Back</a><button class="action">Go</button></app-page-header>`,
})
class HostComponent {}

describe('PageHeaderComponent', () => {
  let fixture: ComponentFixture<PageHeaderComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [PageHeaderComponent, HostComponent] });
    fixture = TestBed.createComponent(PageHeaderComponent);
    fixture.componentRef.setInput('title', 'Customers');
  });

  it('should render the title as h1', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('h1').textContent).toBe('Customers');
  });

  it('should render the subtitle only when given', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('p')).toBeNull();
    fixture.componentRef.setInput('subtitle', 'All your customers');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('p').textContent).toContain('All your customers');
  });

  it('should project the back link above the title and actions to the side', () => {
    const host = TestBed.createComponent(HostComponent);
    host.detectChanges();
    const el: HTMLElement = host.nativeElement;
    const back = el.querySelector('.back')!;
    expect(back.nextElementSibling!.tagName).toBe('H1');
    expect(el.querySelector('.flex-wrap .action')).not.toBeNull();
  });
});
