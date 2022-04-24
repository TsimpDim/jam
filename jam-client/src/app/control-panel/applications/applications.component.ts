import { Component, OnInit } from '@angular/core';
import { JamService } from 'src/app/_services/jam.service';

@Component({
  selector: 'app-applications',
  templateUrl: './applications.component.html',
  styleUrls: ['./applications.component.scss']
})
export class ApplicationsComponent implements OnInit {
  public applications: any;
  public loading: Boolean = true;
  public selectedApp: any = null;

  constructor(
    private jamService: JamService
  ) { }

  ngOnInit(): void {
    this.jamService.getJobApplications(true)
    .subscribe({
      next: (data) => {
        this.loading = false;
        this.applications = data;
      },
      error: (error) => {
        this.loading = true;
      },
      complete: () => this.loading = true
    })
  }

  selectApp(groupName:any, jobAppId: any) {
    let appsOfGroup = this.applications[groupName];
    let selectedJobApp = appsOfGroup.find((app: any) => app.id == jobAppId);
    this.selectedApp = selectedJobApp;
    console.log(this.selectedApp);
  }
}
