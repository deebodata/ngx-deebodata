import { Component, ElementRef, Input, Output, ViewChild, EventEmitter, SimpleChanges, HostListener, input, signal, ChangeDetectorRef } from '@angular/core';
import { CommonService } from '../../../services/common-service';
import { CommonModule, DecimalPipe } from '@angular/common';
import { DataTableService } from '../../../services/data-table-service';
import { DataRow } from '../../../interfaces/data-row';
import { DataCellComponent } from '../data-cell/data-cell';
import { DataCell } from '../../../interfaces/data-cell';
import { TableDragService } from '../../../services/table-drag-service';

@Component({
  selector: 'app-row-group-panel',
  imports: [CommonModule, DecimalPipe, DataCellComponent],
  templateUrl: './row-group-panel.html',
  styleUrls: ['./row-group-panel.css', '../../../styles.css']
})
export class RowGroupPanel {

  @HostListener('window:mouseup', ['$event'])
  onWindowMouseUp(e: MouseEvent) {
      if(this.open()){
        setTimeout( () => { 
            const pEl = this.panelDataGrid?.nativeElement
            if(pEl){
                pEl.scrollBy(0, 1);
                pEl.scrollBy(0, -1);
            }
        } )
      }
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
  aboveHgt: number = 0;
  belowHgt: number = 0;
  rowNums: number[] = []
  changedIds: string[] = []
  scrollDir: string = "down"
  lastElRowIndex: number = 0;
  horizRest = input<number>(0)
  colOfInt = input<string>("")
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
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if(!this.init && this.open() && changes){
      if(changes["horizRest"]?.currentValue)
        this.setHorizScrPos()
    }
  }

  ngOnInit() {
    this.uiGroupValue = this.common.titleCase(this.groupValue)
    this.elifyGrouping = this.common.elifyCol(this.groupValue)
    this.count = this.dataTableService.currFilData.filter( d => d[this.dataTableService.currGroup] === this.groupValue).length
    this.dataTableService.gridScrollEndWhileGrouped.subscribe( e => { this.setTblBot() })
    this.dataTableService.gridEventWhileGrouped.subscribe( e => { 
      const nowOpen = this.open()
      this.rows = []
      this.panelData = []
      this.open.set(false) 
      this.rowNums = []
      this.count = this.dataTableService.currFilData.filter( d => d[this.dataTableService.currGroup] === this.groupValue).length
      if(nowOpen)
        setTimeout( () => { this.openGroup() })
    })//just close
    this.dataTableService.mouseupWhileGrouped.subscribe( e => {
        if(this.open()){
          setTimeout( () => { 
            const pEl = this.panelDataGrid?.nativeElement
            if(pEl){
                pEl.scrollBy(0, 1);
                pEl.scrollBy(0, -1);
            }
          } )
        }
    })
    this.init = false;
  }

  openGroup() {
    this.open.set(!this.open())
    setTimeout( () => {
        if(!this.open()){
          this.rows = []
          this.panelData = []
          this.aboveHgt = 0;
          this.belowHgt = 0;
          this.rowNums = []
        } else {
          this.panelData = this.dataTableService.currFilData.filter( d => d[this.dataTableService.currGroup] === this.groupValue)
          this.count = this.panelData.length
          let n = 0
          const defNum = parseInt(this.dataTableService.defltRHgt.replace(/[ ]?px/g, ""))
          const init = Math.max(this.dataTableService.dTblHeight/defNum);
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
          for(n; n < limit; n++){
            const item = this.panelData[n]
            const index = this.dataTableService.currMapping[n] || this.dataTableService.findObjIndxInData(item)
            if(index > -1){
              this.rows.push({ id: "dataTableRow" + index, index: index, width: this.useRowWid, cells: [], height: this.dataTableService.defltRHgt })
              let k = 0
              for(k; k < colLen; k++){
                const col = this.columns?.[k]
                if(col)
                    addCell(item[col], col, this.rows[n], (k <= horizLim))
              }
            }
          }
          this.setLastRowIndex()
          setTimeout( () => { 
              this.setRowNums()
              if(this.count > init){
                  let total = 0
                  let z = this.lastElRowIndex + 1
                  for(z; z < this.count; z++)
                    total += 1
                  this.belowHgt = total*defNum
              }
              this.setHorizScrPos()
              this.openEvt.emit("row-group-panel-" + this.elifyGrouping)
              setTimeout( () => { 
                this.setTblBot(); 
                const pEl = this.panelDataGrid?.nativeElement
                if(pEl){
                    pEl.scrollBy(1, 1);
                    pEl.scrollBy(0, -1);
                }
                this.setRowNumPlacement()
                this._cd.detectChanges()
              })
            }, 250)
          }
        })
    }

