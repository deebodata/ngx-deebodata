import { Service } from '@angular/core';
import { CustomSort } from '../interfaces/custom-sort';

@Service()
export class CustomSortService {

    public customSort: CustomSort = { asc: {}, desc: {} };

    public setCustomSort(sort: CustomSort) {
        this.customSort = {...sort};
    }
  
}
