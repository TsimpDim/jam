import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { SpecialService } from './special.service';

describe('SpecialService', () => {
  let service: SpecialService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(withInterceptorsFromDi())],
    });
    service = TestBed.inject(SpecialService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
