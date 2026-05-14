import {
  Component,
  EventEmitter,
  Input,
  Output,
  CUSTOM_ELEMENTS_SCHEMA,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ClarityModule, ClrComboboxModule } from '@clr/angular';
import { ExperienceLevel, Industry, Role } from 'src/app/interfaces';
import { ReferenceDataService } from 'src/app/core/services/reference-data.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-cv-review-request-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ClarityModule,
    ClrComboboxModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './cv-review-request-modal.component.html',
  styleUrls: ['./cv-review-request-modal.component.scss'],
})
export class CVReviewModalComponent implements OnInit, OnDestroy {
  @Input() open: boolean = false;
  @Output() submitted = new EventEmitter<{
    industry: number;
    experienceLevel: number;
    roles: number[];
  }>();
  @Output() closed = new EventEmitter<void>();

  form: FormGroup;
  submitting = false;

  // Reference data
  industries: Industry[] = [];
  experienceLevels: ExperienceLevel[] = [];
  allRoles: Role[] = [];

  private destroySubject = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private referenceDataService: ReferenceDataService
  ) {
    this.form = this.fb.group({
      industry: new FormControl(null, [Validators.required]),
      experienceLevel: new FormControl(null, [Validators.required]),
      roles: new FormControl(
        [],
        [Validators.required, this.minRolesValidator, this.maxRolesValidator]
      ),
    });
  }

  ngOnInit(): void {
    // Load reference data with lazy caching
    this.referenceDataService
      .getIndustries()
      .pipe(takeUntil(this.destroySubject))
      .subscribe({
        next: (data) => {
          this.industries = data;
        },
      });

    this.referenceDataService
      .getExperienceLevels()
      .pipe(takeUntil(this.destroySubject))
      .subscribe({
        next: (data) => {
          this.experienceLevels = data;
        },
      });

    this.referenceDataService
      .getRoles()
      .pipe(takeUntil(this.destroySubject))
      .subscribe({
        next: (data) => {
          this.allRoles = data;
        },
      });
  }

  ngOnDestroy(): void {
    this.destroySubject.next();
    this.destroySubject.complete();
  }

  private minRolesValidator(
    control: FormControl
  ): { [key: string]: any } | null {
    const roles = control.value as Role[];
    if (!roles || roles.length === 0) {
      return { minRoles: true };
    }
    return null;
  }

  private maxRolesValidator(
    control: FormControl
  ): { [key: string]: any } | null {
    const roles = control.value as Role[];
    if (roles && roles.length > 3) {
      return { maxRoles: true };
    }
    return null;
  }

  onModalOpenChange(isOpen: boolean): void {
    if (!isOpen) {
      this.close();
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const selectedRoles = this.form.get('roles')!.value as Role[];

    this.submitting = true;
    this.submitted.emit({
      industry: this.form.get('industry')!.value,
      experienceLevel: this.form.get('experienceLevel')!.value,
      roles: selectedRoles.map((r) => r.id),
    });
  }

  close(): void {
    this.form.reset();
    this.submitting = false;
    this.closed.emit();
  }
}
