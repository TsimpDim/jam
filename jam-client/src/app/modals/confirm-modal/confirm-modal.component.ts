import {
  Component,
  EventEmitter,
  Input,
  Output,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClarityModule } from '@clr/angular';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule, ClarityModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './confirm-modal.component.html',
})
export class ConfirmModalComponent {
  @Input() open: boolean = false;
  @Input() title: string = 'Confirm';
  @Input() message: string = 'Are you sure?';
  @Input() verb: string = 'Submit';
  @Output() closed = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<void>();

  onModalOpenChange(isOpen: boolean): void {
    if (!isOpen) {
      this.closed.emit();
    }
  }

  confirm(): void {
    this.confirmed.emit();
  }

  cancel(): void {
    this.closed.emit();
  }
}
