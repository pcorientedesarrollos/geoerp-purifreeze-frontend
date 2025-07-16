import { TestBed } from '@angular/core/testing';

import { GeoUnidadTransportesService } from './geo-unidad-transportes.service';

describe('GeoUnidadTransportesService', () => {
  let service: GeoUnidadTransportesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GeoUnidadTransportesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
