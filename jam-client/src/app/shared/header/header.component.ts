import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/_services/auth.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss', '../shared.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  public isLoggedIn: Boolean | null = null;
  routerSubscription: Subscription | undefined;

  constructor(private authService: AuthService, private router: Router) {}
  ngAfterViewInit(): void {
    this.routerSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.checkIsLoggedIn();
      }
    });
  }

  ngOnDestroy(): void {
    this.routerSubscription?.unsubscribe();
  }

  ngOnInit(): void {
    this.checkIsLoggedIn();
  }

  checkIsLoggedIn() {
    this.isLoggedIn = this.authService.getSessionToken() ? true : false;
  }

  logout() {
    this.authService.logout();
  }
}
