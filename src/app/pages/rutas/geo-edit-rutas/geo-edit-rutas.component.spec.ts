import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeoEditRutasComponent } from './geo-edit-rutas.component';

describe('GeoEditRutasComponent', () => {
  let component: GeoEditRutasComponent;
  let fixture: ComponentFixture<GeoEditRutasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GeoEditRutasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeoEditRutasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
