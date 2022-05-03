import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router'; // CLI imports router
import { CLR_VERTICAL_NAV_DIRECTIVES } from '@clr/angular';
import { AppComponent } from '../app.component';
import { LoginComponent } from '../auth/login/login.component';
import { RegisterComponent } from '../auth/register/register.component';
import { ApplicationsComponent } from '../control-panel/applications/applications.component';
import { GroupsComponent } from '../control-panel/groups/groups.component';
import { StepsComponent } from '../control-panel/steps/steps.component';
import { AuthGuardService as AuthGuard } from '../_services/auth-guard.service';
import { LoggedInGuardService as LoggedInGuard } from '../_services/logged-in-guard.service';


const routes: Routes = [
  { path: '', component: AppComponent},
  { 
    path: 'control-panel/applications',
    component: ApplicationsComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'control-panel/groups',
    component: GroupsComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'control-panel/steps',
    component: StepsComponent,
    canActivate: [AuthGuard]
  },
  {
    path: 'auth/login',
    component: LoginComponent,
    canActivate: [LoggedInGuard]
  },
  {
    path: 'auth/register',
    component: RegisterComponent,
    canActivate: [LoggedInGuard]
  },
  { path: '**', component: ApplicationsComponent },  // Wildcard route for a 404 page
];

// configures NgModule imports and exports
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }