import { Component, ElementRef, EventEmitter, Input, ViewChild, Output, HostListener, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonService } from '../../../services/common-service';
import { DataTableService } from '../../../services/data-table-service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-bar-graph-component',
  imports: [CommonModule],
  templateUrl: './bar-graph-component.html',
  styleUrls: ['./bar-graph-component.css', '../../../styles.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BarGraphComponent {

  @HostListener('window:resize', ['$event'])
  onWindowResize(e: Event) {
      this.handleStatChange(this.selStat(), true)
  }

  numTicks = signal<string[]>([])
  barVals: any[] = []
  xLblWidth: string= ""
  xLabels: string[] = []
  maxBarWid: number = 90
  maxYVal: string = "0";
  statData: any[] = []
  selStat = signal<string>("avg")
  numYPlots: number = 5
  bgDepVarHgt: number = 70//height of y ticks
  statOpts: string[] = ["avg", "min", "max", "mode", "median", "sum"]
  statBtnWid: string = "30px"
  titleTrail: string = ""
  @Input() column: string = ""
  @Input() data: any[] = []
  @Output("title") title: EventEmitter<string> = new EventEmitter();
  @ViewChild("innerGB", { static: true }) innerGB!: ElementRef;
  @ViewChild("xLabel", { static: true }) xLabel!: ElementRef;
  @ViewChild("xValues", { static: true }) xValues!: ElementRef;
  @ViewChild("yAxis", { static: true }) yAxis!: ElementRef;
  @ViewChild("statOptsCont", { static: true }) statOptsCont!: ElementRef;
  @ViewChild("barContainer", { static: true }) barContainer!: ElementRef;

  constructor(public common: CommonService,
              private dataTableService: DataTableService,
              private _cd: ChangeDetectorRef,
  ){ }

  ngOnInit() {
    this.buildBarGraphWithTwoCols(this.selStat())
  }

  sizeUpBgDims() {
    const bgWid = this.innerGB.nativeElement.getBoundingClientRect().width
    const yWid = this.yAxis.nativeElement.getBoundingClientRect().width
    const offY = Math.ceil(yWid+5)
    this.statBtnWid = Math.floor((bgWid-offY)/this.statOpts.length) + "px";
    this.statOptsCont.nativeElement.style.marginLeft = offY + "px";
    this.xValues.nativeElement.style.marginLeft = offY + "px";
    this.barContainer.nativeElement.style.marginLeft = offY + "px";
    this.xLblWidth = Math.min(this.maxBarWid, (Math.floor((bgWid-offY)/this.xLabels.length))) + "px";
  }

  buildBarGraphWithTwoCols(stat: string) {
      const bgCols = this.column.split(this.dataTableService.bgSep)
      const strCol = bgCols[0]
      const numCol = bgCols[1]
      if(!this.titleTrail)
        this.titleTrail = this.common.titleCase(numCol) + " by " + this.common.titleCase(strCol);
      const vals = this.dataTableService.dataFilSrtTracker[strCol].selDDVals.filter( (g: any) => g.value !== "(Select All)")
      const vlen = vals.length
      let o = 0
      for(o; o < vlen; o++){
        const val = vals[o].value
        const justVal = this.data.filter( d => d["strColumn"] === val).map( d => d["numColumn"] )
        const jvlen = justVal.length
        if(jvlen){//["avg", "min", "max", "mode", "median", "sum"]
          let statobj = {x: val, y: 0}
          if(stat === "avg")
            statobj.y = (justVal.reduce( (acc, curr) => (acc += curr) , 0)/jvlen)
          if(stat === "min")
            statobj.y = Math.min(...justVal)
          if(stat === "max")
            statobj.y = Math.max(...justVal)
          if(stat === "sum")
            statobj.y = (justVal.reduce( (acc, curr) => (acc += curr) , 0))
          if(stat === "median")
            statobj.y = this.findDataMedian(justVal, jvlen)
          if(stat === "mode")
            statobj.y = this.findDataMode(justVal)
          this.statData.push(statobj)
          this.xLabels.push(val)
        }
      }
      const justNull = this.data.filter( d => d["strColumn"] === "N/A").map( d => d["numColumn"] )
      const jlen = justNull.length
      if(jlen){
        let statobj = {x: "N/A", y: 0}
          if(stat === "avg")
            statobj.y = (justNull.reduce( (acc, curr) => (acc += curr) , 0)/jlen)
          if(stat === "min")
            statobj.y = Math.min(...justNull)
          if(stat === "max")
            statobj.y = Math.max(...justNull)
          if(stat === "sum")
            statobj.y = (justNull.reduce( (acc, curr) => (acc += curr) , 0))
          if(stat === "median")
            statobj.y = this.findDataMedian(justNull, jlen)
          if(stat === "mode")
            statobj.y = this.findDataMode(justNull)
        this.statData.push(statobj)
        this.xLabels.push("N/A")
      }
      const par = this.innerGB.nativeElement
      const nums = this.statData.map( d =>  d["y"] );
      let srtNums = nums.sort( (a, b) => a - b > 0 ? 1 : -1 )
      const max = srtNums[(nums.length-1)]
      let lbly = this.common.sanitizeUi(numCol)
      const sym = this.dataTableService.dataFilSrtTracker[numCol].colCellSymbol
      if(sym)
        lbly += " ("+sym+")";
      par.setAttribute("data-yaxis", lbly)
      this.xLabel.nativeElement.textContent = this.common.sanitizeUi(this.common.titleCase(strCol))
      this.buildYAxisBGVals(max)
      setTimeout( () => { this.buildBGBars(this.statData, max, sym) })
  }

  buildBGBars(data: any[], max: number, sym: any) {
      let i = 0
      const len = data.length
      let background: string = "rgb(128, 128, 128)";
      const yAx = this.yAxis.nativeElement
      const ybds = yAx.getBoundingClientRect()
      const yWid = ybds.width
      const offY = Math.ceil(yWid+5)
      const whiteTxt = ["white", "#FFFFFF", "#ffffff", "rgb(255, 255, 255)", "rgb(255,255,255)"];
      if(this.dataTableService.themeColor1 && whiteTxt.indexOf(this.dataTableService.themeColor1) < 0)
          background = this.dataTableService.themeColor1;
      const useIncr = Math.min(this.maxBarWid, (Math.floor((this.innerGB.nativeElement.getBoundingClientRect().width-offY)/this.xLabels.length)))
      const bgCols = this.column.split(this.dataTableService.bgSep)
      const strCol = bgCols[0]
      for(i; i < len; i++){
        const item = data[i]
        const bhgt = item["y"]/max;
        const ownCol = this.dataTableService.getColValColor(strCol, item["x"])
        const strVal = item["y"].toLocaleString(undefined, {maximumFractionDigits: 2})
        let symb4 = ""
        let symaf = ""
        if(sym){
            let isCurr = ["$","€","£","¥","₣","₹"].indexOf(sym) > -1
            if(isCurr)
              symb4 = sym
            else
              symaf = sym
        }
        const fVal = item["x"] + ': ' + symb4 + strVal + symaf;
        const bv = { id: item["x"], left: ((i*useIncr) + "px"), heightVal: bhgt, height: "0px", fullValue: fVal, numValue: strVal, background: (ownCol || background)}
        this.barVals.push(bv);
      }
      this.handleBGBarHgts(data)
  }

  handleBGBarHgts(data: any[]) {
    let i = 0
    const len = data.length
    const ybds = this.yAxis.nativeElement.getBoundingClientRect();
    const maxHgt = ybds.height
    setTimeout( () => { 
      for(i; i < len; i++){
        const item = data[i]
        const xvalue = item["x"]
        const bv = this.barVals.find( b => b.id === xvalue)
        if(bv)
          bv.height = (Math.ceil(bv.heightVal*maxHgt) + "px")
      }
      this.sizeUpBgDims()
      this._cd.detectChanges()
    }, 100)
  }

  buildYAxisBGVals(max: number) {
      let nts: string[] = []
      // let diff = max - min
      const incr = max/(this.numYPlots-1)
      const strNum = (val: number) => {
        return val < 1000 ? val.toLocaleString(undefined, {maximumFractionDigits: 0}) : this.common.doBigData(val);
      }
      for(let i = (this.numYPlots-1); i >= 0; i--){
          try{
              const inc = i*incr
              let useVal = inc//(min + inc)
              if(i === 0)
                  useVal = 0//min
              if(i === (this.numYPlots-1))
                  useVal = max
              const strVal = strNum(useVal);
              if(i === (this.numYPlots-1))
                this.maxYVal = strVal
              nts.push(strVal)
          }catch(e){}
      }
      this.numTicks.set([...nts])
  }

  handleStatChange(stat: string, resize?: boolean) {
    if(this.selStat() === stat && !resize)
      return;
    this.maxYVal = "0"
    this.selStat.set(stat)
    this.numTicks.set([])
    this.barVals = []
    this.xLabels = []
    this.statData = []
    this._cd.detectChanges()
    if(!resize)
      this.title.emit(this.common.titleCase(stat) + " " + this.titleTrail);
    setTimeout( () => { 
      this.buildBarGraphWithTwoCols(stat);
    })
  }

  findDataMedian(data: number[], len: number): number {
    if(len === 1)
        return data[0]
    if(len === 2)
        return (data[0]+data[1])/2
    const isOdd = len%2 !== 0
    if(isOdd){
      return data[Math.ceil(len/2)]
    } else {
      const loMed = data[len/2]
      const hiMed = data[len/2] + 1
      return (loMed+hiMed)/2
    }
  }

  getColumnValueCounts(data: any[]) {
        let i = 0
        let count: any = {}
        const len = data.length
        for(i; i < len; i++){
            const d = data[i]
            const val = "v" + d
            if(!count[val] || typeof count[val] === "undefined")
                count[val] = 1
            else
                count[val] += 1
        }
        return count;
    }

  findDataMode(data: any[]): number {
    const count = this.getColumnValueCounts(data)
    let most = null
    for(const prop in count){
        if(!most)
            most = {text: prop, amount: count[prop]}
        if(count[prop] > most.amount)
            most = {text: prop, amount: count[prop]}
    }
    if(most)
      return parseInt(most?.text.replace("v", ""))
    return 0;
  }

  lblMouseIn(el: any) {
    el.classList.add("lbl-show")
  }

  lblMouseOut(el: any) {
    el.classList.remove("lbl-show")
  }

}
