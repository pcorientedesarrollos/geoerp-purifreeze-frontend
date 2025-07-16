import { TestBed } from '@angular/core/testing';

import { GeoTipoServicioService } from './geo-tipo-servicio.service';

describe('GeoTipoServicioService', () => {
  let service: GeoTipoServicioService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GeoTipoServicioService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
