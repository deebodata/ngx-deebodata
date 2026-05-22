import { Component, ElementRef, EventEmitter, Input, Output, signal, ViewChild } from '@angular/core';
import { CommonService } from '../../../services/common-service';
import { DataTableService } from '../../../services/data-table-service';
import { ColumnChart } from '../column-chart/column-chart';
import { LineGraphComponent } from '../line-graph-component/line-graph-component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-charts-and-graphs',
  imports: [ CommonModule, ColumnChart, LineGraphComponent, ],
  templateUrl: './charts-and-graphs.html',
  styleUrls: ['./charts-and-graphs.css', '../../../styles.css']
})
export class ChartsAndGraphs {

  chartsReady = signal<boolean>(false);
  rowIsAboveFold = signal<number[]>([0]);
  useData: any[] = []
  iRows: any[][] = []
  dtCols: string[] = [];
  numCols: string[] = [];
  filterInfo: string = ""
  currNumColData: any = {}//[] = []
  currNumColNm: any = {}//string = ""
  okBarGraphs: string[] = []
  okLineGraphs: string[] = []
  hasNoData: string[] = []
  @Input() height: string = "";
  @Input() state: string = "all";
  @Input() chartColumns: string[] = [];
  @Output("close") close: EventEmitter<boolean> = new EventEmitter();
  @ViewChild("xChartsBtn", { static: true }) xChartsBtn!: ElementRef<HTMLButtonElement>;
  @ViewChild("chartsTitle", { static: true }) chartsTitle!: ElementRef<HTMLHeadElement>;
  @ViewChild("chartContain", { static: true }) chartContain!: ElementRef<HTMLElement>;
  h2Text: string = "" 

  constructor(public common: CommonService,
              public dataTableService: DataTableService,){ }

  ngOnInit() {
    if(this.state === "selected")
        this.useData = this.dataTableService.mainData.filter( (d, ind) => this.dataTableService.currSelRows.indexOf(ind) > -1 )
    else
        this.useData = this.dataTableService.currFilData//.filter( d => true )
    this.gatherRelationalPairs()
    const dLen = this.useData.length
    let filinfo = this.dataTableService.getAllFilSrtInfo()?.replace(/Filtered By:/g, "filtered by").
                      replace(/ \&bull; Sorted By/g, ", Sorted By").replace(/ \&bull; /g, " ")
    this.h2Text = "Data Insights for <b>"+ dLen.toLocaleString(undefined, {maximumFractionDigits: 0}) + "</b>" +
    (this.state !== 'all' ? (' ' + this.common.titleCase(this.state)) : '') +" Rows ";
    if(filinfo){
      this.h2Text = ("Data Insights " + ("for <b>" + (dLen).toLocaleString(undefined, {maximumFractionDigits:0}) + 
                    "</b> row" + (dLen === 1 ? " " : "s ")) + filinfo?.split(", Sorted By")[0].trim())
    }
  }

  ngAfterContentInit() {
    setTimeout( () => { 
      let r = 0; let c = 0; let u = 0; let o = 0
      let useChartCols: string[] = [];
      const usableCharts = this.chartColumns.filter( c => !this.hasNoData.includes(c))
      const uclen = usableCharts.length
      const nlen = this.numCols.length
      for(u; u < uclen; u++){
        const ucol = usableCharts[u]
        useChartCols.push(ucol)
        if(this.okBarGraphs.indexOf(ucol) > -1){
          for(o; o < nlen; o++)
            useChartCols.push(ucol + this.dataTableService.bgSep + this.numCols[o])
          o = 0;
        }
        if(this.okLineGraphs.indexOf(ucol) > -1){
          o = 0; let d = 0;
          const dtlen = this.dtCols.length
          for(o; o < nlen; o++){
            for(d; d < dtlen; d++)
              useChartCols.push(ucol + this.dataTableService.bgSep + this.numCols[o] + this.dataTableService.bgSep + this.dtCols[d])
            d = 0;
          }
          o = 0;
        }
      }
      const clen = useChartCols.length
      const cWid = this.chartContain.nativeElement.getBoundingClientRect().width
      const insightColsPerRow = cWid < 640 ? 1 : (cWid < 960 ? 2 : 3);
      const rlen = Math.ceil(clen/insightColsPerRow)
      for(r; r < rlen; r++){
        let i = 0
        this.iRows[r] = []
        for(i; i < insightColsPerRow; i++){
          const col = useChartCols[c]
          if(col){
            let title = this.common.titleCase(col)
            let mappedData: any[] = []
            const reg = new RegExp(this.dataTableService.bgSep, "g")
            if(reg.test(col)){
              const bgCols = col.split(this.dataTableService.bgSep)
              const strCol = bgCols[0]
              const numCol = bgCols[1]
              let dtCol
              if(bgCols.length === 3)//line graph
                dtCol = bgCols[2]
              if(!dtCol){//bar graph
                const valsLen = this.dataTableService.dataFilSrtTracker[strCol]?.selDDVals?.filter( (g: any) => g.value !== "(Select All)").length || 0;
                const doAvg = this.useData.length <= valsLen ? "" : "Avg ";
                title = doAvg + this.common.titleCase(numCol) + " by " + this.common.titleCase(strCol);
                mappedData = this.useData.filter( d => d[numCol] === 0 || !!d[numCol]).map( d => ({strColumn: (d[strCol] || "N/A"), numColumn: d[numCol]}))
              } else {//line graph
                title = "Avg " + this.common.titleCase(numCol) + " by " + this.common.titleCase(dtCol);
                mappedData = this.useData.filter( d => d[numCol] === 0 || !!d[numCol]).map( d => ({strColumn: (d[strCol] || "N/A"), numColumn: d[numCol], dtColumn: d[dtCol]}))
              }
            } else {
              if(this.dtCols.indexOf(col) > -1){
                const n0 = this.numCols[0]
                title = "Avg " + this.common.titleCase(n0) + " by " + this.common.titleCase(col);
                mappedData = this.useData.filter( d => d[n0] === 0 || !!d[n0]).map( d => ({numColumn: d[n0], dtColumn: d[col]}))
              } else {
                mappedData = this.useData.map( d => d[col] )
              }
            }
            this.iRows[r].push({ column: col, data: mappedData, title: title })
            c += 1
          }
        }
      }
      setTimeout( () => { this.chartsReady.set(true) })
    })
  }

