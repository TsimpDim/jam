import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router'; // CLI imports router
import { AppComponent } from '../app.component';
import { LoginComponent } from '../auth/login/login.component';
import { RegisterComponent } from '../auth/register/register.component';
import { ApplicationsComponent } from '../control-panel/applications/applications.component';

const routes: Routes = [
  { path: '', component: AppComponent},
  { path: 'control-panel/applications', component: ApplicationsComponent},
  { path: 'auth/login', component: LoginComponent},
  { path: 'auth/register', component: RegisterComponent},
  { path: '**', component: ApplicationsComponent },  // Wildcard route for a 404 page
];

// configures NgModule imports and exports
@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }