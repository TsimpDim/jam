import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ClarityModule } from '@clr/angular';
import { AppComponent } from './app.component';
import { FormsModule, ReactiveFormsModule  } from '@angular/forms';

import '@cds/core/icon/register.js';
import { ClarityIcons, sadFaceIcon, cogIcon } from '@cds/core/icon';
import { AppRoutingModule } from './routes/routes.module';
import { ControlPanelComponent } from './control-panel/control-panel.component';
import { RoutesComponent } from './routes/routes.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { HeaderComponent } from './shared/header/header.component';
import { HttpClientModule } from '@angular/common/http';

ClarityIcons.addIcons(sadFaceIcon, cogIcon);

@NgModule({
  declarations: [
    AppComponent,
    ControlPanelComponent,
    RoutesComponent,
    LoginComponent,
    RegisterComponent,
    HeaderComponent
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
