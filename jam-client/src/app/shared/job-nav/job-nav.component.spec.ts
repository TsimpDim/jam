import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JobNavComponent } from './job-nav.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { JamService } from 'src/app/core/api/jam.service';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { of, throwError } from 'rxjs';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

describe('JobNavComponent', () => {
  let component: JobNavComponent;
  let fixture: ComponentFixture<JobNavComponent>;
  let jamServiceSpy: jasmine.SpyObj<JamService>;
  let storageGetSpy: jasmine.Spy;
  let storageSetSpy: jasmine.Spy;

  const mockApplications = {
    'Tech': [
      { id: 1, company: 'Google', role: 'Engineer' },
      { id: 2, company: 'Apple', role: 'Designer' },
    ],
    'Health': [
      { id: 3, company: 'Pfizer', role: 'Scientist' },
    ],
  };

  const mockGroups = [
    { id: 1, name: 'Tech', description: 'Tech group', position: 0 },
    { id: 2, name: 'Health', description: 'Health group', position: 1 },
  ];

  beforeEach(async () => {
    storageGetSpy = spyOn(localStorage, 'getItem');
    storageGetSpy.and.returnValue(null);
    storageSetSpy = spyOn(localStorage, 'setItem');

    jamServiceSpy = jasmine.createSpyObj('JamService', [
      'getGroups', 'reorderGroups',
    ]);
    jamServiceSpy.getGroups.and.returnValue(of(mockGroups));
    jamServiceSpy.reorderGroups.and.returnValue(of({ status: 'ok' }));

    await TestBed.configureTestingModule({
      imports: [JobNavComponent],
      providers: [
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: JamService, useValue: jamServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(JobNavComponent);
    component = fixture.componentInstance;
    component.applications = mockApplications;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should load groups on init', () => {
      expect(jamServiceSpy.getGroups).toHaveBeenCalled();
    });

    it('should set default sort to -id', () => {
      expect(component.sortBy).toBe('-id');
    });

    it('should save default sort to localStorage', () => {
      expect(storageSetSpy).toHaveBeenCalledWith('jam_job_nav_sort', '-id');
    });

    it('should load saved sort from localStorage', () => {
      storageGetSpy.and.callFake((key: string) => {
        if (key === 'jam_job_nav_sort') return 'id';
        return null;
      });
      fixture = TestBed.createComponent(JobNavComponent);
      component = fixture.componentInstance;
      component.applications = mockApplications;
      fixture.detectChanges();
      expect(component.sortBy).toBe('id');
    });

    it('should migrate old "date" sort', () => {
      storageGetSpy.and.callFake((key: string) => {
        if (key === 'jam_job_nav_sort') return 'date';
        return null;
      });
      fixture = TestBed.createComponent(JobNavComponent);
      component = fixture.componentInstance;
      component.applications = mockApplications;
      fixture.detectChanges();
      expect(component.sortBy).toBe('-id');
    });
  });

  describe('search', () => {
    it('should filter groups by company name', () => {
      component.onSearchKeyup({ target: { value: 'Google' } } as any);
      expect(component.filteredGroups.length).toBe(1);
      expect(component.filteredGroups[0].name).toBe('Tech');
      expect(component.filteredGroups[0].apps.length).toBe(1);
    });

    it('should filter groups by role name', () => {
      component.onSearchKeyup({ target: { value: 'Designer' } } as any);
      expect(component.filteredGroups.length).toBe(1);
    });

    it('should show all groups when search is empty', () => {
      component.onSearchKeyup({ target: { value: '' } } as any);
      expect(component.filteredGroups.length).toBe(2);
    });

    it('should hide groups with no matching apps', () => {
      component.onSearchKeyup({ target: { value: 'Google' } } as any);
      expect(component.filteredGroups.length).toBe(1);
    });

    it('should clear search', () => {
      component.searchQuery = 'Google';
      component.clearSearch();
      expect(component.searchQuery).toBe('');
      expect(component.filteredGroups.length).toBe(2);
    });
  });

  describe('sort', () => {
    it('should update sortBy and emit', () => {
      spyOn(component.onSortChange, 'emit');
      component.handleSortChange({ target: { value: 'id' } } as any);
      expect(component.sortBy).toBe('id');
      expect(component.onSortChange.emit).toHaveBeenCalledWith('id');
    });

    it('should save sort to localStorage', () => {
      component.handleSortChange({ target: { value: 'id' } } as any);
      expect(storageSetSpy).toHaveBeenCalledWith('jam_job_nav_sort', 'id');
    });
  });

  describe('group expand/collapse', () => {
    it('should start with no group expanded', () => {
      expect(component.expandedGroupName).toBeNull();
    });

    it('should expand a group on toggle', () => {
      component.toggleNavState(new Event('click'), 'Tech');
      expect(component.expandedGroupName).toBe('Tech');
    });

    it('should collapse the same group if clicked again', () => {
      component.toggleNavState(new Event('click'), 'Tech');
      component.toggleNavState(new Event('click'), 'Tech');
      expect(component.expandedGroupName).toBeNull();
    });

    it('should save expanded state to localStorage', () => {
      component.toggleNavState(new Event('click'), 'Health');
      expect(storageSetSpy).toHaveBeenCalledWith('jam_last_opened_group', 'Health');
    });

    it('should load saved expanded group from localStorage', () => {
      storageGetSpy.and.callFake((key: string) => {
        if (key === 'jam_last_opened_group') return 'Tech';
        return null;
      });
      const savedComponent = TestBed.createComponent(JobNavComponent).componentInstance;
      savedComponent.applications = mockApplications;
      savedComponent.ngOnInit();
      expect(savedComponent.expandedGroupName).toBe('Tech');
    });
  });

  describe('group reorder (drag and drop)', () => {
    it('should reorder groups on drop', () => {
      component.groups = [...mockGroups];
      const event = {
        previousIndex: 0,
        currentIndex: 1,
        item: {} as any,
        container: {} as any,
        previousContainer: {} as any,
        isPointerOverContainer: true,
        distance: { x: 0, y: 0 },
        dropPoint: { x: 0, y: 0 },
      } as CdkDragDrop<any[]>;

      component.dropGroup(event);
      expect(component.groups[0].id).toBe(2);
      expect(component.groups[1].id).toBe(1);
      expect(component.expandedGroupName).toBe('Tech');
    });

    it('should expand the moved group if it was previously expanded', () => {
      component.groups = [...mockGroups];
      component.expandedGroupName = 'Tech';
      const event = {
        previousIndex: 0,
        currentIndex: 1,
        item: {} as any,
        container: {} as any,
        previousContainer: {} as any,
        isPointerOverContainer: true,
        distance: { x: 0, y: 0 },
        dropPoint: { x: 0, y: 0 },
      } as CdkDragDrop<any[]>;

      component.dropGroup(event);
      expect(component.groups[0].id).toBe(2);
      expect(component.groups[1].id).toBe(1);
      expect(component.expandedGroupName).toBe('Tech');
    });

    it('should call reorderGroups on drop', () => {
      component.groups = [...mockGroups];
      const event = {
        previousIndex: 0,
        currentIndex: 1,
        item: {} as any,
        container: {} as any,
        previousContainer: {} as any,
        isPointerOverContainer: true,
        distance: { x: 0, y: 0 },
        dropPoint: { x: 0, y: 0 },
      } as CdkDragDrop<any[]>;

      component.dropGroup(event);
      expect(jamServiceSpy.reorderGroups).toHaveBeenCalledWith([
        { id: 2, position: 0 },
        { id: 1, position: 1 },
      ]);
    });

    it('should revert groups on reorder error', () => {
      component.groups = [...mockGroups];
      jamServiceSpy.reorderGroups.and.returnValue(throwError(() => new Error('fail')));
      const event = {
        previousIndex: 0,
        currentIndex: 1,
        item: {} as any,
        container: {} as any,
        previousContainer: {} as any,
        isPointerOverContainer: true,
        distance: { x: 0, y: 0 },
        dropPoint: { x: 0, y: 0 },
      } as CdkDragDrop<any[]>;

      component.dropGroup(event);
      expect(jamServiceSpy.getGroups).toHaveBeenCalledTimes(2);
    });
  });

  describe('nav width', () => {
    it('should initialize nav width from localStorage', () => {
      storageGetSpy.and.callFake((key: string) => {
        if (key === 'jam_job_nav_width') return '300';
        return null;
      });
      component.initNavWidth();
      expect(component.navWidth).toBe(300);
    });

    it('should use default width when no saved width', () => {
      expect(component.navWidth).toBe(280);
    });

    it('should save width on mouse up after drag', () => {
      component.navWidth = 350;
      component.isDragging = true;
      component.onDragHandleMouseUp();
      expect(storageSetSpy).toHaveBeenCalledWith('jam_job_nav_width', '350');
    });

    it('should not save width if not dragging', () => {
      component.isDragging = false;
      component.onDragHandleMouseUp();
      expect(storageSetSpy).not.toHaveBeenCalledWith('jam_job_nav_width', jasmine.any(String));
    });
  });

  describe('effectiveWidth', () => {
    it('should return navWidth when not collapsed', () => {
      component.navCollapsed = false;
      component.navWidth = 300;
      expect(component.effectiveWidth).toBe(300);
    });

    it('should return collapsed width when collapsed', () => {
      component.navCollapsed = true;
      expect(component.effectiveWidth).toBe(48);
    });
  });

  describe('group management', () => {
    it('selectGroup should set selectedGroup and open modal', () => {
      component.groups = mockGroups;
      component.selectGroup(1);
      expect(component.selectedGroup).toEqual(mockGroups[0]);
      expect(component.groupModalIsOpen).toBeTrue();
    });

    it('clearAndOpenGroupModal should reset selectedGroup and open modal', () => {
      component.groups = mockGroups;
      component.selectedGroup = mockGroups[0];
      component.clearAndOpenGroupModal();
      expect(component.selectedGroup).toBeNull();
      expect(component.groupModalIsOpen).toBeTrue();
    });

    it('onGroupModalClose should close modal and clear selection', () => {
      component.groupModalIsOpen = true;
      component.selectedGroup = mockGroups[0];
      component.onGroupModalClose();
      expect(component.groupModalIsOpen).toBeFalse();
      expect(component.selectedGroup).toBeNull();
    });

    it('getGroupId should return correct id', () => {
      component.groups = mockGroups;
      expect(component.getGroupId('Tech')).toBe(1);
      expect(component.getGroupId('Nonexistent')).toBeNull();
    });
  });

  describe('rebuildFilteredGroups', () => {
    it('should return empty array when no applications', () => {
      component.applications = null;
      component.rebuildFilteredGroups();
      expect(component.filteredGroups).toEqual([]);
    });
  });
});
