import { Injectable, signal, effect } from '@angular/core';

const THEME_STORAGE_KEY = 'jam_theme';
const DARK_THEME_CLASS = 'jam-theme-dark';

export type Theme = 'light' | 'dark';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  readonly theme = signal<Theme>(this.loadTheme());
  readonly isDark = signal<boolean>(this.theme() === 'dark');

  constructor() {
    effect(() => {
      const current = this.theme();
      this.applyTheme(current);
      localStorage.setItem(THEME_STORAGE_KEY, current);
    });
  }

  private loadTheme(): Theme {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'dark' || stored === 'light') {
        return stored;
      }
    } catch {
      // localStorage unavailable
    }
    return 'light';
  }

  toggle(): void {
    this.theme.set(this.theme() === 'dark' ? 'light' : 'dark');
    this.isDark.set(this.theme() === 'dark');
  }

  private applyTheme(theme: Theme): void {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add(DARK_THEME_CLASS);
    } else {
      root.classList.remove(DARK_THEME_CLASS);
    }
  }
}
