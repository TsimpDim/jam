import { LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ClarityModule } from '@clr/angular';
import { AppComponent } from './app.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import localeEnCa from '@angular/common/locales/en-CA';

import '@cds/core/icon/register.js';
import { ClarityIcons,
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
   colorPaletteIcon} from '@cds/core/icon';
import { AppRoutingModule } from './routes/routes.module';
import { RoutesComponent } from './routes/routes.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { HeaderComponent } from './shared/header/header.component';
import { HttpClientModule } from '@angular/common/http';
import { ApplicationsComponent } from './control-panel/applications/applications.component';
import { GroupsComponent } from './control-panel/groups/groups.component';
import { StepsComponent } from './control-panel/steps/steps.component';
import { JobModalComponent } from './control-panel/job-modal/job-modal.component';
import { TimelineModalComponent } from './control-panel/timeline-modal/timeline-modal.component';
import { HomeComponent } from './home/home.component';
import { JobNavComponent } from './control-panel/job-nav/job-nav.component';
import { registerLocaleData } from '@angular/common';

ClarityIcons.addIcons(
  idBadgeIcon,
  cogIcon,
  organizationIcon,
  noteIcon,
  plusIcon,
  calendarIcon,
  mapMarkerIcon,
  blockIcon,
  flagIcon,
  nodeIcon,
  pencilIcon,
  blocksGroupIcon,
  colorPaletteIcon
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
    JobNavComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    ClarityModule,
    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [
    { provide: LOCALE_ID, useValue: 'en-ca' }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
