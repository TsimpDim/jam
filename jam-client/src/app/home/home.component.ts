import { Component, OnInit } from '@angular/core';
import { AuthService } from '../_services/auth.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss', '../shared/shared.scss']
})
export class HomeComponent implements OnInit {

  public isLoggedIn: boolean = false;
  constructor(authService: AuthService) {
    this.isLoggedIn = authService.getSessionToken() !== null;
  }

  ngOnInit(): void {
  }

}
