import { TestBed } from '@angular/core/testing';
import { GeoRutasDetalleService } from './geo-rutas-detalles.service';


describe('GeoRutasDetallesService', () => {
  let service: GeoRutasDetalleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GeoRutasDetalleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
