import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QuotationActivity } from '../../core/models';
import { ActivityLogComponent } from './activity-log.component';

describe('ActivityLogComponent', () => {
  let fixture: ComponentFixture<ActivityLogComponent>;
  const activity: QuotationActivity[] = [
    { at: '2026-01-01T10:00:00Z', by: 'Alex', message: 'Created' },
    { at: '2026-01-02T10:00:00Z', by: 'Alex', message: 'Sent to customer' },
    { at: '2026-01-03T10:00:00Z', by: 'John', message: 'Accepted' },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [ActivityLogComponent] });
    fixture = TestBed.createComponent(ActivityLogComponent);
    fixture.componentRef.setInput('activity', activity);
    fixture.detectChanges();
  });

  it('should list entries newest first', () => {
    const items = Array.from(fixture.nativeElement.querySelectorAll('li') as NodeListOf<HTMLElement>);
    expect(items.map((li) => li.querySelector('p')!.textContent!.trim())).toEqual(['Accepted', 'Sent to customer', 'Created']);
  });

  it('should not mutate the input array', () => {
    expect(activity[0].message).toBe('Created');
    expect(fixture.componentInstance.newestFirst()[0].message).toBe('Accepted');
  });

  it('should show who did it and when', () => {
    expect(fixture.nativeElement.textContent).toContain('John ·');
    expect(fixture.nativeElement.textContent).toContain('2026');
  });

  it('should render nothing for an empty log', () => {
    fixture.componentRef.setInput('activity', []);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('li').length).toBe(0);
  });
});
