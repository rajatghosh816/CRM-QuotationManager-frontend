import { Component, input, output } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

/** Centered dialog. Render it inside an @if and close it via (closed). */
@Component({
  selector: 'app-modal',
  imports: [IconComponent],
  host: { '(document:keydown.escape)': 'closed.emit()' },
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
})
export class ModalComponent {
  title = input.required<string>();
  width = input('sm:max-w-lg');
  closed = output<void>();
}
