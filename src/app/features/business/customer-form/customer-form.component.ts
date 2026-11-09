import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { errorMessage } from '../../../core/api';
import { Customer } from '../../../core/models';
import { BusinessApiService, CustomerInput } from '../../../core/services/business-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { ui } from '../../../shared/ui';

/** Add/edit customer dialog, used by the list and the detail page. */
@Component({
  selector: 'app-customer-form',
  imports: [FormsModule, ModalComponent],
  templateUrl: './customer-form.component.html',
  styleUrl: './customer-form.component.scss',
})
export class CustomerFormComponent {
  private api = inject(BusinessApiService);
  private toast = inject(ToastService);
  ui = ui;

  customer = input<Customer | null>(null);
  closed = output<void>();
  saved = output<Customer>();
  saving = signal(false);
  model: CustomerInput = { name: '', company: '', email: '', phone: '', address: '' };

  ngOnInit(): void {
    const c = this.customer();
    if (c) this.model = { name: c.name, company: c.company, email: c.email, phone: c.phone, address: c.address };
  }

  save(): void {
    this.saving.set(true);
    const c = this.customer();
    (c ? this.api.updateCustomer(c.id, this.model) : this.api.createCustomer(this.model)).subscribe({
      next: (saved) => {
        this.toast.success(c ? 'Customer updated.' : `${saved.name} added.`);
        this.saved.emit(saved);
      },
      error: (e) => {
        this.toast.error(errorMessage(e));
        this.saving.set(false);
      },
    });
  }
}
