import { Component, ElementRef, EventEmitter, input, Output, signal, ViewChild } from '@angular/core';
import { CommonService } from '../../../services/common-service';
import { DataTableService } from '../../../services/data-table-service';
import { CommonModule, DecimalPipe } from '@angular/common';
import { TableDragService } from '../../../services/table-drag-service';
import { PageChange } from '../../../interfaces/page-change';

@Component({
  selector: 'lib-real-paginator',
  imports: [CommonModule, DecimalPipe],
  templateUrl: './real-paginator.html',
  styleUrls: ['./real-paginator.css', '../../../styles.css']
})
export class RealPaginator {

  lastPage = signal<number>(100)
  omniFilter = input<string>("")
  disableButtons = signal<boolean>(false)
  pageBtns: number[] = []
  @Output("pageChange") pageChange: EventEmitter<PageChange> = new EventEmitter()
  @ViewChild("btnPageFirst", { static: true }) btnPageFirst!: ElementRef<HTMLElement>;
  @ViewChild("btnPageBack", { static: true }) btnPageBack!: ElementRef<HTMLElement>;
  @ViewChild("btnPageForward", { static: true }) btnPageForward!: ElementRef<HTMLElement>;
  @ViewChild("btnPageLast", { static: true }) btnPageLast!: ElementRef<HTMLElement>;
  @ViewChild("paginatorTracker", { static: true }) paginatorTracker!: ElementRef<HTMLElement>;
  @ViewChild("totalRows", { static: true }) totalRows!: ElementRef<HTMLElement>;
  @ViewChild("currPage", { static: true }) currPage!: ElementRef<HTMLElement>;


  constructor(public dataTableService: DataTableService, 
              public tblDragService: TableDragService,
                  public common: CommonService,) {
        }

  ngOnInit() {
    this.setPagi(1)
    this.dataTableService.renderEvent.subscribe( d => this.setPagi(this.dataTableService.currPage))
    this.dataTableService.forcePageOne.subscribe( d => this.btnPageFirst.nativeElement.click())
    this.dataTableService.disablePageButtons.subscribe( d => this.disableButtons.set(d))
  }
  
  setPagi(page: number) {
    const r = (this.dataTableService.currPage-1)*this.dataTableService.rowsPerPage;
    this.setPageTracker(Math.min(r+this.dataTableService.rowsPerPage, this.dataTableService.getTotal()))
    const pMax = Math.ceil(this.dataTableService.getTotal()/this.dataTableService.rowsPerPage);
    this.currPage.nativeElement.textContent = ("Page "+page.toLocaleString(undefined, { maximumFractionDigits: 0 })+ "/" + 
    pMax.toLocaleString(undefined, { maximumFractionDigits: 0 }));
    this.lastPage.set(Math.ceil(this.dataTableService.getTotal()/this.dataTableService.rowsPerPage))
    this.setBtnPages()
  }

  setBtnPages() {
    let bs = [];
    let i = Math.max(1, this.dataTableService.currPage-3)
    const max = Math.min(this.lastPage(), this.dataTableService.currPage+3);//7 page buttons
    for(i; i <= max; i++)
      bs.push(i)
    this.pageBtns = [...bs];
  }

  handlePaginatorChange(page: number) {
      if(this.dataTableService.currPage === page)
        return;
      const max = Math.ceil(this.dataTableService.getTotal()/this.dataTableService.rowsPerPage)
      this.dataTableService.currPage = Math.max(1, Math.min(page, max))
      this.setPagi(this.dataTableService.currPage)
      this.pageChange.emit({skip: (this.dataTableService.currPage-1), take: this.dataTableService.rowsPerPage, topLevelFilter: this.omniFilter(), columnConfig: this.dataTableService.getFilTrkerData(), sortOrder: [...this.dataTableService.sortOrder]})
  }

  setPageTracker(len: number) {
      const start = ((this.dataTableService.currPage-1)*(Math.min(this.dataTableService.rowsPerPage, this.dataTableService.getTotal()))) + 1
      this.paginatorTracker.nativeElement.textContent = ("Rows " + start?.toLocaleString(undefined, { maximumFractionDigits: 0 }) + "-" + 
      Math.min(len, (start+(this.dataTableService.rowsPerPage-1))).toLocaleString(undefined, { maximumFractionDigits: 0 }) );
      this.totalRows.nativeElement.textContent = this.dataTableService.getTotal().toLocaleString(undefined, { maximumFractionDigits: 0 })
  }
}
