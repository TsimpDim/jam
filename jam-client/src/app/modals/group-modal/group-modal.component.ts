import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClarityModule } from '@clr/angular';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { JamService } from 'src/app/core/api/jam.service';
import { SnackbarService } from 'src/app/core/services/snackbar.service';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-group-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ClarityModule, ConfirmModalComponent],
  templateUrl: './group-modal.component.html',
  styleUrls: ['./group-modal.component.scss'],
})
export class GroupModalComponent implements OnInit, OnChanges {
  @Input() isOpen: boolean = false;
  @Input() group: any = null;
  @Output() onClose = new EventEmitter<void>();
  @Output() onGroupsChanged = new EventEmitter<void>();

  public groupForm: FormGroup;
  public loading: boolean = false;
  public confirmDeleteOpen: boolean = false;

  @HostListener('document:keydown.escape', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (this.confirmDeleteOpen) {
      return;
    }
    this.onClose.emit();
  }

  constructor(
    private jamService: JamService,
    private formBuilder: FormBuilder,
    private snackbarService: SnackbarService
  ) {
    this.groupForm = this.formBuilder.group({
      name: new FormControl('', [Validators.required]),
      description: new FormControl('', []),
    });
  }

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges) {
    if (
      'group' in changes &&
      changes['group'].currentValue !== undefined &&
      changes['group'].currentValue !== null
    ) {
      this.groupForm.patchValue({
        name: this.group.name,
        description: this.group.description,
      });
    } else if (
      'isOpen' in changes &&
      changes['isOpen'].currentValue === true &&
      (this.group === null || this.group === undefined)
    ) {
      this.groupForm.reset();
    }
  }

  closeModal() {
    this.onClose.emit();
  }

  onClrModalOpenChange(open: boolean) {
    if (!open) {
      this.onClose.emit();
    }
  }

  submitGroupForm() {
    if (this.groupForm.invalid) {
      this.groupForm.markAllAsTouched();
      return;
    }

    if (this.group === null) {
      this.createGroup();
    } else {
      this.updateGroup();
    }
  }

  createGroup() {
    this.loading = true;
    this.jamService
      .createGroup(this.groupForm.value.name, this.groupForm.value.description)
      .subscribe({
        next: () => {
          this.snackbarService.showSuccess('Group created successfully.');
          this.closeModal();
          this.onGroupsChanged.emit();
          this.loading = false;
        },
        error: (e) => {
          this.loading = false;
          this.snackbarService.showError(
            this.snackbarService.getErrorMessage(
              e,
              'An error occurred while creating the group.'
            )
          );
        },
      });
  }

  updateGroup() {
    this.loading = true;
    this.jamService
      .updateGroup(
        this.group.id,
        this.groupForm.value.name,
        this.groupForm.value.description
      )
      .subscribe({
        next: () => {
          this.snackbarService.showSuccess('Group updated successfully.');
          this.closeModal();
          this.onGroupsChanged.emit();
          this.loading = false;
        },
        error: (e) => {
          this.loading = false;
          this.snackbarService.showError(
            this.snackbarService.getErrorMessage(
              e,
              'An error occurred while updating the group.'
            )
          );
        },
      });
  }

  deleteGroup() {
    if (this.group === null) return;

    this.loading = true;
    this.jamService.deleteGroup(this.group.id).subscribe({
      next: () => {
        this.snackbarService.showSuccess('Group deleted successfully.');
        this.closeModal();
        this.onGroupsChanged.emit();
        this.loading = false;
      },
      error: (e) => {
        this.loading = false;
        this.snackbarService.showError(
          this.snackbarService.getErrorMessage(
            e,
            'An error occurred while deleting the group.'
          )
        );
      },
    });
  }

  openDeleteConfirm() {
    this.confirmDeleteOpen = true;
  }

  onDeleteConfirmed() {
    this.confirmDeleteOpen = false;
    this.deleteGroup();
  }

  onDeleteCancelled() {
    this.confirmDeleteOpen = false;
  }
}
