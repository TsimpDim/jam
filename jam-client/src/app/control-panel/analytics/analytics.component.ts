import { Component, OnInit } from '@angular/core';
import { JamService } from 'src/app/_services/jam.service';

interface Analytics {
  totalJobApps: number,
  completedJobApps: number,
  pendingJobApps: number,
  stepBreakdown: Record<string, {count: number, color: string}>
  stepsPerApp: number,
  timeBetweenSteps: Record<string, {years: number, months: number, days: number, hours: number}>,
  nonRelevantDates: number,
  appliedThrough: Record<string, string>,
  timeToCompletion: Record<string, {years: number, months: number, days: number, hours: number}>,
}


@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss']
})
export class AnalyticsComponent implements OnInit {
  loading = false;
  analytics: Analytics = {} as Analytics;

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
