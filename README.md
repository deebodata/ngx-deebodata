# NgxDeebodata

Angular data grid with virtual scroll or pagination, integrated charts, row grouping, column resizing, column hiding, cell editing, tab accessibility, sorting with priority, and advanced filtering. This package uses only basic @angular packages and rxjs as peer dependencies.   

# Demos  

- 100k rows - https://deebodata.com/angular-data-grid?data=sales 


# Licensing

Install this package and use the full functionality when developing locally at http://localhost:4200

For full functionality beyond http://localhost:4200, please obtain a **deployment license** for each developer on the project from https://deebodata.com/data-grid-checkout/angular  


## Usage

**In the .ts component you want to use the data grid in**

```
import { Component, signal } from '@angular/core';
import { NgxDeebodata } from 'ngx-deebodata';

@Component({
  selector: 'app-root',
  imports: [ NgxDeebodata ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})

export class App {

  sampleData = signal<any[]>([ { name: "Dave", salary: 200000, title: "CEO" }, {name: "Amy", salary: 164000, title: "CIO" }, 
                {name: "Ted", salary: 60000, title: "QA Engineer" }, {name: "Sarah", salary: 95000, title: "Engineer" }, 
                {name: "Adam", salary: 164000, title: "CFO" }, {name: "Krishna", salary: 105000, title: "Architect" }]) 

}
```

**In the template of the component**

```
<ngx-deebodata
[editable]="true"
[paginate]="false"
[rowNumbers]="true"
[data]="sampleData()"
[color1]="'navy'"
[color2]="'lightblue'"
[primaryKey]="'employee_id'"
[defRowHgt]="'50px'"
[defGridHgt]="500"
[licenseKey]="licenseKey"
[pieGraphColors]="['red', 'blue', 'lightgray', 'orange', 'green']"
[removePieCovers]="false"
[altRowColor]="'#ececec'"
[myColumnStyles]="[]"
[myColumnValueColors]="[]"
[forceGrouping]="['column_needs_grouping']"
></ngx-deebodata>
```

**Component Input API**

| Input | Type | Default | Description
|----------|----------|----------|----------|
| `editable` | `boolean`  | `true`   | Allows cells to be edited   |
| `paginate` | `boolean`  | `false`   | Paginate data. Defaults to in memory   |
| `defaultColumnDef` | `ColumnDef[]`  | `[]`   | Columns to be displayed and their order. By default, all columns are displayed in order of the first object's keys   |
| `defaultLoadMessage` | `string`  | `Loading...`   | Message to display while data grid is loading   |
| `serverSideTotal` | `number`  | `0`   | Activate server side pagination with a value > 0   |
| `serverSideFilteredTotal` | `number`  | `0`   | Set when paginating from server and filters are active, keep serverSideTotal > 0 when using  |
| `pageLoadMessage` | `string`  | `Loading...`   | Message to display while you're executing ss pagination   |
| `rowsPerPage` | `number`  | `25`   | Number of rows per page if paginated=true, max is 250   |
| `rowNumbers` | `boolean`   | `true`   | Show row numbers on left hand side of grid   |
| `data` | `signal<any[]>`   | `[]`   | signal Array of objects to display   |
| `color1` | `string`   | `""`   | Theme color 1 (css, hex, rgb)   |
| `color2` | `string`   | `""`   | Theme color 2 (css, hex, rgb)   |
| `primaryKey` | `string`   | `""`   | primary key of your data set, helps performance to add it   |
| `defRowHgt` | `string`   | `50px`   | default row height (px)   |
| `defGridHgt` | `number`   | `500`   | default grid height in px   |
| `licenseKey` | `string`   | `""`   | License key for non localhost deployment   |
| `pieGraphColors` | `string[]`   | `[]`   | list of colors for pie graph sections if applicable (css, hex, rgb)   |
| `removePieCovers` | `boolean` \| `string[]`   | `false`   | false removes all pie graph covers, a list of string column names removes only those columns' covers   |
| `altRowColor` | `string`   | `""`   | alternate row color (css, hex, rgb)   |
| `myColumnStyles` | `ColumnStyles[]`   | `[]`   | pass css styles to specific values in a column   |
| `myColumnValueColors` | `ColumnValueColors[]`   | `[]`   | assign a color to a value in pie, line, and bar graphs   |
| `forceGrouping` | `string[]`   | `[]`   | array of column names to force grouping - gives dropdown filter & pie graphs for the column   |    
| `disableOmniFilter` | `boolean`  | `false`   | True removes the top left, global filter from the DOM   |
| `disableCharts` | `boolean`  | `false`   | True removes the Insights button, thus disabling charts   |
| `disableGroupBy` | `boolean`  | `false`   | True removes the Group By drop down panel at the bottom right of the data grid   |
| `disableExport` | `boolean`  | `false`   | True removes the Export drop down panel at the bottom right of the data grid   |
| `disableRowSelection` | `boolean`  | `false`   | True removes row checkboxes, the Deselect Rows button, and the toggle Selected Rows button from the DOM   |
| `hideJumpTo` | `boolean`  | `false`   | True removes the jump to options in the right hand footer when the data grid is not paginated  |
| `hideColumnFilters` | `boolean`  | `false`   | True removes the column filters and options in the column headers   |  
-  

