import {
  Component,
  EventEmitter,
  Input,
  Output,
  CUSTOM_ELEMENTS_SCHEMA,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormsModule,
  FormBuilder,
  FormGroup,
  AbstractControl,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { ClarityModule, ClrComboboxModule } from '@clr/angular';
import {
  Industry,
  Role,
  ExperienceLevel,
  City,
  Country,
  ScheduledLeadGenerationRequest,
} from 'src/app/interfaces';
import { ReferenceDataService } from 'src/app/core/services/reference-data.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

function minCountriesValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const countries = control.value as Country[];
    if (!countries || countries.length === 0) {
      return { minCountries: true };
    }
    return null;
  };
}

function minRolesValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (control.disabled) {
      return null;
    }
    const roles = control.value as Role[];
    if (!roles || roles.length === 0) {
      return { minRoles: true };
    }
    return null;
  };
}

function minModesValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const modes = control.value as string[];
    if (!modes || modes.length === 0) {
      return { minModes: true };
    }
    return null;
  };
}

function minCompanySizesValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    const sizes = control.value as string[];
    if (!sizes || sizes.length === 0) {
      return { minCompanySizes: true };
    }
    return null;
  };
}

function minExperienceLevelsValidator(): ValidatorFn {
  return (control: AbstractControl): { [key: string]: any } | null => {
    if (control.disabled) {
      return null;
    }
    const levels = control.value as ExperienceLevel[];
    if (!levels || levels.length === 0) {
      return { minExperienceLevels: true };
    }
    return null;
  };
}

export interface LeadGenerationPayload {
  countries: number[];
  cities: number[];
  company_leads_only: boolean;
  roles: number[];
  modes: string[];
  experience_level: number[];
  industries: number[];
  company_sizes: string[];
  num_leads: number;
  additional_comment: string | null;
}

