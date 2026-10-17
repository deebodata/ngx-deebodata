import { Component, ElementRef, Input, Output, ViewChild, EventEmitter, HostListener, input, signal, ChangeDetectorRef, effect, ChangeDetectionStrategy } from '@angular/core';
import { CommonService } from '../../../services/common-service';
import { CommonModule, DecimalPipe } from '@angular/common';
import { DataTableService } from '../../../services/data-table-service';
import { DataRow } from '../../../interfaces/data-row';
import { DataCellComponent } from '../data-cell/data-cell';
import { DataCell } from '../../../interfaces/data-cell';
import { TableDragService } from '../../../services/table-drag-service';
import { Subscription, timer } from 'rxjs';

@Component({
  selector: 'app-row-group-panel',
  imports: [CommonModule, DecimalPipe, DataCellComponent],
  templateUrl: './row-group-panel.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./row-group-panel.css', '../../../styles.css']
})
export class RowGroupPanel {

  @HostListener('window:mouseup', ['$event'])
  onWindowMouseUp(e: MouseEvent) {
      if(this.open())
        this.handleScrlBarDrag()
  }

  init = true
  count: number = 0
  verticalRest = 0
  isScrolling = false;
  open = signal<boolean>(false)
  uiGroupValue: string = ""
  elifyGrouping: string = ""
  rows: DataRow[] = [];
  panelData: any[] = []
  tblTop: number = 0
  tblBot: number = 0
  aboveHgt = signal<number>(0);
  belowHgt = signal<number>(0);
  rowNums: number[] = []
  changedIds: string[] = []
  scrollDir: string = "down"
  lastElRowIndex: number = 0;
  transY =signal<number>(0);
  finishScrollTO: any = null;
  valEditFocusTo: any = null;
  horizRest = input<number>(0)
  colOfInt = input<string>("")
  dtr: string = "";
  rowElsPad = 1;
  doRowsMod: number = 10;
  @Input() groupValue: string = ""
  @Input() useRowWid: string = ""
  @Input() maxCols: number = 0
  @Input() editable: boolean = false
  @Input() columns: string[] = []
  @Input() showRowNumbers: boolean = true
  @Output("openEvt") openEvt: EventEmitter<string> = new EventEmitter()
  @Output("horizPos") horizPos: EventEmitter<number> = new EventEmitter()
  @Output("cellEdit") cellEdit: EventEmitter<any> = new EventEmitter()
  @ViewChild("panelDataGrid") panelDataGrid!: ElementRef<HTMLElement>;
  @ViewChild("aboveArea") aboveArea!: ElementRef<HTMLElement>;
  @ViewChild("belowArea") belowArea!: ElementRef<HTMLElement>;

  constructor(public common: CommonService,
              private tblDragService: TableDragService,
              public dataTableService: DataTableService,
              private _cd: ChangeDetectorRef,
  ) {
    effect(() => {
        if(this.open())
            this.setHorizScrPos()
    })
  }

  ngOnInit() {
    this.uiGroupValue = this.common.titleCase(this.groupValue)
    this.elifyGrouping = this.common.elifyCol(this.groupValue)
    this.count = this.dataTableService.currFilData.filter( d => d[this.dataTableService.currGroup] === this.groupValue).length
    this.dtr = this.common.elifyCol(this.groupValue) + "dataTableRow";
    this.dataTableService.groupedBoundsChange.subscribe( e => { this.setTblBot() })
    this.dataTableService.gridScrollEndWhileGrouped.subscribe( e => { if(!this.isScrolling) {this.setTblBot()} })
    this.dataTableService.gridEventWhileGrouped.subscribe( e => { 
      const nowOpen = this.open()
      this.rows = []
      this.panelData = []
      this.open.set(false) 
      this.rowNums = []
      this.count = this.dataTableService.currFilData.filter( d => d[this.dataTableService.currGroup] === this.groupValue).length
      if(nowOpen)
        timer(0).subscribe( () => { this.openGroup() })
    })//just close
    // this.dataTableService.mouseupWhileGrouped.subscribe( e => {
    //     if(this.open()){
    //       setTimeout( () => { 
    //         const pEl = this.panelDataGrid?.nativeElement
    //         if(pEl){
    //             pEl.scrollBy(0, 1);
    //             pEl.scrollBy(0, -1);
    //         }
    //       } )
    //     }
    // })
  }