  setTblBot() {
    if(this.panelDataGrid)
      this.tblBot = (this.panelDataGrid.nativeElement.getBoundingClientRect().bottom || 0)// + 250
    const panelTop = document.getElementsByClassName("row-group-panel-" + this.elifyGrouping)[0]
    if(panelTop)
      this.tblTop = (panelTop.getBoundingClientRect().bottom || 0)// - 200
    setTimeout( () => { this.setRowNumPlacement() })
  }
    
  setHorizScrPos() {
      const body = this.panelDataGrid?.nativeElement
      if(body)
        body.scrollLeft = this.horizRest()
  }

  setLastRowIndex() {
      const realMax = this.panelData.length - 1
      const defNum = parseInt(this.dataTableService.defltRHgt.replace(/[ ]?px/g, ""))
      const wannabeMax = (this.rows.length - 1) + Math.floor(this.aboveHgt/defNum)
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
                            num.style.top = top + "px"
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

  handleScroll(event: any) {
    const top = event.target.scrollTop
    const left = event.target.scrollLeft
    /*horiz scroll*/
    requestAnimationFrame( () => { this.execHorizScroll(left) })
    /*horiz scroll*/
    /*vert scroll*/
    if(top === this.verticalRest){
        this.isScrolling = false
        return this.setRowNumPlacement();
    }
    this.isScrolling = true
    requestAnimationFrame( () => { this.execVertScroll(top) })
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

    execVertScroll(top: number) {
        if(top >= this.verticalRest){
            this.execVertScrollDown(this.columns, this.columns.length)
            this.clearAboveFoldRows()
            this.scrollDir = "down"
        } else {//scrolling back up
            this.execVertScrollUp(this.columns, this.columns.length)
            this.clearBelowFoldRows()
            this.scrollDir = "up"
        }
        this.verticalRest = top
        this.setRowNumPlacement()
    }

    handleScrollEnd(): any {
        this.isScrolling = false
        setTimeout( () => { 
            this.setColsOnVisScreen()
            this.setRowNumPlacement()
            setTimeout( () => { this.cleanUpPossibles(); this._cd.detectChanges() })
        })
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
                setTimeout( () => { 
                    this.dataTableService.setIdealColumnWidth.next(true); 
                    this.setColsOnVisScreen() 
                    setTimeout( () => { this.cleanUpPossibles() }, 100)
                }, 50)
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

  execVertScrollDown(cols: string[], colLen: number) {
        let canAdd = 0
        const vlen = this.dataTableService.visibleCols.length
        const lastVisInd = this.columns.indexOf(this.dataTableService.visibleCols[(vlen-1)]) + 1
        const bel = this.belowArea?.nativeElement
        const bbds = bel?.getBoundingClientRect()
        if(!bbds)
            return
        const rTop = (bbds?.top - this.verticalRest)
        const gap = this.tblBot - rTop
        const defNum = parseInt(this.dataTableService.defltRHgt.replace(/[ ]?px/g, ""))
        if(gap > 0){
            let h = 0
            let z = this.lastElRowIndex + 1
            const last = <HTMLElement>document.querySelector("#panelDataGrid" + this.elifyGrouping + " #dataTableRow" + this.lastElRowIndex)
            if(last && this.dataTableService.elIsBelowFold(last, this.tblBot))
                return;
            let bhToSub = 0
            let ahToAdd = 0
            const rowsInGap = Math.ceil(gap/defNum)
            canAdd = z+(rowsInGap)
            let numsToAdd: number[] = []
            let rowsToAdd: DataRow[] = []
            const goTo = Math.min(this.panelData.length, canAdd)
            for(z; z < goTo; z++){
                const wldBeElTop = bbds.top + (defNum*h);
                const wldBeElBot = wldBeElTop+defNum
                if(wldBeElBot < this.tblTop){
                    ahToAdd += defNum
                    bhToSub += defNum
                } else {
                    if(wldBeElTop <= this.tblBot){
                        const item = this.panelData[z]
                        const index = this.dataTableService.currMapping[z] || this.dataTableService.findObjIndxInData(item)
                        if(index > -1 && !this.rows.find( r => r.index === index)){
                            const nRow: DataRow = { id: "dataTableRow" + index, index: index, width: this.useRowWid, cells: [], height: this.dataTableService.defltRHgt }
                            let k = 0
                            let cells: DataCell[] = []
                            for(k; k < colLen; k++){
                                const col = cols[k]
                                const cell = this.addCell(item[col], col, (k <= lastVisInd))
                                if(typeof cell !== "string")
                                    cells.push(cell)
                            }
                            nRow.cells = [...cells]
                            rowsToAdd.push(nRow)
                            numsToAdd.push((z+1))//just do it
                            bhToSub += defNum
                        }
                    }
                }
                h += 1
            }
            if(rowsToAdd.length)
                this.rows = [...this.rows, ...rowsToAdd]
            if(bhToSub)
                this.belowHgt -= bhToSub
            if(this.showRowNumbers)
                this.rowNums = [...this.rowNums, ...numsToAdd]
            if(ahToAdd)
                this.aboveHgt += ahToAdd
            this.setLastRowIndex()
        }
  }

  execVertScrollUp(cols: string[], colLen: number) {
        const vlen = this.dataTableService.visibleCols.length
        const lastVisInd = this.columns.indexOf(this.dataTableService.visibleCols[(vlen-1)]) + 1;
        const ael = this.aboveArea?.nativeElement
        const abds = ael?.getBoundingClientRect()
        const defNum = parseInt(this.dataTableService.defltRHgt.replace(/[ ]?px/g, ""))
        const rbot = abds?.bottom || 0
        const gap = rbot - this.tblTop
        if(gap > 0){
            let h = 0
            const rlen = this.rows.length
            let z = (this.lastElRowIndex - rlen)
            if(z < 0)
                return
            let bhToAdd = 0
            let ahToSub = 0
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
                        const index = this.dataTableService.currMapping[z] || this.dataTableService.findObjIndxInData(item)
                        if(index > -1){
                            let k = 0
                            const nRow: DataRow = { id: "dataTableRow" + index, index: index, width: this.useRowWid, cells: [], height: this.dataTableService.defltRHgt }
                            let cells: DataCell[] = []
                            for(k; k < colLen; k++){
                                const col = cols[k]
                                const cell = this.addCell(item[col], col, (k <= lastVisInd))
                                if(typeof cell !== "string")
                                    cells.push(cell)
                            }
                            nRow.cells = [...cells]
                            this.rows = [nRow, ...this.rows]
                            if(this.showRowNumbers)
                                this.rowNums = [(z+1), ...this.rowNums]
                            ahToSub += defNum
                        }
                    }
                }
                h += 1
            }
            if(ahToSub){
                this.aboveHgt -= ahToSub
            }
            if(bhToAdd)
                this.belowHgt += bhToAdd
        }
  }

