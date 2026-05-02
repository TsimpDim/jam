import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ClarityModule } from '@clr/angular';
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
import { JamService } from 'src/app/core/api/jam.service';
import { GroupModalComponent } from '../../modals/group-modal/group-modal.component';

const JOB_NAV_WIDTH_STORAGE_KEY = 'jam_job_nav_width';
const JOB_NAV_MIN_WIDTH_PX = 220;
const JOB_NAV_MAX_WIDTH_VW = 30;
const JOB_NAV_DEFAULT_WIDTH_PX = 280;
const JOB_NAV_COLLAPSED_WIDTH_PX = 48;

interface FilteredGroup {
  name: string;
  apps: any[];
}

@Component({
  selector: 'app-job-nav',
  standalone: true,
  imports: [CommonModule, ClarityModule, DragDropModule, GroupModalComponent],
  templateUrl: './job-nav.component.html',
  styleUrls: ['./job-nav.component.scss'],
})
export class JobNavComponent implements OnInit {
  @Input() applications: any = null;
  @Input() loadingApplications: boolean = false;
  @Output() onSelectApp = new EventEmitter();
  @Output() onOpenAndClearJobAppModal = new EventEmitter();
  @Output() onSortChange = new EventEmitter<string>();
  @Output() onGroupsReordered = new EventEmitter<void>();

  // Instance property to track which group is expanded
  expandedGroupName: string | null = null;

  sortBy: string = 'id';
  searchQuery: string = '';
  filteredGroups: FilteredGroup[] = [];
  navCollapsed: boolean = false;

  // Drag resize state
  navWidth: number = JOB_NAV_DEFAULT_WIDTH_PX;
  isDragging: boolean = false;
  private startX: number = 0;
  private startWidth: number = 0;

  // Group management state
  public groups: any[] = [];
  public loadingGroups: boolean = true;
  public groupModalIsOpen: boolean = false;
  public selectedGroup: any = null;

  get effectiveWidth(): number {
    return this.navCollapsed ? JOB_NAV_COLLAPSED_WIDTH_PX : this.navWidth;
  }

  constructor(private jamService: JamService) {}

  ngOnInit() {
    this.initExpandedGroup();
    this.initNavWidth();
    const savedSort = localStorage.getItem('jam_job_nav_sort');
    if (savedSort === 'date') {
      this.sortBy = '-id';
      localStorage.setItem('jam_job_nav_sort', this.sortBy);
    } else if (savedSort) {
      this.sortBy = savedSort;
    } else {
      this.sortBy = '-id';
      localStorage.setItem('jam_job_nav_sort', this.sortBy);
    }
    this.rebuildFilteredGroups();
    this.getGroups();
  }

  // Group management methods
  dropGroup(event: CdkDragDrop<any[]>) {
    // Reorder the groups array immediately (UI updates instantly)
    moveItemInArray(this.groups, event.previousIndex, event.currentIndex);

    // Expand only the dropped group
    const droppedGroup = this.groups[event.currentIndex];
    this.expandedGroupName = droppedGroup.name;

    // Rebuild filteredGroups to reflect new order
    this.rebuildFilteredGroups();

    // Send reorder request to server (optimistic update already done)
    const positions = this.groups.map((g, i) => ({ id: g.id, position: i }));
    this.jamService.reorderGroups(positions).subscribe({
      error: () => {
        this.getGroups();
      }, // Revert on failure
    });
  }

  getGroups() {
    this.loadingGroups = true;
    this.jamService.getGroups().subscribe({
      next: (data) => {
        this.groups = data;
        this.rebuildFilteredGroups();
      },
      error: () => {
        this.loadingGroups = false;
      },
      complete: () => (this.loadingGroups = false),
    });
  }

  clearAndOpenGroupModal() {
    this.selectedGroup = null;
    this.groupModalIsOpen = true;
  }

  selectGroup(groupId: number | null) {
    if (groupId === null) return;
    this.selectedGroup = this.groups.find((g: any) => g.id === groupId);
    this.groupModalIsOpen = true;
  }

  getGroupId(groupName: string): number | null {
    const group = this.groups.find((g: any) => g.name === groupName);
    return group ? group.id : null;
  }

