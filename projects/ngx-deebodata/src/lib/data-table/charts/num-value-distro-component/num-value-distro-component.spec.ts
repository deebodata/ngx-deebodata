import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NumValueDistroComponent } from './num-value-distro-component';

describe('NumValueDistroComponent', () => {
  let component: NumValueDistroComponent;
  let fixture: ComponentFixture<NumValueDistroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NumValueDistroComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NumValueDistroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
