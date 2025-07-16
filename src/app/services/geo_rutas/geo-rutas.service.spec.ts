import { TestBed } from '@angular/core/testing';

import { GeoRutasService } from './geo-rutas.service';

describe('GeoRutasService', () => {
  let service: GeoRutasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GeoRutasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
