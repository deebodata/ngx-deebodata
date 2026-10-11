import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RealPaginator } from './real-paginator';

describe('RealPaginator', () => {
  let component: RealPaginator;
  let fixture: ComponentFixture<RealPaginator>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RealPaginator]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RealPaginator);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
