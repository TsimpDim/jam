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

  public timelineStepForm: FormGroup;
  public loading: boolean = true;
  public nonInitialSteps: any = null;
  
  constructor(
    private jamService: JamService,
    private formBuilder: FormBuilder,
    private utils: Utils
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
      changes['timelineStep'].currentValue !== undefined &&
      changes['timelineStep'].currentValue !== null
    ) {
      let timelineStep = this.timelineStep;
      timelineStep.date = this.utils.getProperDisplayDate(timelineStep.date);

      this.timelineStepForm.reset(timelineStep);
    }
  }

  ngOnInit(): void {
    this.getNonInitialSteps(); 
  }

  closeModal() {
    this.timelineStepForm.reset();
    this.onClose.emit();
  }

  submitTimelineStepForm() {
    if (this.timelineStep === null) {
      this.addStepToTimeline();
    } else {
      this.updateTimelineStep();
    }

    this.closeModal();
  }

  addStepToTimeline() {
    let date = this.utils.getProperDateFromField(this.timelineStepForm.value.date);

    this.jamService.addStepToTimeline(
      this.application.id,
      this.application.group,
      this.timelineStepForm.value.step,
      this.timelineStepForm.value.notes,
      date
    ).subscribe({
      next: (data: any) => {
        this.loading = false;
        this.onTimelineNeedsUpdate.emit();
        this.onApplicationNeedsUpdate.emit();
      },
      error: () => {
        this.loading = true;
      },
      complete: () => this.loading = true
    })
  }
  
  updateTimelineStep() {
    let date = this.utils.getProperDateFromField(this.timelineStepForm.value.date);

    this.jamService.updateTimelineStep(
      this.timelineStep.id,
      this.timelineStepForm.value.notes,
      date
    ).subscribe({
      next: (data: any) => {
        this.loading = false;
        this.onTimelineNeedsUpdate.emit();
      },
      error: () => {
        this.loading = true;
      },
      complete: () => this.loading = true
    })
  }

  deleteTimelineStep() {
    this.jamService.deleteTimelineStep(
      this.timelineStep.id
    ).subscribe({
      next: () => {
        this.loading = false;
        this.timelineStep = null;
        this.onApplicationNeedsUpdate.emit();
        this.onTimelineNeedsUpdate.emit();
        this.closeModal();
      },
      error: () => {
        this.loading = true;
      },
      complete: () => {
        this.loading = false;
      }
    })
  }

  getNonInitialSteps() {
    this.jamService.getSteps()
    .subscribe({
      next: (data: any) => {
        this.loading = false;
        this.nonInitialSteps = data.filter((s: any) => s.type !== 'S');
      },
      error: (error) => {
        this.loading = true;
      },
      complete: () => this.loading = true
    })
  }
}