  openGroup() {
    this.open.set(!this.open())
    timer(0).subscribe( () => {
        if(!this.open()){
          this.rows = []
          this.panelData = []
          this.aboveHgt.set(0);
          this.belowHgt.set(0);
          this.rowNums = []
        } else {
          this.panelData = this.dataTableService.currFilData.filter( d => d[this.dataTableService.currGroup] === this.groupValue)
          this.count = this.panelData.length
          let n = 0
          const defNum = this.dataTableService.defltRHgtNum
          const init = Math.ceil(400/defNum)+this.rowElsPad;
          const addCell = (text: any, prop: string | null, row: DataRow | null, visible: boolean) => {
              if(prop && row){
                  const useProp = this.dataTableService.dataFilSrtTracker[prop]
                  const notNum = (this.dataTableService.figureFilterType(prop) != "number" || /(year|yr|fy)/g.test(prop.toLocaleLowerCase())) ? true : false
                  const useTxt = this.dataTableService.figureCellText(text, notNum, useProp["colCellSymbol"])
                  const colStyle = this.dataTableService.getColumnStyle(prop)
                  row.cells?.push({
                    column: prop,
                    rawText: text,
                    visible: visible,
                    freeze: useProp.freeze,
                    minimized: useProp.minimize,
                    editable: false,
                    width: useProp.colWidth || this.dataTableService.useColWid,
                    dataType: this.dataTableService.figureFilterType(prop),
                    text: (useTxt.prop === "textContent" ? useTxt.value : ""),
                    html: (useTxt.prop !== "textContent" ? useTxt.value : ""),
                    specialColClass: (colStyle ? (colStyle + this.common.elifyCol(useTxt.value)) : ""),
                  })
              }
          }
          const limit = Math.min(init, this.count)
          const colLen = this.columns.length
          let horizLim = Math.min(this.maxCols, colLen)
          if(this.colOfInt()){
              let indOfScrl: number = this.columns.indexOf(this.colOfInt()) + 1
              const vlen: number =this.dataTableService.visibleCols.length
              const indInVis: number = this.dataTableService.visibleCols.indexOf(this.colOfInt())
              const diff = vlen - indInVis
              if(diff > 0)
                indOfScrl += diff
              horizLim = indOfScrl
          } else {
            if(this.horizRest() > 0){
                const vCollen = this.dataTableService.visibleCols.length
                const lvis = this.dataTableService.visibleCols[(vCollen - 1)]
                horizLim = this.columns.indexOf(lvis) + 1
            }
          }
          let localRows: DataRow[] = [];
          for(n; n < limit; n++){
            const item = this.panelData[n]
            const index = this.dataTableService.currMapping[n] || this.dataTableService.findObjIndxInData(item)
            if(index > -1){
              const row: DataRow = { id: this.dtr + index, index: index, width: this.useRowWid, cells: [], height: this.dataTableService.defltRHgt }
              let k = 0
              for(k; k < colLen; k++){
                const col = this.columns?.[k]
                if(col)
                    addCell(item[col], col, row, (k <= horizLim))
              }
              localRows.push(row)
            }
          }
          this.rows = [...localRows]
          this.setLastRowIndex()
          timer(250).subscribe( () => { 
              this.setRowNums()
              if(this.count > init){
                  let total = 0
                  let z = this.lastElRowIndex + 1
                  for(z; z < this.count; z++)
                    total += 1
                  this.belowHgt.set(total*defNum)
              }
              this.setHorizScrPos()
              this.openEvt.emit("row-group-panel-" + this.elifyGrouping)
              timer(0).subscribe( () => { 
                this.setTblBot(); 
                const pEl = this.panelDataGrid?.nativeElement
                if(pEl){
                    pEl.scrollBy(1, 1);
                    pEl.scrollBy(0, -1);
                }
                this.setRowNumPlacement()
                this._cd.detectChanges()
              })
            })
          }
        })
    }

