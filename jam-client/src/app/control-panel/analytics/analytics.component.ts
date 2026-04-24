import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { JamService } from 'src/app/_services/jam.service';
import {
  Chart,
  BarController,
  LineController,
  PieController,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Analytics, Group } from 'src/app/interfaces';

// Register Chart.js components
Chart.register(
  BarController,
  LineController,
  PieController,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.scss'],
})
export class AnalyticsComponent implements OnInit, AfterViewInit, OnDestroy {
  loading = false;
  hasData = false;
  analytics: Analytics = {} as Analytics;
  groups: Group[] = [];
  selectedGroup: string = 'all';

  // Chart instances
  sourcePieChart: any = null;
  trendLineChart: any = null;
  stageBarChart: any = null;

  // Timeout reference for chart updates
  private chartUpdateTimeout: any = null;

  // Trend chart toggle
  trendView: 'weekly' | 'monthly' = 'monthly';

  @ViewChild('sourceChartCanvas') sourceChartCanvas:
    | ElementRef<HTMLCanvasElement>
    | undefined;
  @ViewChild('trendChartCanvas') trendChartCanvas:
    | ElementRef<HTMLCanvasElement>
    | undefined;
  @ViewChild('stageChartCanvas') stageChartCanvas:
    | ElementRef<HTMLCanvasElement>
    | undefined;
  constructor(private jamService: JamService) {}

  ngOnInit(): void {
    this.loadGroups();
    this.getAnalytics();
  }

  ngAfterViewInit(): void {
    this.initCharts();
  }

  ngOnDestroy(): void {
    if (this.chartUpdateTimeout) {
      clearTimeout(this.chartUpdateTimeout);
      this.chartUpdateTimeout = null;
    }
    this.destroyCharts();
  }

  loadGroups(): void {
    this.jamService.getGroups().subscribe({
      next: (data: any) => {
        this.groups = data;
      },
      error: (error) => {
        console.error('Error loading groups:', error);
      },
    });
  }

  onGroupChange(): void {
    this.getAnalytics();
  }

  getAnalytics(): void {
    this.loading = true;
    this.jamService.getAnalytics(this.selectedGroup).subscribe({
      next: (data: any) => {
        this.loading = false;
        this.hasData = true;
        this.analytics = data;
        this.updateCharts();
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading analytics:', error);
      },
    });
  }

  private destroyCharts(): void {
    if (this.sourcePieChart) {
      this.sourcePieChart.destroy();
      this.sourcePieChart = null;
    }
    if (this.trendLineChart) {
      this.trendLineChart.destroy();
      this.trendLineChart = null;
    }
    if (this.stageBarChart) {
      this.stageBarChart.destroy();
      this.stageBarChart = null;
    }
  }

  private initCharts(): void {
    this.updateCharts();
  }

  private updateCharts(): void {
    // Clear any pending update to avoid updates on destroyed component
    if (this.chartUpdateTimeout) {
      clearTimeout(this.chartUpdateTimeout);
    }
    // Small delay to ensure view is initialized
    this.chartUpdateTimeout = setTimeout(() => {
      this.updateSourcePieChart();
      this.updateTrendLineChart();
      this.updateStageBarChart();
      this.chartUpdateTimeout = null;
    }, 100);
  }

  private updateSourcePieChart(): void {
    if (this.sourcePieChart) {
      this.sourcePieChart.destroy();
      this.sourcePieChart = null;
    }

    if (
      !this.sourceChartCanvas?.nativeElement ||
      !this.analytics.appliedThrough
    ) {
      return;
    }

    const sources = this.analytics.appliedThrough;
    const labels = Object.keys(sources).filter((k) => k !== 'empty');
    const data = labels.map((l) => sources[l]);

    // Add 'Empty' if exists
    if (sources['empty']) {
      labels.push('Not specified');
      data.push(sources['empty']);
    }

    const colors = [
      '#4285F4',
      '#EA4335',
      '#FBBC05',
      '#34A853',
      '#FF6D01',
      '#46BDC6',
      '#7B1FA2',
      '#C2185B',
    ];

    this.sourcePieChart = new Chart(this.sourceChartCanvas.nativeElement, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: labels.map((_, i) => colors[i % colors.length]),
            borderWidth: 2,
            borderColor: '#fff',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 15, font: { size: 12 } },
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const label = context.label || '';
                const value = context.raw as number;
                const total = (context.dataset.data as number[]).reduce(
                  (a, b) => a + b,
                  0
                );
                const percentage =
                  total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                return `${label}: ${value} (${percentage}%)`;
              },
            },
          },
        },
      },
    });
  }

  onTrendViewChange(): void {
    this.updateTrendLineChart();
  }

  private updateTrendLineChart(): void {
    if (!this.trendChartCanvas?.nativeElement || !this.analytics.timeTrends) {
      return;
    }

    // Destroy existing chart before creating new one
    if (this.trendLineChart) {
      this.trendLineChart.destroy();
      this.trendLineChart = null;
    }

    const monthly = this.analytics.timeTrends.monthly || [];
    const weekly = this.analytics.timeTrends.weekly || [];

    let labels: string[];
    let data: number[];
    let label: string;

    if (this.trendView === 'monthly') {
      const monthlyReversed = [...monthly].reverse();
      labels = monthlyReversed.map((m) => m.period);
      data = monthlyReversed.map((m) => m.count);
      label = 'Monthly Applications';
    } else {
      const weeklyReversed = [...weekly].reverse();
      labels = weeklyReversed.map((w) => w.period);
      data = weeklyReversed.map((w) => w.count);
      label = 'Weekly Applications';
    }

    this.trendLineChart = new Chart(this.trendChartCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: label,
            data: data,
            borderColor: this.trendView === 'monthly' ? '#4285F4' : '#34A853',
            backgroundColor:
              this.trendView === 'monthly'
                ? 'rgba(66, 133, 244, 0.1)'
                : 'rgba(52, 168, 83, 0.1)',
            tension: 0.3,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { stepSize: 1 },
            title: { display: true, text: 'Applications' },
          },
        },
        plugins: {
          legend: { position: 'bottom' },
        },
      },
    });
  }

  private updateStageBarChart(): void {
    if (
      !this.stageChartCanvas?.nativeElement ||
      !this.analytics.stageDuration
    ) {
      return;
    }

    // Destroy existing chart before creating new one
    if (this.stageBarChart) {
      this.stageBarChart.destroy();
      this.stageBarChart = null;
    }

    const stages = this.analytics.stageDuration;
    const labels = Object.keys(stages);
    const data = labels.map((l) => parseFloat(stages[l].avg_days));
    const colors = labels.map((l) => stages[l].color);

    this.stageBarChart = new Chart(this.stageChartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Avg Days',
            data: data,
            backgroundColor: colors,
            borderRadius: 4,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            beginAtZero: true,
            title: { display: true, text: 'Days' },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => {
                const x = context.parsed.x ?? 0;
                return `${x.toFixed(1)} days`;
              },
            },
          },
        },
      },
    });
  }

  parseFloat(value: string): number {
    return parseFloat(value);
  }
}
