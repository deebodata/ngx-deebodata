export interface ColumnDef {
    column: string;//property name in data
    width?: number;//default column width
    sortable?: boolean;//disable column sort
    hideFilter?: boolean;//disable column filter
    displayName?: string;//display name in column header
}
