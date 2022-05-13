import { formatDate } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Utils } from 'src/app/shared/shared.utils';
import { JamService } from 'src/app/_services/jam.service';

@Component({
  selector: 'app-job-modal',
  templateUrl: './job-modal.component.html',
  styleUrls: ['./job-modal.component.scss']
})
export class JobModalComponent implements OnInit, OnChanges {
  @Input() isOpen: boolean = false;
  @Input() application: any = null;
  @Output() onClose = new EventEmitter();
  @Output() onApplicationsNeedUpdate = new EventEmitter();

  public jobAppForm: FormGroup;
  public loading: boolean = true;
  public initialSteps: any = null;
  public groups: any = null;

  constructor(
    private jamService: JamService,
    private formBuilder: FormBuilder,
    private utils: Utils
  ) {
    this.jobAppForm = this.formBuilder.group({
      'company': new FormControl('', [Validators.required]),
      'role': new FormControl('', [Validators.required]),
      'date': new FormControl('', [Validators.required]),
      'location': new FormControl('', []),
      'notes': new FormControl('', []),
      'group': new FormControl('', [Validators.required]),
      'initialStep': new FormControl('', [Validators.required])
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (
      'application' in changes &&
      changes['application'].currentValue !== undefined &&
      changes['application'].currentValue !== null
    ) {
      let application = this.application;
      application.date = this.utils.getProperDisplayDate(application.date);

      this.jobAppForm.reset(application);
    }
  }

  closeModal() {
    this.jobAppForm.reset();
    this.onClose.emit();
  }

  ngOnInit(): void {
    this.getInitialSteps();
    this.getGroups();
  }

  getGroups() {
    this.jamService.getGroups()
    .subscribe({
      next: (data) => {
        this.loading = false;
        this.groups = data;
      },
      error: (error) => {
        this.loading = true;
      },
      complete: () => this.loading = true
    })
  }

  getInitialSteps() {
    this.jamService.getSteps()
    .subscribe({
      next: (data: any) => {
        this.loading = false;
        this.initialSteps = data.filter((s: any) => s.type === 'S');
      },
      error: (error) => {
        this.loading = true;
      },
      complete: () => this.loading = true
    })
  }
  
  submitJobAppForm() {
    if (this.application === null) {
      this.createJobApplication();
    } else {
      this.updateJobApplication();
    }

    this.closeModal();
  }

  createJobApplication() {
    let date = this.utils.getProperDateFromField(this.jobAppForm.value.date);

    this.jamService.createJobApplication(
      this.jobAppForm.value.company,
      this.jobAppForm.value.role,
      this.jobAppForm.value.location,
      this.jobAppForm.value.notes,
      date,
      this.jobAppForm.value.group,
      this.jobAppForm.value.initialStep
    ).subscribe({
      next: (data: any) => {
        this.loading = false;
        this.onApplicationsNeedUpdate.emit();
      },
      error: () => {
        this.loading = true;
      },
      complete: () => this.loading = true
    })
  }

  updateJobApplication() {
    let date = this.utils.getProperDateFromField(this.jobAppForm.value.date);

    this.jamService.updateJobApplication(
      this.application.id,
      this.jobAppForm.value.company,
      this.jobAppForm.value.role,
      this.jobAppForm.value.location,
      this.jobAppForm.value.notes,
      date,
      this.jobAppForm.value.group
    ).subscribe({
      next: (data: any) => {
        this.loading = false;
        this.application = null;
        this.onApplicationsNeedUpdate.emit();
      },
      error: () => {
        this.loading = true;
      },
      complete: () => this.loading = true
    })
  }

  deleteJobApp(jobAppId: number) {
    this.jamService.deleteJobApplication(
      jobAppId
    ).subscribe({
      next: () => {
        this.loading = false;
        this.application = null;
        this.onApplicationsNeedUpdate.emit();
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
}
