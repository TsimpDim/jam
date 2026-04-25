import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from '../auth/login/login.component';
import { RegisterComponent } from '../auth/register/register.component';
import { AnalyticsComponent } from '../control-panel/analytics/analytics.component';
import { ApplicationsComponent } from '../control-panel/applications/applications.component';
import { GroupsComponent } from '../control-panel/groups/groups.component';
import { LeadsComponent } from '../control-panel/leads/leads.component';
import { StepsComponent } from '../control-panel/steps/steps.component';
import { HomeComponent } from '../home/home.component';
import { AuthGuard, NoAuthGuard } from '../_services/auth.guard';

const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'control-panel/applications',
    component: ApplicationsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'control-panel/groups',
    component: GroupsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'control-panel/steps',
    component: StepsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'control-panel/analytics',
    component: AnalyticsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'control-panel/leads',
    component: LeadsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'auth/login',
    component: LoginComponent,
    canActivate: [NoAuthGuard],
  },
  {
    path: 'auth/register',
    component: RegisterComponent,
    canActivate: [NoAuthGuard],
  },
  { path: '**', component: ApplicationsComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
