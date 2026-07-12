import { FormControl } from '@angular/forms';

describe('CV Review Request validators', () => {
  function minRolesValidator(control: FormControl): { [key: string]: any } | null {
    const roles = control.value as any[];
    if (!roles || roles.length === 0) {
      return { minRoles: true };
    }
    return null;
  }

  function maxRolesValidator(control: FormControl): { [key: string]: any } | null {
    const roles = control.value as any[];
    if (roles && roles.length > 3) {
      return { maxRoles: true };
    }
    return null;
  }

  describe('minRolesValidator', () => {
    it('should return null when roles selected', () => {
      expect(minRolesValidator(new FormControl([{ id: 1 }]))).toBeNull();
    });

    it('should return minRoles when empty array', () => {
      const errors = minRolesValidator(new FormControl([]));
      expect(errors?.['minRoles']).toBeTrue();
    });

    it('should return minRoles when null', () => {
      const errors = minRolesValidator(new FormControl(null));
      expect(errors?.['minRoles']).toBeTrue();
    });
  });

  describe('maxRolesValidator', () => {
    it('should return null when 3 or fewer roles', () => {
      expect(maxRolesValidator(new FormControl([{ id: 1 }, { id: 2 }, { id: 3 }]))).toBeNull();
    });

    it('should return maxRoles when more than 3 roles', () => {
      const errors = maxRolesValidator(new FormControl([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]));
      expect(errors?.['maxRoles']).toBeTrue();
    });
  });
});
