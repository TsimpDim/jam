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
  FormsModule,
  FormBuilder,
  FormGroup,
  AbstractControl,
  ValidatorFn,
} from '@angular/forms';
import { ClarityModule, ClrComboboxModule } from '@clr/angular';
import {
  Industry,
  Role,
  ExperienceLevel,
  City,
  Country,
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
export class LeadGenerationModalComponent implements OnInit, OnDestroy {
  @Input() open: boolean = false;
  @Output() submitted = new EventEmitter<{
    countries: number[];
    cities: number[];
    company_leads_only: boolean;
    roles: number[];
    modes: string[];
    experience_level: number[];
    industries: number[];
    company_sizes: string[];
  }>();
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
      industries: this.fb.control<number[]>([]),
      companySizes: this.fb.control<string[]>(
        ['Startup', 'Scaleup', 'Established', 'Enterprise'],
        [minCompanySizesValidator()],
      ),
    });
  }

  ngOnInit(): void {
    this.referenceDataService
      .getIndustries()
      .pipe(takeUntil(this.destroySubject))
      .subscribe({
        next: (data) => {
          this.industries = data;
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

    this.referenceDataService
      .getExperienceLevels()
      .pipe(takeUntil(this.destroySubject))
      .subscribe({
        next: (data) => {
          this.experienceLevels = data;
        },
      });

    this.referenceDataService
      .getCities()
      .pipe(takeUntil(this.destroySubject))
      .subscribe({
        next: (data) => {
          this.allCities = data.sort((a, b) => a.name.localeCompare(b.name));
        },
      });

    this.referenceDataService
      .getCountries()
      .pipe(takeUntil(this.destroySubject))
      .subscribe({
        next: (data) => {
          this.countries = data.sort((a, b) => a.name.localeCompare(b.name));
        },
      });

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

  ngOnDestroy(): void {
    this.destroySubject.next();
    this.destroySubject.complete();
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
    });
  }

  clearSearch(combo: any): void {
    queueMicrotask(() => {
      combo.searchText = '';
    });
  }

  close(): void {
    this.form.reset({
      companyLeadsOnly: false,
      modes: ['On-Site', 'Hybrid', 'Remote'],
      experienceLevel: [],
      industries: [],
      companySizes: ['Startup', 'Scaleup', 'Established', 'Enterprise'],
      countries: [],
      roles: [],
      cities: [],
    });
    this.submitting = false;
    this.closed.emit();
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