@Component({
  selector: 'app-lead-generation-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    ClarityModule,
    ClrComboboxModule,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './lead-generation-modal.component.html',
  styleUrls: ['./lead-generation-modal.component.scss'],
})
export class LeadGenerationModalComponent
  implements OnInit, OnDestroy, OnChanges
{
  @Input() open: boolean = false;
  @Input() scheduleMode: boolean = false;
  @Input() prefill: ScheduledLeadGenerationRequest | null = null;
  @Output() submitted = new EventEmitter<LeadGenerationPayload>();
  @Output() scheduleCancelled = new EventEmitter<void>();
  @Output() closed = new EventEmitter<void>();

  form: FormGroup;
  submitting = false;

  industries: Industry[] = [];
  allRoles: Role[] = [];
  experienceLevels: ExperienceLevel[] = [];
  allCities: City[] = [];
  countries: Country[] = [];

  readonly modeOptions = ['On-Site', 'Hybrid', 'Remote'];
  readonly companySizeOptions = [
    'Startup',
    'Scaleup',
    'Established',
    'Enterprise',
  ];

  private destroySubject = new Subject<void>();
  private referenceDataLoaded = false;

  constructor(
    private fb: FormBuilder,
    private referenceDataService: ReferenceDataService,
  ) {
    this.form = this.fb.group({
      countries: this.fb.control<Country[]>([], [minCountriesValidator()]),
      cities: this.fb.control<City[]>([]),
      companyLeadsOnly: this.fb.control<boolean>(false),
      roles: this.fb.control<Role[]>([], [minRolesValidator()]),
      modes: this.fb.control<string[]>(
        ['On-Site', 'Hybrid', 'Remote'],
        [minModesValidator()],
      ),
      experienceLevel: this.fb.control<ExperienceLevel[]>(
        [],
        [minExperienceLevelsValidator()],
      ),
      industries: this.fb.control<Industry[]>([]),
      companySizes: this.fb.control<string[]>(
        ['Startup', 'Scaleup', 'Established', 'Enterprise'],
        [minCompanySizesValidator()],
      ),
      numLeads: this.fb.control<number>(15, [
        Validators.required,
        Validators.min(1),
        Validators.max(15),
      ]),
      additionalComment: this.fb.control<string>('', [
        Validators.maxLength(500),
      ]),
    });
  }

  ngOnInit(): void {
    this.loadReferenceData();
    this.subscribeToFormChanges();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['open'] || changes['prefill']) && this.open) {
      this.applyPrefillIfNeeded();
    }
    if (
      (changes['scheduleMode'] || changes['prefill']) &&
      !this.scheduleMode &&
      this.prefill === null
    ) {
      this.resetToDefaults();
    }
  }

  ngOnDestroy(): void {
    this.destroySubject.next();
    this.destroySubject.complete();
  }

  private loadReferenceData(): void {
    this.referenceDataService
      .getIndustries()
      .pipe(takeUntil(this.destroySubject))
      .subscribe({
        next: (data) => {
          this.industries = data;
          this.checkReferenceDataLoaded();
        },
      });

    this.referenceDataService
      .getRoles()
      .pipe(takeUntil(this.destroySubject))
      .subscribe({
        next: (data) => {
          this.allRoles = data;
          this.checkReferenceDataLoaded();
        },
      });

    this.referenceDataService
      .getExperienceLevels()
      .pipe(takeUntil(this.destroySubject))
      .subscribe({
        next: (data) => {
          this.experienceLevels = data;
          this.checkReferenceDataLoaded();
        },
      });

    this.referenceDataService
      .getCities()
      .pipe(takeUntil(this.destroySubject))
      .subscribe({
        next: (data) => {
          this.allCities = data.sort((a, b) => a.name.localeCompare(b.name));
          this.checkReferenceDataLoaded();
        },
      });

    this.referenceDataService
      .getCountries()
      .pipe(takeUntil(this.destroySubject))
      .subscribe({
        next: (data) => {
          this.countries = data.sort((a, b) => a.name.localeCompare(b.name));
          this.checkReferenceDataLoaded();
        },
      });
  }

  private checkReferenceDataLoaded(): void {
    this.referenceDataLoaded = true;
    this.applyPrefillIfNeeded();
  }

  private subscribeToFormChanges(): void {
    this.form
      .get('companyLeadsOnly')
      ?.valueChanges.pipe(takeUntil(this.destroySubject))
      .subscribe((value: boolean) => {
        if (value) {
          this.form.get('roles')?.disable();
          this.form.get('experienceLevel')?.disable();
        } else {
          this.form.get('roles')?.enable();
          this.form.get('experienceLevel')?.enable();
        }
      });

    this.form
      .get('countries')
      ?.valueChanges.pipe(takeUntil(this.destroySubject))
      .subscribe(() => {
        const selectedCountryIds = this.getSelectedCountryIds();
        if (selectedCountryIds.size === 0) {
          return;
        }
        const selectedCities =
          (this.form.get('cities')?.value as City[]) || [];
        const validCities = selectedCities.filter(
          (c) => c.country !== null && selectedCountryIds.has(c.country),
        );
        if (validCities.length !== selectedCities.length) {
          this.form.get('cities')?.setValue(validCities);
        }
      });
  }

  private applyPrefillIfNeeded(): void {
    if (!this.open || !this.prefill || !this.referenceDataLoaded) {
      return;
    }
    const prefill = this.prefill;
    const countryObjs = this.countries.filter((c) =>
      (prefill.countries || []).includes(c.id),
    );
    const cityObjs = this.allCities.filter((c) =>
      (prefill.cities || []).includes(c.id),
    );
    const roleObjs = this.allRoles.filter((r) =>
      (prefill.roles || []).includes(r.id),
    );
    const experienceObjs = this.experienceLevels.filter((l) =>
      (prefill.experience_level || []).includes(l.id),
    );
    const industryObjs = this.industries.filter((i) =>
      (prefill.industries || []).includes(i.id),
    );

    this.form.setValue({
      countries: countryObjs,
      cities: cityObjs,
      companyLeadsOnly: prefill.company_leads_only,
      roles: roleObjs,
      modes: [...(prefill.modes || [])],
      experienceLevel: experienceObjs,
      industries: industryObjs,
      companySizes: [...(prefill.company_sizes || [])],
      numLeads: prefill.num_leads ?? 15,
      additionalComment: prefill.additional_comment ?? '',
    });

    if (prefill.company_leads_only) {
      this.form.get('roles')?.disable();
      this.form.get('experienceLevel')?.disable();
    }
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

    const selectedCountries = this.form.get('countries')!.value as Country[];
    const selectedCities = (this.form.get('cities')!.value as City[]) || [];
    const companyLeadsOnly = this.form.get('companyLeadsOnly')!
      .value as boolean;
    const selectedRoles = (this.form.get('roles')!.value as Role[]) || [];
    const modes = this.form.get('modes')!.value as string[];
    const experienceLevels = (this.form.get('experienceLevel')!
      .value as ExperienceLevel[]) || [];
    const selectedIndustries =
      (this.form.get('industries')!.value as Industry[]) || [];
    const companySizes = this.form.get('companySizes')!.value as string[];
    const numLeads = this.form.get('numLeads')!.value as number;
    const additionalComment =
      (this.form.get('additionalComment')!.value as string) || '';

    this.submitting = true;
    this.submitted.emit({
      countries: selectedCountries.map((c) => c.id),
      cities: selectedCities.map((c) => c.id),
      company_leads_only: companyLeadsOnly,
      roles: companyLeadsOnly ? [] : selectedRoles.map((r) => r.id),
      modes,
      experience_level: companyLeadsOnly
        ? []
        : experienceLevels.map((l) => l.id),
      industries: selectedIndustries.map((i) => i.id),
      company_sizes: companySizes,
      num_leads: numLeads,
      additional_comment: additionalComment.trim()
        ? additionalComment.trim()
        : null,
    });
  }

  cancelSchedule(): void {
    this.scheduleCancelled.emit();
  }

  clearSearch(combo: any): void {
    queueMicrotask(() => {
      combo.searchText = '';
    });
  }

  close(): void {
    this.resetToDefaults();
    this.submitting = false;
    this.closed.emit();
  }

  private resetToDefaults(): void {
    this.form.reset({
      companyLeadsOnly: false,
      modes: ['On-Site', 'Hybrid', 'Remote'],
      experienceLevel: [],
      industries: [],
      companySizes: ['Startup', 'Scaleup', 'Established', 'Enterprise'],
      countries: [],
      roles: [],
      cities: [],
      numLeads: 15,
      additionalComment: '',
    });
  }

  onCheckboxChange(event: Event, controlName: string): void {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    const current = this.form.get(controlName)!.value as string[];

    if (target.checked) {
      if (!current.includes(value)) {
        this.form.get(controlName)!.setValue([...current, value]);
      }
    } else {
      this.form.get(controlName)!.setValue(current.filter((v) => v !== value));
    }
  }

  get availableCountries(): Country[] {
    const selected = (this.form.get('countries')?.value as Country[]) || [];
    const selectedIds = new Set(selected.map((c) => c.id));
    return this.countries.filter((c) => !selectedIds.has(c.id));
  }

  get availableRoles(): Role[] {
    const selected = (this.form.get('roles')?.value as Role[]) || [];
    const selectedIds = new Set(selected.map((r) => r.id));
    return this.allRoles.filter((r) => !selectedIds.has(r.id));
  }

  get availableIndustries(): Industry[] {
    const selected = (this.form.get('industries')?.value as Industry[]) || [];
    const selectedIds = new Set(selected.map((i) => i.id));
    return this.industries.filter((i) => !selectedIds.has(i.id));
  }

  get selectedModes(): string[] {
    return (this.form.get('modes')?.value as string[]) || [];
  }

  get selectedCompanySizes(): string[] {
    return (this.form.get('companySizes')?.value as string[]) || [];
  }

  get additionalCommentLength(): number {
    const value = (this.form.get('additionalComment')?.value as string) || '';
    return value.length;
  }

  onModeChange(mode: string, checked: boolean): void {
    const current = (this.form.get('modes')?.value as string[]) || [];
    if (checked) {
      if (!current.includes(mode)) {
        this.form.get('modes')?.setValue([...current, mode]);
      }
    } else {
      this.form.get('modes')?.setValue(current.filter((m) => m !== mode));
    }
  }

  onCompanySizeChange(size: string, checked: boolean): void {
    const current = (this.form.get('companySizes')?.value as string[]) || [];
    if (checked) {
      if (!current.includes(size)) {
        this.form.get('companySizes')?.setValue([...current, size]);
      }
    } else {
      this.form
        .get('companySizes')
        ?.setValue(current.filter((s) => s !== size));
    }
  }

  get availableExperienceLevels(): ExperienceLevel[] {
    const selected =
      (this.form.get('experienceLevel')?.value as ExperienceLevel[]) || [];
    const selectedIds = new Set(selected.map((l) => l.id));
    return this.experienceLevels.filter((l) => !selectedIds.has(l.id));
  }

  get availableCities(): City[] {
    const selected = (this.form.get('cities')?.value as City[]) || [];
    const selectedIds = new Set(selected.map((c) => c.id));
    let filtered = this.allCities.filter((c) => !selectedIds.has(c.id));

    const selectedCountryIds = this.getSelectedCountryIds();
    if (selectedCountryIds.size > 0) {
      filtered = filtered.filter(
        (c) => c.country !== null && selectedCountryIds.has(c.country),
      );
    }
    return filtered;
  }

  /**
   * Returns the set of country ids corresponding to the currently selected
   * countries.
   */
  private getSelectedCountryIds(): Set<number> {
    const selectedCountries =
      (this.form.get('countries')?.value as Country[]) || [];
    return new Set(selectedCountries.map((c) => c.id));
  }
}