  getGroupDescription(groupName: string): string {
    const group = this.groups.find((g: any) => g.name === groupName);
    return group?.description || '';
  }

  onGroupModalClose() {
    this.groupModalIsOpen = false;
    this.selectedGroup = null;
  }

  initNavWidth() {
    const savedWidth = localStorage.getItem(JOB_NAV_WIDTH_STORAGE_KEY);
    if (savedWidth) {
      const parsed = parseInt(savedWidth, 10);
      const maxWidth = Math.floor(
        (window.innerWidth * JOB_NAV_MAX_WIDTH_VW) / 100
      );
      if (!isNaN(parsed) && parsed >= JOB_NAV_MIN_WIDTH_PX) {
        this.navWidth = Math.min(parsed, maxWidth);
      }
    }
  }

  onDragHandleMouseDown(event: MouseEvent) {
    event.preventDefault();
    this.isDragging = true;
    this.startX = event.clientX;
    this.startWidth = this.navWidth;
  }

  @HostListener('window:mousemove', ['$event'])
  onDragHandleMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;

    const deltaX = event.clientX - this.startX;
    const maxWidth = Math.floor(
      (window.innerWidth * JOB_NAV_MAX_WIDTH_VW) / 100
    );
    let newWidth = this.startWidth + deltaX;

    // Clamp between min and max
    newWidth = Math.max(JOB_NAV_MIN_WIDTH_PX, Math.min(newWidth, maxWidth));

    this.navWidth = newWidth;
  }

  @HostListener('window:mouseup', ['$event'])
  onDragHandleMouseUp() {
    if (this.isDragging) {
      this.isDragging = false;
      localStorage.setItem(JOB_NAV_WIDTH_STORAGE_KEY, this.navWidth.toString());
    }
  }

  // If the job nav is expanded and the user resizes the window
  // make sure that it doesn't exceed the window's width
  @HostListener('window:resize')
  onWindowResize() {
    const maxWidth = Math.floor(
      (window.innerWidth * JOB_NAV_MAX_WIDTH_VW) / 100
    );
    if (this.navWidth > maxWidth) {
      this.navWidth = maxWidth;
      localStorage.setItem(JOB_NAV_WIDTH_STORAGE_KEY, this.navWidth.toString());
    }
  }

  ngOnChanges() {
    this.initExpandedGroup();
    this.rebuildFilteredGroups();
  }

  initExpandedGroup() {
    if (this.applications) {
      const saved = localStorage.getItem('jam_last_opened_group');
      if (saved && saved in this.applications) {
        this.expandedGroupName = saved;
      } else {
        // Don't auto-expand any group initially
        this.expandedGroupName = null;
      }
    }
  }

  rebuildFilteredGroups() {
    if (!this.applications) {
      this.filteredGroups = [];
      return;
    }

    const query = this.searchQuery.toLowerCase();

    this.filteredGroups = this.groups
      .map((group) => {
        const apps = (this.applications[group.name] as any[]) || [];
        const filteredApps = query
          ? apps.filter(
              (app: any) =>
                app.company.toLowerCase().includes(query) ||
                app.role.toLowerCase().includes(query)
            )
          : apps;
        return { name: group.name, apps: filteredApps };
      })
      .filter((group) => group.apps.length > 0);
  }

  onSearchKeyup(event: Event) {
    this.searchQuery = (event.target as HTMLInputElement).value;
    this.rebuildFilteredGroups();
  }

  toggleNavState(event: Event, groupName: string) {
    event.stopPropagation();
    // Toggle: if already expanded, collapse it; otherwise expand this group
    if (this.expandedGroupName === groupName) {
      this.expandedGroupName = null;
    } else {
      this.expandedGroupName = groupName;
    }
    localStorage.setItem('jam_last_opened_group', this.expandedGroupName ?? '');
  }

  isGroupExpanded(groupName: string): boolean {
    return this.expandedGroupName === groupName;
  }

  handleSortChange(value: any) {
    const sortValue = typeof value === 'string' ? value : value.target.value;
    this.sortBy = sortValue;
    localStorage.setItem('jam_job_nav_sort', this.sortBy);
    this.onSortChange.emit(this.sortBy);
  }
}
