import { TestBed } from '@angular/core/testing';

import { GeoUsuariosService } from './geo-usuarios.service';

describe('GeoUsuariosService', () => {
  let service: GeoUsuariosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GeoUsuariosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
