export interface PageChange {
    skip: number;
    take: number;
    columnConfig?: any;
    topLevelFilter: string;
    sortOrder: string[];    
}
