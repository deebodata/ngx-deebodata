import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgxDeebodata } from './ngx-deebodata';

describe('NgxDeebodata', () => {
  let component: NgxDeebodata;
  let fixture: ComponentFixture<NgxDeebodata>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NgxDeebodata]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NgxDeebodata);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
