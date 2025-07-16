import { TestBed } from '@angular/core/testing';

import { GeoClientesService } from './geo-clientes.service';

describe('GeoClientesService', () => {
  let service: GeoClientesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GeoClientesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
