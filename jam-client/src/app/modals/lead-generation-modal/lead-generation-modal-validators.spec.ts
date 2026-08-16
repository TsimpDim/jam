import { FormControl } from '@angular/forms';
import { ValidatorFn, Validators } from '@angular/forms';

function minCountriesValidator(): ValidatorFn {
  return (control: any) => {
    const countries = control.value as any[];
    if (!countries || countries.length === 0) {
      return { minCountries: true };
    }
    return null;
  };
}

function minRolesValidator(): ValidatorFn {
  return (control: any) => {
    if (control.disabled) {
      return null;
    }
    const roles = control.value as any[];
    if (!roles || roles.length === 0) {
      return { minRoles: true };
    }
    return null;
  };
}

function minModesValidator(): ValidatorFn {
  return (control: any) => {
    const modes = control.value as string[];
    if (!modes || modes.length === 0) {
      return { minModes: true };
    }
    return null;
  };
}

function minCompanySizesValidator(): ValidatorFn {
  return (control: any) => {
    const sizes = control.value as string[];
    if (!sizes || sizes.length === 0) {
      return { minCompanySizes: true };
    }
    return null;
  };
}

function minExperienceLevelsValidator(): ValidatorFn {
  return (control: any) => {
    if (control.disabled) {
      return null;
    }
    const levels = control.value as any[];
    if (!levels || levels.length === 0) {
      return { minExperienceLevels: true };
    }
    return null;
  };
}

describe('LeadGenerationModal validators', () => {
  describe('minCountriesValidator', () => {
    it('should return null when countries selected', () => {
      const control = new FormControl([{ id: 1 }]);
      expect(minCountriesValidator()(control)).toBeNull();
    });

    it('should return minCountries when empty', () => {
      const ctrl = new FormControl([]);
      const errors = minCountriesValidator()(ctrl);
      expect(errors?.['minCountries']).toBeTrue();
    });

    it('should return minCountries when null', () => {
      const ctrl = new FormControl(null);
      const errors = minCountriesValidator()(ctrl);
      expect(errors?.['minCountries']).toBeTrue();
    });
  });

  describe('minRolesValidator', () => {
    it('should return null when roles selected', () => {
      const ctrl = new FormControl([{ id: 1 }]);
      expect(minRolesValidator()(ctrl)).toBeNull();
    });

    it('should return minRoles when empty', () => {
      const ctrl = new FormControl([]);
      const errors = minRolesValidator()(ctrl);
      expect(errors?.['minRoles']).toBeTrue();
    });

    it('should return null when disabled', () => {
      const ctrl = new FormControl({ value: [], disabled: true });
      ctrl.disable();
      expect(minRolesValidator()(ctrl)).toBeNull();
    });
  });

  describe('minModesValidator', () => {
    it('should return null when modes selected', () => {
      const ctrl = new FormControl(['Remote']);
      expect(minModesValidator()(ctrl)).toBeNull();
    });

    it('should return minModes when empty', () => {
      const ctrl = new FormControl([]);
      const errors = minModesValidator()(ctrl);
      expect(errors?.['minModes']).toBeTrue();
    });
  });

  describe('minCompanySizesValidator', () => {
    it('should return null when sizes selected', () => {
      const ctrl = new FormControl(['Startup']);
      expect(minCompanySizesValidator()(ctrl)).toBeNull();
    });

    it('should return minCompanySizes when empty', () => {
      const ctrl = new FormControl([]);
      const errors = minCompanySizesValidator()(ctrl);
      expect(errors?.['minCompanySizes']).toBeTrue();
    });
  });

  describe('minExperienceLevelsValidator', () => {
    it('should return null when levels selected', () => {
      const ctrl = new FormControl([{ id: 1 }]);
      expect(minExperienceLevelsValidator()(ctrl)).toBeNull();
    });

    it('should return minExperienceLevels when empty', () => {
      const ctrl = new FormControl([]);
      const errors = minExperienceLevelsValidator()(ctrl);
      expect(errors?.['minExperienceLevels']).toBeTrue();
    });

    it('should return null when disabled', () => {
      const ctrl = new FormControl({ value: [], disabled: true });
      ctrl.disable();
      expect(minExperienceLevelsValidator()(ctrl)).toBeNull();
    });
  });

  describe('numLeads validators (required, min 1, max 15)', () => {
    it('should accept values between 1 and 15', () => {
      for (const value of [1, 5, 15]) {
        const ctrl = new FormControl(value, [
          Validators.required,
          Validators.min(1),
          Validators.max(15),
        ]);
        expect(ctrl.valid).toBeTrue();
      }
    });

    it('should reject 0', () => {
      const ctrl = new FormControl(0, [
        Validators.required,
        Validators.min(1),
        Validators.max(15),
      ]);
      expect(ctrl.errors?.['min']).toBeTruthy();
    });

    it('should reject values above 15', () => {
      const ctrl = new FormControl(16, [
        Validators.required,
        Validators.min(1),
        Validators.max(15),
      ]);
      expect(ctrl.errors?.['max']).toBeTruthy();
    });

    it('should reject empty values', () => {
      const ctrl = new FormControl(null, [
        Validators.required,
        Validators.min(1),
        Validators.max(15),
      ]);
      expect(ctrl.errors?.['required']).toBeTruthy();
    });
  });
});
