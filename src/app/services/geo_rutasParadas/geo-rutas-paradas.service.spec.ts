import { TestBed } from '@angular/core/testing';

import { GeoRutasParadasService } from './geo-rutas-paradas.service';

describe('GeoRutasParadasService', () => {
  let service: GeoRutasParadasService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GeoRutasParadasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
