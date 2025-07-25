import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GeoRecorridoComponent } from './geo-recorrido.component';

describe('GeoRecorridoComponent', () => {
  let component: GeoRecorridoComponent;
  let fixture: ComponentFixture<GeoRecorridoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GeoRecorridoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GeoRecorridoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