  setTblBot() {
    if(this.panelDataGrid)
      this.tblBot = (this.panelDataGrid.nativeElement.getBoundingClientRect().bottom || 0)// + 250
    const panelTop = document.getElementsByClassName("row-group-panel-" + this.elifyGrouping)[0]
    if(panelTop)
      this.tblTop = (panelTop.getBoundingClientRect().bottom || 0)// - 200
    timer(0).subscribe( () => { this.setRowNumPlacement() })
  }
    
  setHorizScrPos() {
      const body = this.panelDataGrid?.nativeElement
      if(body)
        body.scrollLeft = this.horizRest()
  }

  setLastRowIndex() {
      const realMax = this.panelData.length - 1
      const wannabeMax = (this.rows.length - 1) + Math.floor(this.aboveHgt()/this.dataTableService.defltRHgtNum)
      this.lastElRowIndex = Math.min(wannabeMax, realMax)
      return this.lastElRowIndex;
  }

  setColsOnVisScreen() {
      let i = 0
      let vCols = []
      const len = this.columns.length
      for(i; i < len; i++){
          const col = this.columns[i]
          const el = document.getElementById("columnHeader" + this.common.elifyCol(col))
          if(el){
              const elbds = el.getBoundingClientRect()
              if(elbds.left >= this.dataTableService.tblLeft && elbds.right < this.dataTableService.tblRight)
                  vCols.push(col)
          }
      }
      this.dataTableService.visibleCols = [...vCols]
    }

    setRowNums() {//only on initial
        if(this.showRowNumbers){
            const rlen = this.rows.length
            if(rlen){
                let n = (this.lastElRowIndex + 1) - rlen
                for(n; n <= this.lastElRowIndex; n++)
                    this.rowNums.push(n + 1)
            }
        }
    }

    setRowNumPlacement() {
        if(this.showRowNumbers){
            let i = 0
            const radd = 2
            const els = document.getElementsByClassName("row-nums-" + this.elifyGrouping)
            const len = els.length
            const dtBody = this.panelDataGrid?.nativeElement
            if(dtBody){
                const tbds = dtBody.getBoundingClientRect()
                const col1Frozen = document.getElementsByClassName("col-item-freeze").length
                for(i; i < len; i++){
                    const num = <HTMLElement>els[i]
                    const row = this.rows[i]
                    if(row){
                        const tTop = tbds.top
                        const rbds = document.querySelector("#panelDataGrid" + this.elifyGrouping + " #" + row.id)?.getBoundingClientRect()
                        if(rbds){
                            const hh = (rbds.height/2)
                            const top = Math.floor(((rbds.bottom - (hh+radd)) - tTop))
                            num.style.top = (top-this.transY()) + "px"
                            if(rbds.top < (tTop-2) || (rbds.bottom > (tTop + tbds.height+1)) || (dtBody.scrollLeft > 35 && !col1Frozen)){
                                num.classList.add("hide")
                                continue
                            }
                            num.classList.remove("hide")
                            num.classList.remove("invisible")
                        }
                    }
                }
            }
        }
    }

    handleScrlBarDrag() {
        this.dataTableService.mouseIsDown = false;
        if(!this.finishScrollTO){
            timer(0).subscribe(() => {this.completeScroll(); this.dataTableService.listenForScroll.set(true);})
        } else {
            this.dataTableService.listenForScroll.set(true);
        }
    }

    setAllRowsDefHgt() {
        let i = 0
        const len = this.rows.length
        for(i; i < len; i++)
            this.setSingleRowHgt(this.dataTableService.defltRHgtNum, this.rows[i].id, true) 
    }

    completeScroll() {
        this.isScrolling = false
        this.finishScrollTO = null
        const dtb = this.panelDataGrid?.nativeElement
        if(dtb){
            const lfs = this.dataTableService.listenForScroll()
            this.execVertScrollUp(this.columns, this.columns.length, dtb.scrollTop, true)
            this.execHorizScroll(dtb.scrollLeft)
            if(lfs && this.rows.some( r => r.height !== this.dataTableService.defltRHgt))
                this.setAllRowsDefHgt()
            if(!lfs)
                timer(0).subscribe(() => {this.dataTableService.listenForScroll.set(true) });
        }
    }

