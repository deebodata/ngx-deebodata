export interface ColumnStyles {
    column: string;
    css: ValueCss[];
}

export interface ValueCss { 
    value: string; 
    color?: string; 
    font_size?: string;
    text_decoration?: string;
    font_weight?: string;
    /*add more valid css properties (sub underscore for a dash) as keys to suit your application's needs*/
}

