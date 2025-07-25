import { TestBed } from '@angular/core/testing';

import { GeoRecorridoService } from './geo-recorrido.service';

describe('GeoRecorridoService', () => {
  let service: GeoRecorridoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GeoRecorridoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