  clearAboveFoldRows() {
        const els = this.rows.filter( r => this.dataTableService.elIsAboveFold(document.getElementById(r.id), this.tblTop))
        const justids = els.map( e => e.id)
        const changes = justids.length
        if(changes > 0){
            const justindx = els.map( (e, i) => i)
            const defNum = parseInt(this.dataTableService.defltRHgt.replace(/[ ]?px/g, ""))
            this.rows = this.rows.filter( r => !justids.includes(r.id))
            if(this.showRowNumbers)
                this.rowNums = this.rowNums.filter( (c, i) => !justindx.includes(i))
            const item = this.dataTableService.mainData[(this.rows[0]?.index || -1)]
            if(item)
                this.aboveHgt = this.dataTableService.findObjIndxInData(item, this.panelData)*defNum
        }
    }

    clearBelowFoldRows() {
        const els = this.rows.filter( r => this.dataTableService.elIsBelowFold(document.getElementById(r.id), this.tblBot))
        const justids = els.map( e => e.id)
        let changes = justids.length
        if(changes > 0){
            const defNum = parseInt(this.dataTableService.defltRHgt.replace(/[ ]?px/g, ""))
            this.rows = this.rows.filter( r => !justids.includes(r.id))
            if(this.showRowNumbers){
                for(let p = (changes-1); p >= 0; p--)
                    this.rowNums.pop()
            }
            const rlen = this.rows.length
            const item = this.dataTableService.mainData[(this.rows[(rlen-1)]?.index || -1)]
            if(item)
                this.belowHgt = ((this.panelData.length-1)-this.dataTableService.findObjIndxInData(item, this.panelData))*defNum
            this.setLastRowIndex()
        }
    }

//   execCellEdit(event: any) {//{ element: el, column: this.cell.column, value: val }
//     this.cellEdit.emit(event)
//   }

  setSingleRowHgt(val: any, row?: any) {
      if(val && typeof val === "string")
          val = Math.ceil(parseInt(val))
      const rHgt = val
      const useHgt = Math.floor(rHgt) + "px";
      if(typeof row === "string" && this.tblDragService.colDragStartFrmCellTracker.row && this.tblDragService.colDragStartFrmCellTracker.ystart){
          const drow = this.rows.find( r => r.id === row)
          if(drow)
              drow.height = useHgt
      }
      setTimeout( () => { this.setRowNumPlacement() })
  }


}
