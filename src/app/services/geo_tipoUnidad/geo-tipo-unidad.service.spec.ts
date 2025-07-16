import { TestBed } from '@angular/core/testing';

import { GeoTipoUnidadService } from './geo-tipo-unidad.service';

describe('GeoTipoUnidadService', () => {
  let service: GeoTipoUnidadService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GeoTipoUnidadService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
