import { Component, OnInit } from '@angular/core';
import { JamService } from 'src/app/_services/jam.service';

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss']
})
export class AnalyticsComponent implements OnInit {
  loading = false;
  analytics: any = undefined;

  constructor (
    private jamService: JamService
  ) {}

  ngOnInit(): void {
    this.getAnalytics();
  }

  getAnalytics() {
    this.loading = true;
    this.jamService.getAnalytics()
    .subscribe({
      next: (data: any) => {
        this.loading = false;
        this.analytics = data;
      },
      error: (error) => {
      }
    })
  }
}
