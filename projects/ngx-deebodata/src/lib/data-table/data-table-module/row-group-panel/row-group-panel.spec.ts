import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RowGroupPanel } from './row-group-panel';

describe('RowGroupPanel', () => {
  let component: RowGroupPanel;
  let fixture: ComponentFixture<RowGroupPanel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RowGroupPanel]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RowGroupPanel);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
