import { TestBed } from '@angular/core/testing';

import { GeoStatusService } from './geo-status.service';

describe('GeoStatusService', () => {
  let service: GeoStatusService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GeoStatusService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
