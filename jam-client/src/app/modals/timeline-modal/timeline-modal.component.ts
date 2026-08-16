import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnInit,
  Output,
  EventEmitter,
  SimpleChanges,
  HostListener,
} from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ClarityModule } from '@clr/angular';
import { JamService } from 'src/app/core/api/jam.service';
import { SnackbarService } from 'src/app/core/services/snackbar.service';
import { ConfirmModalComponent } from '../confirm-modal/confirm-modal.component';

@Component({
  selector: 'app-timeline-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, ClarityModule, ConfirmModalComponent],
  templateUrl: './timeline-modal.component.html',
  styleUrls: ['./timeline-modal.component.scss'],
})
export class TimelineModalComponent implements OnInit {
  @Input() isOpen: boolean = false;
  @Input() timelineStep: any = null;
  @Input() application: any = null;
  @Output() onClose = new EventEmitter();
  @Output() onTimelineNeedsUpdate = new EventEmitter();
  @Output() onApplicationNeedsUpdate = new EventEmitter();
  @Output() onAllApplicationsNeedUpdate = new EventEmitter();

  @HostListener('document:keydown.escape', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (this.confirmDeleteOpen) {
      return;
    }
    this.onClose.emit();
  }

  public timelineStepForm: FormGroup;
  public loading: boolean = false;
  public nonInitialSteps: any = null;
  public confirmDeleteOpen: boolean = false;

  constructor(
    private jamService: JamService,
    private formBuilder: FormBuilder,
    private snackbarService: SnackbarService
  ) {
    this.timelineStepForm = this.formBuilder.group({
      step: new FormControl('', [Validators.required]),
      date: new FormControl('', []),
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      'timelineStep' in changes &&
      changes['timelineStep'].currentValue !== undefined &&
      changes['timelineStep'].currentValue !== null
    ) {
      let timelineStep = this.timelineStep;

      if (!timelineStep.date_relevant) {
        timelineStep.date = '?';
      }

      this.timelineStepForm.reset(timelineStep);
    } else if (
      'timelineStep' in changes &&
      (changes['timelineStep'].currentValue == undefined ||
        changes['timelineStep'].currentValue == null)
    ) {
      this.timelineStepForm.reset();

      // set default value
      if (this.nonInitialSteps !== null) {
        this.timelineStepForm.patchValue({
          step: this.nonInitialSteps[0].id,
        });
      }
    }
  }

  ngOnInit(): void {
    this.getNonInitialSteps();
  }

  closeModal() {
    this.onClose.emit();
  }

  onClrModalOpenChange(open: boolean) {
    if (!open) {
      this.onClose.emit();
    }
  }

  submitTimelineStepForm() {
    if (this.timelineStepForm.invalid) {
      this.timelineStepForm.markAllAsTouched();
      return;
    }

    if (this.timelineStep === null) {
      this.addStepToTimeline();
    } else {
      this.updateTimelineStep();
    }
  }

  addStepToTimeline() {
    this.loading = true;

    this.jamService
      .addStepToTimeline(
        this.application.id,
        this.application.group,
        this.timelineStepForm.value.step,
        this.timelineStepForm.value.date
      )
      .subscribe({
        next: (data: any) => {
          this.snackbarService.showSuccess('Step added to timeline.');
          this.onTimelineNeedsUpdate.emit();
          this.onApplicationNeedsUpdate.emit();
          this.onAllApplicationsNeedUpdate.emit();
          this.closeModal();
        },
        error: (e) => {
          this.loading = false;
          this.snackbarService.showError(
            this.snackbarService.getErrorMessage(
              e,
              'An error occurred while adding the step.'
            )
          );
        },
        complete: () => {
          this.loading = false;
        },
      });
  }

  updateTimelineStep() {
    this.loading = true;
    this.jamService
      .updateTimelineStep(this.timelineStep.id, {
        date: this.timelineStepForm.value.date,
      })
      .subscribe({
        next: (data: any) => {
          this.snackbarService.showSuccess('Timeline step updated.');
          this.onTimelineNeedsUpdate.emit();
          this.closeModal();
        },
        error: (e) => {
          this.loading = false;
          this.snackbarService.showError(
            this.snackbarService.getErrorMessage(
              e,
              'An error occurred while updating the step.'
            )
          );
        },
        complete: () => {
          this.loading = false;
        },
      });
  }

  deleteTimelineStep() {
    this.loading = true;
    this.jamService.deleteTimelineStep(this.timelineStep.id).subscribe({
      next: () => {
        this.timelineStep = null;
        this.snackbarService.showSuccess('Timeline step deleted.');
        this.onApplicationNeedsUpdate.emit();
        this.onAllApplicationsNeedUpdate.emit();
        this.onTimelineNeedsUpdate.emit();
        this.closeModal();
      },
      error: (e) => {
        this.loading = false;
        this.snackbarService.showError(
          this.snackbarService.getErrorMessage(
            e,
            'An error occurred while deleting the step.'
          )
        );
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  getNonInitialSteps() {
    this.jamService.getSteps().subscribe({
      next: (data: any) => {
        this.nonInitialSteps = data.filter((s: any) => s.type !== 'S');

        // set default value
        this.timelineStepForm.patchValue({
          step: this.nonInitialSteps[0].id,
        });
      },
    });
  }

  openDeleteConfirm() {
    this.confirmDeleteOpen = true;
  }

  onDeleteConfirmed() {
    this.confirmDeleteOpen = false;
    this.deleteTimelineStep();
  }

  onDeleteCancelled() {
    this.confirmDeleteOpen = false;
  }
}
