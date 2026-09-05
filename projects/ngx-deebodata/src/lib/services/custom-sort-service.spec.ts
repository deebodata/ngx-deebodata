import { TestBed } from '@angular/core/testing';

import { CustomSortService } from './custom-sort-service';

describe('CustomSortService', () => {
  let service: CustomSortService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CustomSortService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
