import { Component, ElementRef, EventEmitter, Input, Output, SimpleChanges, HostListener, input, signal } from '@angular/core';
import { DataTableService } from '../../../services/data-table-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableDragService } from '../../../services/table-drag-service';
import { CommonService } from '../../../services/common-service';

@Component({
  selector: 'app-data-table-paginator',
  imports: [CommonModule, FormsModule,],
  templateUrl: './data-table-paginator.html',
  styleUrls: ['./data-table-paginator.css', '../../../styles.css']
})
export class DataTablePaginator {

    @HostListener('window:click', ['$event'])
    onWindowClick(e: MouseEvent) {
        if(this.listenToWindowSkipTo && document.getElementsByClassName("skip-to-options").length){
            if(e && e.target && (e.target instanceof Element) && (/skip/g.test(e.target.className) || /skip/g.test(e.target.id)))
                return;
            this.closeSkipOpts()
        }
    }

    constructor(public dataTableService: DataTableService,
                public tblDragService: TableDragService,
                public common: CommonService,
                public skipTo: ElementRef,) {

    }

    init = true
    isKeying = false
    totalRowStr = "";
    rowinating = false
    jumpableRows: any[] = []
    listenToWindowSkipTo = false
    showSkipTo: boolean = false;
    @Input() totalRows: number = 0;
    filSortStr = input<string>("");
    @Input() disableJump: boolean = false;
    @Output("jumpTo") jumpTo: EventEmitter<number> = new EventEmitter(true)

    ngOnChanges(changes: SimpleChanges){
        if(!this.init && changes){
            if(changes["totalRows"])
                this.setUpPagi()
        }
    }

    ngOnInit() {
        this.setUpPagi()
        this.init = false
    }

    setUpPagi() {
        this.handleSkipToDD()
        this.totalRowStr = this.totalRows.toLocaleString(undefined, { maximumFractionDigits: 0 })
    }

    //PAGINATOR
    handleSkipToPage(value: any) {
        const pnum = parseInt(value.toString())
        if(value && !isNaN(pnum) && !this.isKeying){
            this.jumpTo.emit(pnum)
            this.closeSkipOpts()
        }
    }

    setUpHandleSkipToPage(val: any) {//mock option click
        if(val){
            const useVal = Math.min(val, this.totalRows)
            this.skipTo.nativeElement.value = useVal
            this.handleSkipToPage(useVal)
        } else {
          this.closeSkipOpts()
        }
    }

    handleSkipToPageOnKeyup(event: any, val: any) {
        if(event && event.type === "blur" && ((event.relatedTarget && /skip-to-options/g.test(event.relatedTarget.className)) || 
          (event.relatedTarget && event.relatedTarget.parentElement && /skip-to-options/g.test(event.relatedTarget.parentElement.className)))) return;
        this.isKeying = true
        setTimeout( () => { 
            this.isKeying = false 
            this.handleSkipToPage(val)
        })
    }

    setUpHandleSkipToPageOnEnter(page: any) {
        this.setUpHandleSkipToPage(page)
    }

    handleSkipToPageOnKeyupEnter(val: any) {
        this.handleSkipToPage(val)
    }

    showSkipToOptions(event: Event) {
        if(!this.showSkipTo)
            this.showSkipTo = true;
        if(event && !this.listenToWindowSkipTo)
            setTimeout( () => { this.listenToWindowSkipTo = true })
    }

    closeSkipOpts() {
        this.showSkipTo = false;
        this.listenToWindowSkipTo = false
    }

    handleSkipToDD() {
        this.jumpableRows = []
        this.jumpableRows.push({ text: "1st Row", value: "1" })
        if(this.totalRows > 10){
            const qtr = Math.ceil(this.totalRows/4)
            const half = Math.ceil(this.totalRows/2)
            const thrqtr = Math.ceil(this.totalRows*.75)
            this.jumpableRows.push({ text: "Row " + qtr.toLocaleString(undefined, { maximumFractionDigits: 0 }), value: qtr })
            this.jumpableRows.push({ text: "Row " + half.toLocaleString(undefined, { maximumFractionDigits: 0 }), value: half })
            this.jumpableRows.push({ text: "Row " + thrqtr.toLocaleString(undefined, { maximumFractionDigits: 0 }), value: thrqtr })
        }
        this.jumpableRows.push({ text: "Last Row", value: this.totalRows })
    }
    //PAGINATOR

}