**Component Output API**
| Output | Type  | Description
|----------|----------|----------|
| `cellEdit` | `CellEdit`  | An object that emits with all necessary cell edit details. See more details further down   |
| `pageChange` | `PageChange`   | An object that emits on paginator change events if serverSideTotal input bound property is > 0. Facilitates server side pagination   |
| `dataFiltered` | `DataFilter`  | An object that emits when server-side paginating. It gives column filter data to help query your backend for a serverSideFilteredTotal for the currently applied filters  |

-  


It's best to pass hex or rgb colors to **color1, color2, pieGraphColors, & altRowColor,** but css colors work too  

Always pass a **px** string value to defRowHgt like '50px'

Charts, Dropdown filters, Exports, Row grouping, and Row numbers are disabled when server-side pagination is enabled or when paginate=true AND serverSideTotal > 0;
Row grouping and Row numbers are disabled when paginate=true but no serverSideTotal is set (in memory pagination).

**forceGrouping** - if a column you want grouping/dropdown filters for isn't getting that treatment automatically, try to force it with this - may or may not work 
depending on how many distinct values the column has and other criteria 

**removePieCovers** input can be a boolean or a string[] of column names where the pie graph should be uncovered

**Custom Column Sort** - please visit https://deebodata.com/ngx-deebodata-documentation/ngx-deebodata#customSort to learn about a custom sort per column


**To pass Column Symbols (Numeric columns only)**

- In the .ts component you want to use the data grid in

```
import { ColumnSymbol, NgxDeebodata } from 'ngx-deebodata';
```

- in the exported class

```
symbols: ColumnSymbol[] = [{ column: "salary", symbol: "$" }];
```

- In the template of the component

```
<ngx-deebodata
[data]="sampleData()"
[myColumnSymbols]="symbols"
></ngx-deebodata>
```


**To Hook Cell Edits**

- In the .ts component you want to use the data grid in

```
import { CellEdit, NgxDeebodata } from 'ngx-deebodata';
```

- in the exported class

```
handleCellEdit(event: CellEdit) {//executes on cell edit if editable isn't false
    /*CellEdit interface -> { value: any; row: any; column: string; idType: string; valueChanged: boolean; }
    row will either be the 0-based index of the edited cell's parent row in the initial data set
    or, if a primaryKey is passed or detected, it will be the value of that primaryKey for the edited 
    row. Use idType (will be either "key" or "rowId") to know which one is emitting. column is 
    the column/attribute and value is the real value of the edit, which can be a string, number 
    or Date. Use valueChanged to know if an edit actually changed the value*/
    // console.log(event)
}
```

**To Implement Server-side Pagination**

- In the .ts component you want to use the data grid in

```
import { PageChange, NgxDeebodata } from 'ngx-deebodata';
```

- in the exported class

```
handlePageChange(event: PageChange) {//executes on paginator change if serverSideTotal > 0
    //implement a server side http request using the data emitted here and update the data input with your resulting response array of data. 
    //You can update the serverSideTotal here also for instance if you're using filters and want a new total from your backend based on said filters
    Keep the serverSideTotal > rowsPerPage even on failed or no result api responses so that this function gets invoked!!
    /*PageChange interface -> { skip: number; take: number; columnConfig?: any; topLevelFilter: string; sortOrder: string[]; }   
    skip will be the page number selected - 1. So selecting page 1 will emit a skip equal to 0 for your custom logic
    take will be equal to the rowsPerPage value you can update
    topLevelFilter is the value of the omnifilter input above the data grid
    columnConfig contains the filter values on a per column basis and an 'asc' or 'desc' value for any sorted columns
    sortOrder is a string[] with a list of column names in order of sort priority, if any sorts are applied*/
    // console.log(event)
    //charts and filters are limited to the data currently in memory when using server side pagination
}
```

- In the template of the component

```
<ngx-deebodata
[paginate]="true"
[serverSideTotal]="1000000"
[pageLoadMessage]="'Loading...'"
[data]="someServerPaginatedData()"
(pageChange)="handlePageChange($event)"
></ngx-deebodata>
```

**To pass Column Value Colors for Charts**  

For a given column with limited distinct values (qualifies for grouping), give each value it's own color in the charts (pie, bar, line)

- In the .ts component you want to use the data grid in

```
import { ColumnValueColors, NgxDeebodata } from 'ngx-deebodata';
```

- in the exported class

```
valueColors: ColumnValueColors[] = [
    {
      column: "party",
      valueColors: [
        { value: "Republican", color: "rgb(255, 0, 0)" },
        { value: "Democrat", color: "rgb(0, 0, 255)" },
        { value: "Independent", color: "rgb(0, 255, 0)" }
      ]
    }
  ]
```

- In the template of the component

```
<ngx-deebodata
[data]="sampleData()"
[myColumnValueColors]="valueColors"
></ngx-deebodata>
```

**To pass Column Styles**  

The only css values processed now are color, font_size, font_weight, and text_decoration.

- In the .ts component you want to use the data grid in

```
import { ColumnStyles, NgxDeebodata } from 'ngx-deebodata';
```

- in the exported class

```
columnStyles: ColumnStyles[] = [
                { 
                    column: "party", 
                    css: [
                        { value: "Republican", color: "red", font_size: "18px" },
                        { value: "Democrat", color: "blue", font_size: "18px" },
                        { value: "Independent", color: "green", font_size: "18px" },
                    ] 
                },
            ]
```

- In the template of the component

```
<ngx-deebodata
[data]="sampleData()"
[myColumnStyles]="columnStyles"
></ngx-deebodata>
```