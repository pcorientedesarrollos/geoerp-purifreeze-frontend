import { TestBed } from '@angular/core/testing';

import { GeoRutasDetallesService } from './geo-rutas-detalles.service';

describe('GeoRutasDetallesService', () => {
  let service: GeoRutasDetallesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GeoRutasDetallesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
