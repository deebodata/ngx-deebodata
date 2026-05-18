import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RowGroupMenu } from './row-group-menu';

describe('RowGroupMenu', () => {
  let component: RowGroupMenu;
  let fixture: ComponentFixture<RowGroupMenu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RowGroupMenu]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RowGroupMenu);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
