import { LOCALE_ID, NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
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
} from '@cds/core/icon';
import { AppRoutingModule } from './routes/routes.module';
import { RoutesComponent } from './routes/routes.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { HeaderComponent } from './shared/header/header.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './_services/auth.interceptor';
import { ApplicationsComponent } from './control-panel/applications/applications.component';
import { GroupsComponent } from './control-panel/groups/groups.component';
import { StepsComponent } from './control-panel/steps/steps.component';
import { JobModalComponent } from './control-panel/job-modal/job-modal.component';
import { TimelineModalComponent } from './control-panel/timeline-modal/timeline-modal.component';
import { HomeComponent } from './home/home.component';
import { JobNavComponent } from './control-panel/job-nav/job-nav.component';
import { registerLocaleData } from '@angular/common';
import { AnalyticsComponent } from './control-panel/analytics/analytics.component';
import { BadgeComponent } from './shared/badge/badge.component';
import { LeadsComponent } from './control-panel/leads/leads.component';
import { SankeyComponent } from './control-panel/analytics/sankey/sankey.component';

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
  clipboardIcon
);

// Canada locale, so that yyyy-mm-dd format is used by Clarity
registerLocaleData(localeEnCa);

@NgModule({
  declarations: [
    AppComponent,
    ApplicationsComponent,
    RoutesComponent,
    LoginComponent,
    RegisterComponent,
    HeaderComponent,
    ApplicationsComponent,
    GroupsComponent,
    StepsComponent,
    JobModalComponent,
    TimelineModalComponent,
    HomeComponent,
    JobNavComponent,
    AnalyticsComponent,
    BadgeComponent,
    LeadsComponent,
    SankeyComponent,
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
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}
