import { Component, Input, OnInit } from '@angular/core';
import { AuthService } from 'src/app/_services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss', '../shared.scss']
})
export class HeaderComponent implements OnInit {
  public isLoggedIn: Boolean | null = null;
  @Input() showSubMenu: boolean = true;
  
  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.isLoggedIn = this.authService.getSessionToken() ? true : false;
  }

  logout() {
    this.authService.logout();
  }
}
