import { formatDate } from '@angular/common';
import { Component, Input, OnInit, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Utils } from 'src/app/shared/shared.utils';
import { JamService } from 'src/app/_services/jam.service';

@Component({
  selector: 'app-timeline-modal',
  templateUrl: './timeline-modal.component.html',
  styleUrls: ['./timeline-modal.component.scss']
})
export class TimelineModalComponent implements OnInit {
  @Input() isOpen: boolean = false;
  @Input() timelineStep: any = null;
  @Input() application: any = null;
  @Output() onClose = new EventEmitter();
  @Output() onTimelineNeedsUpdate = new EventEmitter();
  @Output() onApplicationNeedsUpdate = new EventEmitter();
  @Output() onAllApplicationsNeedUpdate = new EventEmitter();

  public timelineStepForm: FormGroup;
  public loading: boolean = false;
  public nonInitialSteps: any = null;

  constructor(
    private jamService: JamService,
    private formBuilder: FormBuilder
  ) {
    this.timelineStepForm = this.formBuilder.group({
      'step': new FormControl('', [Validators.required]),
      'notes': new FormControl('', []),
      'date': new FormControl('', [])
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      'timelineStep' in changes &&
      (changes['timelineStep'].currentValue !== undefined &&
      changes['timelineStep'].currentValue !== null)
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
            'step': this.nonInitialSteps[0].id
          })
        }
      }
  }

  ngOnInit(): void {
    this.getNonInitialSteps();
  }

  closeModal() {
    this.onClose.emit();
  }

  submitTimelineStepForm() {
    if (this.timelineStep === null) {
      this.addStepToTimeline();
    } else {
      this.updateTimelineStep();
    }
  }

  addStepToTimeline() {
    this.loading = true;

    this.jamService.addStepToTimeline(
      this.application.id,
      this.application.group,
      this.timelineStepForm.value.step,
      this.timelineStepForm.value.notes,
      this.timelineStepForm.value.date
    ).subscribe({
      next: (data: any) => {
        this.onTimelineNeedsUpdate.emit();
        this.onApplicationNeedsUpdate.emit();
        this.onAllApplicationsNeedUpdate.emit()
      },
      error: () => {
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
        this.closeModal();
      }
    })
  }

  updateTimelineStep() {
    this.loading = true;
    this.jamService.updateTimelineStep(
      this.timelineStep.id,
      this.timelineStepForm.value.notes,
      this.timelineStepForm.value.date
    ).subscribe({
      next: (data: any) => {
        this.onTimelineNeedsUpdate.emit();
      },
      error: () => {
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
        this.closeModal();
      }
    })
  }

  deleteTimelineStep() {
    this.loading = true;
    this.jamService.deleteTimelineStep(
      this.timelineStep.id
    ).subscribe({
      next: () => {
        this.timelineStep = null;
        this.onApplicationNeedsUpdate.emit();
        this.onAllApplicationsNeedUpdate.emit();
        this.onTimelineNeedsUpdate.emit();
      },
      error: () => {
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
        this.closeModal();
      }
    })
  }

  getNonInitialSteps() {
    this.jamService.getSteps()
    .subscribe({
      next: (data: any) => {
        this.nonInitialSteps = data.filter((s: any) => s.type !== 'S');

        // set default value
        this.timelineStepForm.patchValue({
          'step': this.nonInitialSteps[0].id
        })
      }
    })
  }
}
