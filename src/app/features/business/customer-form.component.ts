import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { errorMessage } from '../../core/api';
import { Customer } from '../../core/models';
import { BusinessApiService, CustomerInput } from '../../core/services/business-api.service';
import { ToastService } from '../../core/services/toast.service';
import { ModalComponent } from '../../shared/modal.component';
import { ui } from '../../shared/ui';

/** Add/edit customer dialog, used by the list and the detail page. */
@Component({
  selector: 'app-customer-form',
  imports: [FormsModule, ModalComponent],
  template: `
    <app-modal [title]="customer() ? 'Edit customer' : 'Add customer'" (closed)="closed.emit()">
      <form #f="ngForm" (ngSubmit)="save()" class="space-y-4">
        <div class="grid gap-4 sm:grid-cols-2">
          <div>
            <label [class]="ui.label" for="cname">Contact name *</label>
            <input id="cname" name="name" required [class]="ui.input" [(ngModel)]="model.name" />
          </div>
          <div>
            <label [class]="ui.label" for="ccompany">Company</label>
            <input id="ccompany" name="company" [class]="ui.input" [(ngModel)]="model.company" />
          </div>
          <div>
            <label [class]="ui.label" for="cemail">Email *</label>
            <input id="cemail" name="email" type="email" required email [class]="ui.input" [(ngModel)]="model.email" />
          </div>
          <div>
            <label [class]="ui.label" for="cphone">Phone</label>
            <input id="cphone" name="phone" [class]="ui.input" [(ngModel)]="model.phone" />
          </div>
          <div class="sm:col-span-2">
            <label [class]="ui.label" for="caddress">Address</label>
            <textarea id="caddress" name="address" rows="2" [class]="ui.input" [(ngModel)]="model.address"></textarea>
          </div>
        </div>
        @if (!customer()) {
          <p class="rounded-lg bg-indigo-50 p-3 text-sm text-indigo-800">
            A customer portal login is created with this email so they can review quotations online.
            (Demo: the temporary password is <span class="font-mono">customer123</span>.)
          </p>
        }
        <div class="flex justify-end gap-3 pt-2">
          <button type="button" [class]="ui.btnSecondary" (click)="closed.emit()">Cancel</button>
          <button type="submit" [class]="ui.btnPrimary" [disabled]="saving() || f.invalid">Save customer</button>
        </div>
      </form>
    </app-modal>
  `,
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
