import { inject, LOCALE_ID, provideAppInitializer } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { registerLocaleData } from '@angular/common';
import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { provideRouter } from '@angular/router';
import localeEnCa from '@angular/common/locales/en-CA';

import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { AuthInterceptor } from './app/_services/auth.interceptor';
import { AuthService } from './app/_services/auth.service';
import { registerIcons } from './app/icons';

// Canada locale so that yyyy-mm-dd format is used by Clarity
registerLocaleData(localeEnCa);

registerIcons();

bootstrapApplication(AppComponent, {
  providers: [
    provideAnimations(),
    provideRouter(routes),
    provideHttpClient(withInterceptorsFromDi()),
    { provide: LOCALE_ID, useValue: 'en-ca' },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    provideAppInitializer(() => inject(AuthService).checkAuthStatus()),
  ],
}).catch(console.error);
