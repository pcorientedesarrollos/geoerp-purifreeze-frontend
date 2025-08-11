import { TestBed } from '@angular/core/testing';

import { GeoServiciosService } from './geo-servicios.service';

describe('GeoServiciosService', () => {
  let service: GeoServiciosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GeoServiciosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
