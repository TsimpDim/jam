import { Injectable } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { JamService } from '../api/jam.service';
import { ExperienceLevel, Industry, Role, City, Country } from '../../interfaces';

@Injectable({
  providedIn: 'root',
})
export class ReferenceDataService {
  private industries$?: Observable<Industry[]>;
  private experienceLevels$?: Observable<ExperienceLevel[]>;
  private roles$?: Observable<Role[]>;
  private countries$?: Observable<Country[]>;
  private cities$?: Observable<City[]>;

  constructor(private jamService: JamService) {}

  getIndustries(): Observable<Industry[]> {
    if (!this.industries$) {
      this.industries$ = this.jamService.getIndustries().pipe(shareReplay(1));
    }
    return this.industries$;
  }

  getExperienceLevels(): Observable<ExperienceLevel[]> {
    if (!this.experienceLevels$) {
      this.experienceLevels$ = this.jamService
        .getExperienceLevels()
        .pipe(shareReplay(1));
    }
    return this.experienceLevels$;
  }

  getRoles(): Observable<Role[]> {
    if (!this.roles$) {
      this.roles$ = this.jamService.getRoles().pipe(shareReplay(1));
    }
    return this.roles$;
  }

  searchRoles(term: string): Observable<Role[]> {
    if (!term || term.length < 2) {
      return this.getRoles();
    }
    return this.jamService.getRoles(term);
  }

  getCountries(): Observable<Country[]> {
    if (!this.countries$) {
      this.countries$ = this.jamService.getCountries().pipe(shareReplay(1));
    }
    return this.countries$;
  }

  getCities(): Observable<City[]> {
    if (!this.cities$) {
      this.cities$ = this.jamService.getCities().pipe(shareReplay(1));
    }
    return this.cities$;
  }

  clearCache(): void {
    this.industries$ = undefined;
    this.experienceLevels$ = undefined;
    this.roles$ = undefined;
    this.countries$ = undefined;
    this.cities$ = undefined;
  }
}
