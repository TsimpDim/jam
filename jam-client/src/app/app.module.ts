import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ClarityModule } from '@clr/angular';
import { AppComponent } from './app.component';
import { FormsModule, ReactiveFormsModule  } from '@angular/forms';

import '@cds/core/icon/register.js';
import { ClarityIcons, sadFaceIcon, cogIcon } from '@cds/core/icon';
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

ClarityIcons.addIcons(sadFaceIcon, cogIcon);

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
    JobModalComponent
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
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
