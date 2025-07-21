import { TestBed } from '@angular/core/testing';

import { GeoClientesDireccionService } from './geo-clientes-direccion.service';

describe('GeoClientesDireccionService', () => {
  let service: GeoClientesDireccionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GeoClientesDireccionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