  handleScroll(event: any) {
    const top = event.target.scrollTop
    const left = event.target.scrollLeft
    /*horiz scroll*/
    this.execHorizScroll(left)
    /*horiz scroll*/
    /*vert scroll*/
    if(top === this.verticalRest || !this.dataTableService.listenForScroll())
        return this.setRowNumPlacement();
    this.isScrolling = true
    this.execVertScroll(top)
    if(this.finishScrollTO)
        this.finishScrollTO.unsubscribe()
    this.finishScrollTO = timer(100).subscribe( () => { this.completeScroll() })  
    /*vert scroll*/
  }

  execHorizScroll(left: number, reverse?: boolean) {
    this.setColsOnVisScreen()
    if(reverse || left !== this.horizRest()){
      this.execHorizBodyScroll()
      this.horizPos.emit(left)
      this.setColsOnVisScreen()
    }
 }

    fixRowContainer(transY: number) {
        this.transY.set(transY);
    }

    execVertScroll(top: number) {
        if(top >= this.verticalRest){
            this.scrollDir = "down"
            this.execVertScrollDown(this.columns, this.columns.length, top)
        } else {//scrolling back up
            this.scrollDir = "up"
            this.execVertScrollUp(this.columns, this.columns.length, top)
        }
        this.verticalRest = top
    }

    handleScrollEnd(): any {
        this.fixRowContainer(0)
        this.isScrolling = false
        timer(0).subscribe( () => { 
            this.setColsOnVisScreen()
            this.setRowNumPlacement()
            timer(0).subscribe( () => { 
                this.cleanUpPossibles(); 
                if(this.cleanAbvTO)
                    this.cleanAbvTO.unsubscribe()
                this.cleanAbvTO = timer(5).subscribe( () => {this.cleanAbove()})
            })
        })
    }

    cleanAbvTO: Subscription|null = null;

    cleanAbove() {
        const abv = this.aboveArea.nativeElement
        const head = document.getElementsByClassName("row-group-panel-" + this.elifyGrouping)[0]
        const diff = (abv?.getBoundingClientRect().bottom || 0) - (head?.getBoundingClientRect().bottom || 0);
        if(diff > 3/**top margin */ && this.transY() === 0){
            this.aboveHgt.set(this.aboveHgt() - diff);
            this.setRowNumPlacement()
            this.setLastRowIndex()
        }
    }

  addCell(text: any, prop: string, visible: boolean): DataCell {
      const useProp = this.dataTableService.dataFilSrtTracker[prop]
      const notNum = (this.dataTableService.figureFilterType(prop) != "number" || /(year|yr|fy)/g.test(prop.toLocaleLowerCase())) ? true : false
      const useTxt = this.dataTableService.figureCellText(text, notNum, useProp["colCellSymbol"])
      const colStyle = this.dataTableService.getColumnStyle(prop)
      return {
          column: prop,
          rawText: text,
          visible: visible,
          editable: false,
          dataType: this.dataTableService.figureFilterType(prop),
          freeze: useProp.freeze,
          minimized: useProp.minimize,
          width: useProp.colWidth,
          text: useTxt.prop === "textContent" ? useTxt.value : "",
          html: useTxt.prop !== "textContent" ? useTxt.value : "",
          specialColClass: (colStyle ? (colStyle + this.common.elifyCol(useTxt.value)) : ""),
      }
  }

  setCellsOnVertScroll(text: string, prop: string, row: DataRow, vis: boolean) {
        const useProp = this.dataTableService.dataFilSrtTracker[prop]
        const notNum = (this.dataTableService.figureFilterType(prop) != "number" || /(year|yr|fy)/g.test(prop.toLocaleLowerCase())) ? true : false
        const useTxt = this.dataTableService.figureCellText(text, notNum, useProp["colCellSymbol"])
        const colStyle = this.dataTableService.getColumnStyle(prop)
        row.cells = row.cells?.map( c => {
            if(c.column === prop){
                c.visible = vis;
                c.rawText = text
                c.specialColClass = (colStyle ? (colStyle + this.common.elifyCol(useTxt.value)) : "");
                c.text = useTxt.prop === "textContent" ? useTxt.value : "";
                c.html = useTxt.prop !== "textContent" ? useTxt.value : "";
                return c
            }
            return c
        })
    }

