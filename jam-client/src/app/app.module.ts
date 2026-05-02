import {
  LOCALE_ID,
  NgModule,
  CUSTOM_ELEMENTS_SCHEMA,
  APP_INITIALIZER,
} from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ClarityModule } from '@clr/angular';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { AppComponent } from './app.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import localeEnCa from '@angular/common/locales/en-CA';

import '@cds/core/icon/register.js';
import {
  ClarityIcons,
  cogIcon,
  idBadgeIcon,
  plusIcon,
  organizationIcon,
  noteIcon,
  calendarIcon,
  mapMarkerIcon,
  blockIcon,
  flagIcon,
  nodeIcon,
  blocksGroupIcon,
  pencilIcon,
  infoStandardIcon,
  linkIcon,
  helpIcon,
  colorPaletteIcon,
  dragHandleIcon,
  barsIcon,
  filter2Icon,
  searchIcon,
  clockIcon,
  clipboardIcon,
  uploadIcon,
  fileIcon,
  folderIcon,
  downloadIcon,
  trashIcon,
  checkCircleIcon,
} from '@cds/core/icon';
import { AppRoutingModule } from './routes/routes.module';
import { RoutesComponent } from './routes/routes.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { ForgotPasswordComponent } from './auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './auth/reset-password/reset-password.component';
import { HeaderComponent } from './shared/header/header.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './_services/auth.interceptor';
import { ApplicationsComponent } from './control-panel/applications/applications.component';
import { StepsComponent } from './control-panel/steps/steps.component';
import { JobModalComponent } from './control-panel/job-modal/job-modal.component';
import { TimelineModalComponent } from './control-panel/timeline-modal/timeline-modal.component';
import { GroupModalComponent } from './control-panel/group-modal/group-modal.component';
import { JobNavComponent } from './control-panel/job-nav/job-nav.component';
import { registerLocaleData } from '@angular/common';
import { AnalyticsComponent } from './control-panel/analytics/analytics.component';
import { BadgeComponent } from './shared/badge/badge.component';
import { LeadsComponent } from './control-panel/leads/leads.component';
import { SankeyComponent } from './control-panel/analytics/sankey/sankey.component';
import { CvComponent } from './control-panel/cv/cv.component';
import { CvUploadModalComponent } from './control-panel/cv/cv-upload-modal/cv-upload-modal.component';
import { AuthService } from './_services/auth.service';

ClarityIcons.addIcons(
  idBadgeIcon,
  cogIcon,
  organizationIcon,
  noteIcon,
  helpIcon,
  plusIcon,
  calendarIcon,
  mapMarkerIcon,
  blockIcon,
  flagIcon,
  nodeIcon,
  pencilIcon,
  blocksGroupIcon,
  colorPaletteIcon,
  linkIcon,
  infoStandardIcon,
  dragHandleIcon,
  barsIcon,
  filter2Icon,
  searchIcon,
  clockIcon,
  clipboardIcon,
  uploadIcon,
  fileIcon,
  folderIcon,
  downloadIcon,
  trashIcon,
  checkCircleIcon
);

// Canada locale, so that yyyy-mm-dd format is used by Clarity
registerLocaleData(localeEnCa);

export function initializeAuth(authService: AuthService): () => Promise<void> {
  return () => authService.checkAuthStatus();
}

@NgModule({
  declarations: [
    AppComponent,
    ApplicationsComponent,
    RoutesComponent,
    LoginComponent,
    RegisterComponent,
    ForgotPasswordComponent,
    ResetPasswordComponent,
    HeaderComponent,
    ApplicationsComponent,
    StepsComponent,
    JobModalComponent,
    TimelineModalComponent,
    GroupModalComponent,
    JobNavComponent,
    AnalyticsComponent,
    BadgeComponent,
    LeadsComponent,
    SankeyComponent,
    CvComponent,
    CvUploadModalComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    ClarityModule,
    DragDropModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    HttpClientModule,
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'en-ca' },
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    {
      provide: APP_INITIALIZER,
      useFactory: initializeAuth,
      deps: [AuthService],
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}
