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
  // skipDDs: any[] = []
  omniFilter = input<string>("")
  disableButtons = signal<boolean>(false)
  pageBtns: number[] = []
  @Output("pageChange") pageChange: EventEmitter<PageChange> = new EventEmitter()
  @ViewChild("btnPageFirst", { static: true }) btnPageFirst!: ElementRef<HTMLElement>;
  @ViewChild("btnPageBack", { static: true }) btnPageBack!: ElementRef<HTMLElement>;
  @ViewChild("btnPageForward", { static: true }) btnPageForward!: ElementRef<HTMLElement>;
  @ViewChild("btnPageLast", { static: true }) btnPageLast!: ElementRef<HTMLElement>;
  // @ViewChild("skipTo", { static: true }) skipTo!: ElementRef<HTMLElement>;
  // @ViewChild("skipToOptions", { static: true }) skipToOptions!: ElementRef<HTMLElement>;
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
    // this.skipTo.nativeElement.setAttribute("max", pMax.toString())
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

  // handleRowsPerPageChange(event: any) {//Only for non server side
  //     if(event.target.value && !isNaN(parseInt(event.target.value))){
  //         this.dataTableService.rowsPerPage = parseInt(event.target.value)
  //         dataUpload.methods.renderCurrData()
  //         dataUpload.methods.handleSkipToDD(this.dataTableService.currPage)
  //         const max = Math.ceil(this.dataTableService.currFilData.length/this.rowsPerPage)
  //         document.getElementById("currPage").textContent = "Page " + (this.dataTableService.currPage?.toLocaleString(undefined, { maximumFractionDigits: 0 })) + 
  //         ("/" + max.toLocaleString(undefined, { maximumFractionDigits: 0 }))
  //         document.getElementById("skipTo").setAttribute("max", max)
  //     }
  // }

  // handleSkipToPage(event) {
  //     if(event && event.type === "blur" && ((event.relatedTarget && /skip-to-options/g.test(event.relatedTarget.className)) || 
  //       (event.relatedTarget && event.relatedTarget.parentElement && /skip-to-options/g.test(event.relatedTarget.parentElement.className)))) return;
  //     if(event.target.value && !isNaN(parseInt(event.target.value))){
  //         let uVal = parseInt(event.target.value)
  //         if(uVal === this.dataTableService.currPage)
  //             return
  //         const max = Math.ceil(this.dataTableService.currFilData.length/this.dataTableService.rowsPerPage)
  //         if(uVal < 1){
  //             uVal = 1
  //             event.target.value = 1
  //         }
  //         if(uVal > max){
  //             uVal = max
  //             event.target.value = max
  //         }
  //         this.dataTableService.currPage = uVal
  //         dataUpload.methods.renderCurrData()
  //         const maxStr = max.toLocaleString(undefined, { maximumFractionDigits: 0 })
  //         document.getElementById("currPage").textContent = ("Page " + (this.dataTableService.currPage?.
  //         toLocaleString(undefined, { maximumFractionDigits: 0 })) + "/" + maxStr)
  //         document.getElementById("btnReset").disabled = false
  //         document.getElementById("skipTo").setAttribute("max", max)
  //         document.getElementById("skipToOptions").className = "skip-to-options-hide"
  //     }
  // }

  // setUpHandleSkipToPage(e) {//mock option click
  //     const val = e.target.getAttribute("data-value")
  //     if(val){
  //         const max = Math.ceil(this.dataTableService.currFilData.length/this.dataTableService.rowsPerPage)
  //         const useVal = Math.min(val, max)
  //         document.getElementById("skipTo").value = useVal
  //         dataUpload.methods.handleSkipToPage({ target: { value: useVal } })
  //     } else {
  //         document.getElementById("skipToOptions").className = "skip-to-options-hide"
  //     }
  // }

  // setUpHandleSkipToPageOnEnter(e) {
  //     if(common.controller.isEnterKey(e))
  //         dataUpload.methods.setUpHandleSkipToPage(e)
  // }

  // handleSkipToPageOnKeyup(e) {
  //     if(common.controller.isEnterKey(e))
  //         dataUpload.methods.handleSkipToPage(e)
  // }

  // showSkipToOptions() {
  //     const len = document.getElementsByClassName("skip-to-options").length
  //     if(!len){
  //         document.getElementById("skipToOptions").classList.add("skip-to-options")
  //         setTimeout( function() { window.addEventListener("click", dataUpload.methods.closeSkipOpts) })
  //     }
  // }

  // closeSkipOpts(e) {
  //     if(e && e.target && (/skip/g.test(e.target.className) || /skip/g.test(e.target.id)))
  //         return
  //     document.getElementById("skipToOptions").className = "skip-to-options-hide"
  //     window.removeEventListener("click", dataUpload.methods.closeSkipOpts)
  // }

  handlePaginatorChange(page: number) {
      if(this.dataTableService.currPage === page)
        return;
      const max = Math.ceil(this.dataTableService.getTotal()/this.dataTableService.rowsPerPage)
      this.dataTableService.currPage = Math.max(1, Math.min(page, max))
      this.setPagi(this.dataTableService.currPage)
      this.pageChange.emit({skip: (this.dataTableService.currPage-1), take: this.dataTableService.rowsPerPage, topLevelFilter: this.omniFilter(), columnConfig: this.dataTableService.getFilTrkerData(), sortOrder: [...this.dataTableService.sortOrder]})
      // document.getElementById("skipTo").value = this.dataTableService.currPage
      // document.getElementById("skipTo").setAttribute("max", max)
      // document.getElementById("btnReset").disabled = false
  }

  setPageTracker(len: number) {
      const start = ((this.dataTableService.currPage-1)*(Math.min(this.dataTableService.rowsPerPage, this.dataTableService.getTotal()))) + 1
      this.paginatorTracker.nativeElement.textContent = ("Rows " + start?.toLocaleString(undefined, { maximumFractionDigits: 0 }) + "-" + 
      Math.min(len, (start+(this.dataTableService.rowsPerPage-1))).toLocaleString(undefined, { maximumFractionDigits: 0 }) );
      this.totalRows.nativeElement.textContent = this.dataTableService.getTotal().toLocaleString(undefined, { maximumFractionDigits: 0 })
  }

  // handleSkipToDD(page) {
  //     let i = 1
  //     const el = document.getElementById("skipToOptions")
  //     const len = Math.ceil(this.dataTableService.currFilData?.length/this.dataTableService.rowsPerPage)
  //     el.innerHTML = ""
  //     const fopt = document.createElement("div")
  //     fopt.tabIndex = 0
  //     fopt.textContent = "1st page"
  //     fopt.setAttribute("data-value", "1")
  //     fopt.onclick = dataUpload.methods.setUpHandleSkipToPage
  //     fopt.onkeyup = dataUpload.methods.setUpHandleSkipToPageOnEnter
  //     el.appendChild(fopt)
  //     const lopt = document.createElement("div")
  //     lopt.tabIndex = 0
  //     lopt.textContent = "Last page"
  //     lopt.setAttribute("data-value", len)
  //     lopt.onclick = dataUpload.methods.setUpHandleSkipToPage
  //     lopt.onkeyup = dataUpload.methods.setUpHandleSkipToPageOnEnter
  //     el.appendChild(lopt)
  //     for(i; i <= Math.min(len, 100); i++){
  //         const opt = document.createElement("div")
  //         opt.tabIndex = 0
  //         opt.textContent = i + " out of " + len.toLocaleString(undefined, { maximumFractionDigits: 0 })
  //         opt.setAttribute("data-value", i)
  //         if(page && page === i)
  //             document.getElementById("skipTo").value = i
  //         opt.onclick = dataUpload.methods.setUpHandleSkipToPage
  //         opt.onkeyup = dataUpload.methods.setUpHandleSkipToPageOnEnter
  //         el.appendChild(opt)
  //     }
  // }

}
