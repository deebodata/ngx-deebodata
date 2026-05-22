# NgxDeebodata

Angular data grid with virtual scroll, integrated charts, row grouping, column resizing, toggle column visibility, cell editing, tab accessibility, sorting with priority, and advanced filtering. This package uses only basic @angular packages and rxjs as peer dependencies. 

# Licensing

Install this package and use the full functionality when developing locally at **http://localhost:4200/**  

To deploy to any live url, you need to obtain a **deployment license** for each developer on the project from https://deebodata.com/data-grid-checkout/angular

## Usage

**In the .ts component you want to use the data grid in**

```
import { NgxDeebodata } from 'ngx-deebodata';

@Component({
  selector: 'app-your-component',
  imports: [ NgxDeebodata ],
  templateUrl: './your-component.html',
  styleUrl: './your-component.css'
})
```

**In the template of the component**

```
<ngx-deebodata
[editable]="true"
[rowNumbers]="true"
[data]="signalArrayOfObjects()"
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
[data]="signalArrayOfObjects()"
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
    row. Use idType (will be either "key" or "rowId") to know which one is emitting. Use valueChanged 
    to know if an edit actually changed the value*/
    // console.log(event)
}
```

- In the template of the component

```
<ngx-deebodata
[data]="signalArrayOfObjects()"
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
[data]="signalArrayOfObjects()"
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
[data]="signalArrayOfObjects()"
[myColumnStyles]="columnStyles"
></ngx-deebodata>
```