  handleChartScroll(event: any) {
    let abv: number[] = []
    const xBtn= this.xChartsBtn.nativeElement
    const top = event.target.scrollTop
    const rows = document.getElementsByClassName("insight-field-row")
    const rlen = rows.length
    if(xBtn)
      xBtn.style.top = (7 + top) + "px"
    for(var i = (rlen-1); i >= 0; i--){
      const row: HTMLElement = <HTMLElement>rows[i]
      if(this.dataTableService.elIsAboveFold(row, this.dataTableService.tblBot) && !abv.includes(i) && !this.rowIsAboveFold().includes(i))
        abv.push(i)
    }
    this.rowIsAboveFold.set([...this.rowIsAboveFold(), ...abv])
  }

  

  gatherRelationalPairs() {//dot plots and bar graphs
      let i = 0;
      const len = this.chartColumns.length
      for(i; i < len; i++){
        const col = this.chartColumns[i]
        const colData = this.useData.map( (d) => d[col] )
        if(colData.every( (d: any) => !d )){
          this.hasNoData.push(col)
          continue;
        }
        const yearCol = /(year|yr|fy)/g.test(col?.toLocaleLowerCase())
        const allNumData = colData.every( (d: any) => !d || (d && typeof d === "number") )
        let bitData;
        if(allNumData)
            bitData = colData.every( (d: any) => !d || d === 1 || d === 0 )
        if(allNumData && !yearCol && !bitData){//num data
            this.numCols.push(col);
        } else {
            const dSet =new Set(colData)
            let arrFrmSet: any = []
            dSet.forEach( (v) => arrFrmSet.push(v) )
            const dateData = (colData.every( (d: any) => !d || this.common.isADateObject(d)) && !colData.every( (d: any) => !d ))
            if(dateData || yearCol)
                this.dtCols.push(col)
        }
      }

      if(this.numCols.length){
        for(const prop in this.dataTableService.dataFilSrtTracker){
          const trkr = this.dataTableService.dataFilSrtTracker[prop]
          if(trkr && trkr.selDDVals){
            this.okBarGraphs.push(prop)
            if(this.dtCols.length)
              this.okLineGraphs.push(prop)
          }
        }
      }

      const dtlen = this.dtCols.length
      if(dtlen && this.numCols.length && typeof document.querySelectorAll === "function"){
          let c = 0
          for(c; c < dtlen; c++){
            const dcol = this.dtCols[c]
            this.currNumColNm[dcol] = this.numCols[0]
            this.currNumColData[dcol] = [1]//this.useData.filter( d => !!d).map( (d) => d[this.numCols[0]] )* this was for dot plot, but now we use line graph
          }
      }
  }

  setLineGraphNumCol(rowI: number, dtCol: string, col: string) {
    this.currNumColData[dtCol] = []
    setTimeout( () => { 
        this.currNumColNm[dtCol] = col
        const irow = this.iRows[rowI].find( i => i.column === dtCol)
        if(irow){
          this.iRows[rowI].find( i => i.column === dtCol).data = this.useData.filter( d => d[col] === 0 || !!d[col]).map( d => ({numColumn: d[col], dtColumn: d[dtCol]}))
          this.iRows[rowI].find( i => i.column === dtCol).title = "Avg " + this.common.titleCase(col) + " by " + this.common.titleCase(dtCol);
        }
        this.currNumColData[dtCol] = [1]//this.useData.filter( d => !!d).map( (d) => d[col] )* this was for dot plot, but now we use line graph 
    })
  }

  closeCharts() {
    this.close.emit(false)
  }
  
}
