import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartsAndGraphs } from './charts-and-graphs';

describe('ChartsAndGraphs', () => {
  let component: ChartsAndGraphs;
  let fixture: ComponentFixture<ChartsAndGraphs>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChartsAndGraphs]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChartsAndGraphs);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
