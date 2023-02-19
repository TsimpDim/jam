import { Component, EventEmitter, HostListener, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { JamService } from 'src/app/_services/jam.service';

@Component({
  selector: 'app-job-modal',
  templateUrl: './job-modal.component.html',
  styleUrls: ['./job-modal.component.scss']
})
export class JobModalComponent implements OnInit, OnChanges {
  @Input() isOpen: boolean = false;
  @Input() application: any = null;
  @Input() groupToSelect: any = null;
  @Output() onClose = new EventEmitter();
  @Output() onApplicationsNeedUpdate = new EventEmitter();

  @HostListener('document:keydown.escape', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) { 
    this.onClose.emit();
  }

  public jobAppForm: FormGroup;
  public loading: boolean = false;
  public initialSteps: any = null;
  public groups: any = null;

  constructor(
    private jamService: JamService,
    private formBuilder: FormBuilder
  ) {
    this.jobAppForm = this.formBuilder.group({
      'company': new FormControl('', [Validators.required]),
      'role': new FormControl('', [Validators.required]),
      'date': new FormControl('', [Validators.required]),
      'location': new FormControl('', []),
      'appliedThrough': new FormControl('', []),
      'externalLink': new FormControl('', []),
      'notes': new FormControl('', []),
      'group': new FormControl('', [Validators.required]),
      'initialStep': new FormControl('', [Validators.required])
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    // if 'application' has changed, re-fill all the fields
    if (
      'application' in changes &&
      (changes['application'].currentValue !== undefined &&
      changes['application'].currentValue !== null)
    ) {
      let application = this.application;
      application.externalLink = application.external_link;
      application.appliedThrough = application.applied_through;
      this.jobAppForm.reset(application);
    // if it has changed but has been nulled, make sure
    // to show default values in jobapp creation modal
    } else if (
      ('application' in changes &&
      (changes['application'].currentValue == undefined ||
      changes['application'].currentValue !== null)) || ('groupToSelect' in changes)
    ) {
      this.jobAppForm.reset();

      if (this.groups !== null && this.initialSteps !== null) {
        // set default values in form
        this.jobAppForm.patchValue({
          'group': this.getDefaultGroup(),
          'initialStep': this.initialSteps[0].id
        })
      }
    }
  }

  getDefaultGroup() {
    let defaultGroupId = '';
    if (this.groups) {
      defaultGroupId = this.groups[0].id;
      if (this.groupToSelect) {
        defaultGroupId = this.groups.find((g: any) => g.name === this.groupToSelect).id;
      }
    }

    return defaultGroupId;
  }

  closeModal() {
    this.onClose.emit();
  }

  ngOnInit(): void {
    this.getInitialSteps();
    this.getGroups();
  }

  submitJobAppForm() {
    if (this.application === null) {
      this.createJobApplication();
    } else {
      this.updateJobApplication();
    }
  }

  getGroups() {
    this.jamService.getGroups()
    .subscribe({
      next: (data) => {
        this.groups = data;

        // set default value in form
        this.jobAppForm.patchValue({
          'group': this.getDefaultGroup()
        })
      }
    })
  }

  getInitialSteps() {
    this.jamService.getSteps()
    .subscribe({
      next: (data: any) => {
        this.initialSteps = data.filter((s: any) => s.type === 'S');

        // set default value in form
        this.jobAppForm.patchValue({
          'initialStep': this.initialSteps[0].id
        })
      }
    })
  }

  createJobApplication() {
    this.loading = true;
    this.jamService.createJobApplication(
      this.jobAppForm.value.company,
      this.jobAppForm.value.role,
      this.jobAppForm.value.location,
      this.jobAppForm.value.appliedThrough,
      this.jobAppForm.value.externalLink,
      this.jobAppForm.value.notes,
      this.jobAppForm.value.date,
      this.jobAppForm.value.group,
      this.jobAppForm.value.initialStep
    ).subscribe({
      next: () => {
        this.onApplicationsNeedUpdate.emit();
      },
      error: () => {
        this.loading = false;
      },
      complete: () => {
        this.closeModal();
        this.loading = false;
      }
    })
  }

  updateJobApplication() {
    this.loading = true;
    this.jamService.updateJobApplication(
      this.application.id,
      this.jobAppForm.value.company,
      this.jobAppForm.value.role,
      this.jobAppForm.value.location,
      this.jobAppForm.value.appliedThrough,
      this.jobAppForm.value.externalLink,
      this.jobAppForm.value.notes,
      this.jobAppForm.value.date,
      this.jobAppForm.value.group
    ).subscribe({
      next: () => {
        this.application = null;
        this.onApplicationsNeedUpdate.emit();
      },
      error: () => {
        this.loading = false;
      },
      complete: () => {
        this.closeModal();
        this.loading = false;
      }
    })
  }

  deleteJobApp(jobAppId: number) {
    this.loading = true;
    this.jamService.deleteJobApplication(
      jobAppId
    ).subscribe({
      next: () => {
        this.application = null;
        this.onApplicationsNeedUpdate.emit();
      },
      error: () => {
        this.loading = false;
      },
      complete: () => {
        this.closeModal();
        this.loading = false;
      }
    })
  }
}