      execHorizBodyScroll() {
        let i = 0;
        const clen = this.columns.length
        const rlen = this.rows.length
        let positions: any = []
        const row0 = this.rows[0]
        for(let p = (clen-1); p >= 0; p--){
            const col = this.columns[p]
            const elcol = this.common.elifyCol(col)
            const head = document.getElementById("columnHeader" + elcol)
            if(head){
                const bds = head.getBoundingClientRect()
                if(bds.left > this.dataTableService.tblRight)
                    continue
                const cell = row0?.cells?.find( c => c.column === col)
                if(cell){
                    if(!cell.visible && (this.dataTableService.visibleCols.includes(col) || (bds.left >= (this.dataTableService.tblLeft) && bds.right < (this.dataTableService.tblRight))))//visible
                        positions.push({ col: col, vis: true })
                    if(cell.visible && !this.dataTableService.visibleCols.includes(col) && !positions.find( (p: any) => p.col === col))
                        positions.push({ col: col, vis: false })
                }
            }
        }
        const plen = positions.length
        for(i; i < rlen; i++){
            let c = 0
            const row = this.rows[i]
            for(c; c < plen; c++){
                const pos = positions[c]
                if(pos){
                    if(pos.vis){
                        row.cells = row.cells?.map( c => {
                            if(c.column === pos.col)
                                return this.addCell(c.rawText, pos.col, true)
                            return c
                        })
                    } else {
                        const rCell: DataCell | undefined = row.cells?.find( c => c.column === pos.col)
                        if(rCell){
                            rCell.visible = false
                        }
                    }
                }
            }
        }
                timer(50).subscribe( () => { 
                    this.dataTableService.setIdealColumnWidth.next(true); 
                    this.setColsOnVisScreen() 
                    timer(50).subscribe( () => { this.cleanUpPossibles() })
                })
    }

    cleanUpPossibles() {
        let i = 0
        const len = this.rows.length
        for(i; i < len; i++){
            const row = this.rows[i]
            if(row){
                let p = 0
                if(row.cells?.length){
                    const rclen = row.cells.length
                    for(p; p < rclen; p++){
                        const cell = row.cells[p]
                        if(cell){
                            const ccol = cell.column
                            const el = document.querySelector("#panelDataGrid" + this.elifyGrouping + " #" + row.id + " .data-cell-" + this.common.elifyCol(ccol))
                            if((el && el.getBoundingClientRect().right < this.dataTableService.tblLeft) && (!el?.innerHTML || !el.getAttribute("style"))){
                                row.cells[p].visible = true
                                row.cells[p] = {...this.addCell(cell.rawText, ccol, true)}
                            }
                        }
                    }
                }
            }
        }
    }

