export interface ColumnHeader {
    column: string;
    width?: string;
    height?: string;
    sortable: boolean;
    hideFilter: boolean;
    lineHeight?: string;
    dataType: string;
    freeze: boolean;
    minimized: boolean;
    hideMinCol: boolean;
}
