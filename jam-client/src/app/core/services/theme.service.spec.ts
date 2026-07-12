import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  describe('default theme', () => {
    it('should default to light when no stored theme', () => {
      spyOn(localStorage, 'getItem').and.returnValue(null);
      service = TestBed.inject(ThemeService);
      expect(service.theme()).toBe('light');
      expect(service.isDark()).toBeFalse();
    });

    it('should load dark theme from localStorage', () => {
      spyOn(localStorage, 'getItem').and.returnValue('dark');
      service = TestBed.inject(ThemeService);
      expect(service.theme()).toBe('dark');
      expect(service.isDark()).toBeTrue();
    });
  });

  describe('toggle', () => {
    it('should toggle from light to dark', () => {
      spyOn(localStorage, 'getItem').and.returnValue(null);
      service = TestBed.inject(ThemeService);
      service.toggle();
      expect(service.theme()).toBe('dark');
      expect(service.isDark()).toBeTrue();
    });

    it('should toggle from dark to light', () => {
      spyOn(localStorage, 'getItem').and.returnValue('dark');
      service = TestBed.inject(ThemeService);
      service.toggle();
      expect(service.theme()).toBe('light');
      expect(service.isDark()).toBeFalse();
    });
  });

  describe('persistence', () => {
    it('should save theme to localStorage on toggle', () => {
      spyOn(localStorage, 'getItem').and.returnValue(null);
      spyOn(localStorage, 'setItem');
      service = TestBed.inject(ThemeService);
      TestBed.flushEffects();
      service.toggle();
      TestBed.flushEffects();
      expect(localStorage.setItem).toHaveBeenCalledWith('jam_theme', 'dark');
    });
  });

  describe('applyTheme', () => {
    it('should add dark class when dark', () => {
      spyOn(localStorage, 'getItem').and.returnValue('dark');
      spyOn(document.documentElement.classList, 'add');
      service = TestBed.inject(ThemeService);
      TestBed.flushEffects();
      expect(document.documentElement.classList.add).toHaveBeenCalledWith('jam-theme-dark');
    });

    it('should remove dark class when light', () => {
      spyOn(localStorage, 'getItem').and.returnValue(null);
      spyOn(document.documentElement.classList, 'remove');
      service = TestBed.inject(ThemeService);
      TestBed.flushEffects();
      expect(document.documentElement.classList.remove).toHaveBeenCalledWith('jam-theme-dark');
    });
  });
});
