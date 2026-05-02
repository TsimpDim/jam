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

@Component({
  selector: 'app-group-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ClarityModule],
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
  public errorMessage: string = '';

  @HostListener('document:keydown.escape', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    this.onClose.emit();
  }

  constructor(
    private jamService: JamService,
    private formBuilder: FormBuilder
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

  submitGroupForm() {
    this.errorMessage = '';

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
          this.closeModal();
          this.onGroupsChanged.emit();
          this.loading = false;
        },
        error: (e) => {
          this.loading = false;
          this.errorMessage = 'An error occurred while creating the group.';
          if (e.error) {
            this.errorMessage = JSON.stringify(e.error);
          }
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
          this.closeModal();
          this.onGroupsChanged.emit();
          this.loading = false;
        },
        error: (e) => {
          this.loading = false;
          this.errorMessage = 'An error occurred while updating the group.';
          if (e.error) {
            this.errorMessage = JSON.stringify(e.error);
          }
        },
      });
  }

  deleteGroup() {
    if (this.group === null) return;

    this.loading = true;
    this.jamService.deleteGroup(this.group.id).subscribe({
      next: () => {
        this.closeModal();
        this.onGroupsChanged.emit();
        this.loading = false;
      },
      error: (e) => {
        this.loading = false;
        this.errorMessage = 'An error occurred while deleting the group.';
        if (e.error) {
          this.errorMessage = JSON.stringify(e.error);
        }
      },
    });
  }
}
