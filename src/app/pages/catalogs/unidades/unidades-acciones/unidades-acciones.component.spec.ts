import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnidadesAccionesComponent } from './unidades-acciones.component';

describe('UnidadesAccionesComponent', () => {
  let component: UnidadesAccionesComponent;
  let fixture: ComponentFixture<UnidadesAccionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnidadesAccionesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnidadesAccionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
