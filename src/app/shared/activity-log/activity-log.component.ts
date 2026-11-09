import { DatePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';
import { QuotationActivity } from '../../core/models';

@Component({
  selector: 'app-activity-log',
  imports: [DatePipe],
  templateUrl: './activity-log.component.html',
  styleUrl: './activity-log.component.scss',
})
export class ActivityLogComponent {
  activity = input.required<QuotationActivity[]>();
  newestFirst = computed(() => [...this.activity()].reverse());
}