  applyToDomRows(rows: any[], rnums: number[], cols: string[], colLen: number, lastVisInd: number, dir: string, defNum: number, newRows: number, force?: boolean) {
        const len = this.rows.length
        let nrowsAcctFor = 0
        if(dir === "down"){
            let i = 0;
            let ahToAdd: number = 0;
            let bhToSub: number = 0;
            for(i; i < len; i++){
                const row = this.rows[i]//move the top x num of dom rows to the bottom
                const vrow = rows[i]//{index: index, data: item}
                if(vrow && vrow.index !== row.index){
                    const index = vrow.index
                    const doIt = index > -1;
                    if(doIt){
                        for(let k = (colLen-1); k >= 0; k--){
                            const col = cols[k]
                            if(col)
                                this.setCellsOnVertScroll(vrow.data[col], col, row, (k <= lastVisInd))//prepend
                        }
                    }
                    if(nrowsAcctFor < newRows){
                        ahToAdd += defNum
                        bhToSub += defNum
                    }
                    if(doIt){
                        row.id = this.dtr + index
                        row.index = index
                    }
                    nrowsAcctFor++;
                }
            }
            if(ahToAdd)
                this.aboveHgt.set((this.aboveHgt() + ahToAdd))
            if(bhToSub)
                this.belowHgt.set(Math.max(0, (this.belowHgt() - bhToSub)))
        } else {
            let v = 0
            const ulen = (len-1)
            let ahToSub: number = 0;
            let bhToAdd: number = 0;
            for(var o = ulen; o >= 0; o--){
                const row = this.rows[o]
                const vrow = rows[v]//{index: index, data: item}
                if(vrow && vrow.index !== row.index){
                    const index = vrow.index
                    const doIt = index > -1;
                    if(doIt){
                        for(let k = (colLen-1); k >= 0; k--){
                            const col = cols[k]
                            if(col)
                                this.setCellsOnVertScroll(vrow.data[col], col, row, (k <= lastVisInd))//prepend
                        }
                    }
                    if(nrowsAcctFor < newRows){
                        ahToSub += defNum;
                        bhToAdd += defNum
                    }
                    if(doIt){
                        row.id = this.dtr + index
                        row.index = index
                    }
                    nrowsAcctFor++;
                }
                v++
            }
            if(ahToSub)
                this.aboveHgt.set(Math.max(0, (this.aboveHgt() - ahToSub)))
            if(bhToAdd)
                this.belowHgt.set((this.belowHgt() + bhToAdd))
        }
        this.rowNums = [...rnums]
        this.finishApplyingDomRows(force)
    }

    getLastRowBot(): number {
        const els = document.getElementsByClassName("rows-for-" + this.elifyGrouping)
        return els[els.length-1]?.getBoundingClientRect()?.bottom || this.tblBot;
    }

    execVertScrollDown(cols: string[], colLen: number, currTop: number, force?: boolean) {
        let gap = this.tblBot - this.getLastRowBot();
        this.fixRowContainer(gap)
        timer(0).subscribe( () => {
            let h = 0
            let rows = []
            let canAdd = 0
            const maxRows = this.rows.length
            const doRows = force || (!this.isScrolling && (gap == 0 || !this.dataTableService.mouseIsDown)) || currTop%this.doRowsMod === 0;
            const bel = this.belowArea.nativeElement
            const bbds = bel.getBoundingClientRect()
            const btop = bbds.top - gap
            const defNum = this.dataTableService.defltRHgtNum
            let z = this.lastElRowIndex + 1
            let bhToSub = 0
            let ahToAdd = 0
            let numsToAdd: number[] = []
            const rowsInGap = Math.ceil(gap/defNum)
            canAdd = z+rowsInGap
            const goTo = Math.min(this.panelData.length, canAdd)
            for(z; z < goTo; z++){
                const wldBeElTop = btop + (defNum*h);
                const wldBeElBot = wldBeElTop+defNum
                if(wldBeElBot < this.tblTop){
                    ahToAdd += defNum
                    bhToSub += defNum
                } else {
                    if(wldBeElTop <= this.tblBot){
                        const item = this.panelData[z]
                        const index = this.dataTableService.currMapping[z] || (doRows ? this.dataTableService.findObjIndxInData(item) : -1)
                        if(rows.length < maxRows)
                            rows.push({index: index, data: item, elInd: z})
                    }
                }
                h += 1
            }
            if(bhToSub)
                this.belowHgt.set(Math.max(0, (this.belowHgt() - bhToSub)))
            if(ahToAdd)
                this.aboveHgt.set((this.aboveHgt() + ahToAdd))
            const repl = [...rows].length;//only new rows
            const needsToFill = maxRows-repl;
            if(needsToFill){
                let f = !rows.length ? this.lastElRowIndex : (rows[0].elInd-1);
                let fgoto = f-needsToFill;
                for(f; f > fgoto; f--){
                    const item = this.panelData[f]
                    const index = this.dataTableService.currMapping[f] || (doRows ? this.dataTableService.findObjIndxInData(item) : -1);
                    rows.unshift({index: index, data: item, elInd: f})
                }
            }
            numsToAdd = rows.map( r => (r.elInd+1))
            const vlen = this.dataTableService.visibleCols.length
            const lastVisInd = cols.indexOf(this.dataTableService.visibleCols[(vlen-1)]) + 1
            this.applyToDomRows(rows, numsToAdd, cols, colLen, lastVisInd, "down", defNum, repl)
        })
    }

