import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgregarServicioModalComponent } from './agregar-servicio-modal.component';

describe('AgregarServicioModalComponent', () => {
  let component: AgregarServicioModalComponent;
  let fixture: ComponentFixture<AgregarServicioModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgregarServicioModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgregarServicioModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
