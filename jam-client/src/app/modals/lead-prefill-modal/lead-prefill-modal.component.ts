import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClarityModule } from '@clr/angular';

@Component({
  selector: 'app-lead-prefill-modal',
  standalone: true,
  imports: [CommonModule, ClarityModule],
  templateUrl: './lead-prefill-modal.component.html',
  styleUrls: ['./lead-prefill-modal.component.scss'],
})
export class LeadPrefillModalComponent {
  @Input() open: boolean = false;
  @Input() lead: any = null;
  @Output() closed = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<void>();

  onModalOpenChange(isOpen: boolean): void {
    if (!isOpen) {
      this.closed.emit();
    }
  }

  decline(): void {
    this.closed.emit();
  }

  confirm(): void {
    this.confirmed.emit();
  }
}
