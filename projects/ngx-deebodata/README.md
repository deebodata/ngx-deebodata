# NgxDeebodata

Angular v22 data grid with virtual scroll, integrated charts, row grouping, column resizing, column hiding, cell editing, tab accessibility, sorting with priority, and advanced filtering. This package uses only basic @angular packages and rxjs as peer dependencies.   

# Demos  

- 100k rows - https://deebodata.com/angular-data-grid?data=sales 


# Licensing

Install this package and use the full functionality when developing locally at http://localhost:4200

To deploy to any live url, you need to obtain a **deployment license** for each developer on the project from https://deebodata.com/data-grid-checkout/angular  


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
-  

**Component Output API**
| Output | Type  | Description
|----------|----------|----------|
| `cellEdit` | `CellEdit`  | An object that emits with all necessary cell edit details. See more details further down   |
-  


It's best to pass hex or rgb colors to **color1, color2, pieGraphColors, & altRowColor,** but css colors work too  

Always pass a **px** string value to defRowHgt like '50px'

**forceGrouping** - if a column you want grouping/dropdown filters for isn't getting that treatment automatically, try to force it with this - may or may not work 
depending on how many distinct values the column has and other criteria 

**removePieCovers** input can be a boolean or a string[] of column names where the pie graph should be uncovered


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

- In the template of the component

```
<ngx-deebodata
[data]="sampleData()"
(cellEdit)="handleCellEdit($event)"
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