    getFirstRowTop(): number {
        return document.getElementsByClassName("rows-for-" + this.elifyGrouping)[0]?.getBoundingClientRect().top || this.tblTop;
    }

    execVertScrollUp(cols: string[], colLen: number, currTop: number, force?: boolean) {
        let gap = this.getFirstRowTop() - this.tblTop;
        this.fixRowContainer(-gap)
        timer(0).subscribe( () => {
            let h = 0
            let rows = []
            const ael = this.aboveArea.nativeElement
            const abds = ael.getBoundingClientRect()
            const rbot = abds.bottom + gap;
            const maxRows = this.rows.length
            const defNum = this.dataTableService.defltRHgtNum
            let z = (this.lastElRowIndex - maxRows)
            let bhToAdd = 0
            let ahToSub = 0
            let numsToAdd: number[] = []
            const doRows = force || (!this.isScrolling && (gap == 0 || !this.dataTableService.mouseIsDown)) || currTop%this.doRowsMod === 0;
            const rowsInGap = Math.ceil(gap/defNum)
            const min = Math.max(0, (z-rowsInGap))
            for(z; z >= min; z--){
                const wldBeElBot = rbot - (defNum*h);
                const wldBeElTop = wldBeElBot-defNum
                if(wldBeElTop > this.tblBot){
                    bhToAdd += defNum
                    ahToSub += defNum
                } else {
                    if(wldBeElBot > this.tblTop){
                        const item = this.panelData[z]
                        const index = this.dataTableService.currMapping[z] || (doRows ? this.dataTableService.findObjIndxInData(item) : -1)
                        if(rows.length < maxRows)
                            rows.push({index: index, data: item, elInd: z})
                    }
                }
                h += 1
            }
            if(ahToSub)
                this.aboveHgt.set(Math.max(0, (this.aboveHgt() - ahToSub)))
            if(bhToAdd)
                this.belowHgt.set((this.belowHgt() + bhToAdd))
            const repl = [...rows].length;//only new rows
            const needsToFill = maxRows-repl;
            if(needsToFill){
                let f = (!rows.length ? (this.lastElRowIndex - maxRows) : rows[0].elInd)+1;
                let fgoto = f+needsToFill;
                for(f; f < fgoto; f++){
                    const item = this.panelData[f]
                    const index = this.dataTableService.currMapping[f] || (doRows ? this.dataTableService.findObjIndxInData(item) : -1);
                    rows.unshift({index: index, data: item, elInd: f})
                }
            }
            numsToAdd = rows.map( r => (r.elInd+1)).sort((a, b) => a - b)
            const vlen = this.dataTableService.visibleCols.length
            const lastVisInd = cols.indexOf(this.dataTableService.visibleCols[(vlen-1)]) + 1;
            this.applyToDomRows(rows, numsToAdd, cols, colLen, lastVisInd, "up", defNum, repl, force)
        })
    }

    finishApplyingDomRows(force?: boolean) {
        this.fixRowContainer(0)
        this.setRowNumPlacement()
        this.setLastRowIndex()
        if(force && !this.isScrolling){
            this.handleScrollEnd()
        }
    }

//   execCellEdit(event: any) {//{ element: el, column: this.cell.column, value: val }
//     this.cellEdit.emit(event)
//   }

  setSingleRowHgt(val: any, row?: any, force?: boolean) {
      if(val && typeof val === "string")
          val = Math.ceil(parseInt(val))
      const rHgt = val
      const useHgt = Math.floor(rHgt) + "px";
      if(force || (typeof row === "string" && this.tblDragService.colDragStartFrmCellTracker.row && this.tblDragService.colDragStartFrmCellTracker.ystart)){
          const drow = this.rows.find( r => r.id === row)
          if(drow)
              drow.height = useHgt
      }
      timer(0).subscribe( () => { this.setRowNumPlacement() })
  }


}
