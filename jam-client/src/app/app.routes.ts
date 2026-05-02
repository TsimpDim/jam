import { Routes } from '@angular/router';
import { LoginComponent } from './pages/auth/login/login.component';
import { RegisterComponent } from './pages/auth/register/register.component';
import { ForgotPasswordComponent } from './pages/auth/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './pages/auth/reset-password/reset-password.component';
import { AnalyticsComponent } from './pages/analytics/analytics.component';
import { ApplicationsComponent } from './pages/applications/applications.component';
import { LeadsComponent } from './pages/leads/leads.component';
import { StepsComponent } from './pages/steps/steps.component';
import { CvComponent } from './pages/cv/cv.component';
import { AuthGuard, NoAuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'applications',
    pathMatch: 'full',
  },
  {
    path: 'applications',
    component: ApplicationsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'steps',
    component: StepsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'analytics',
    component: AnalyticsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'leads',
    component: LeadsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'cv',
    component: CvComponent,
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
  {
    path: 'auth/forgot-password',
    component: ForgotPasswordComponent,
    canActivate: [NoAuthGuard],
  },
  {
    path: 'auth/reset-password/:uid/:token',
    component: ResetPasswordComponent,
    canActivate: [NoAuthGuard],
  },
  { path: '**', component: ApplicationsComponent },
];
