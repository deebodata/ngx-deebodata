import { Component, ElementRef, EventEmitter, HostListener, Input, Output, signal, ViewChild } from '@angular/core';
import { CommonService } from '../../../services/common-service';
import { DataTableService } from '../../../services/data-table-service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-line-graph-component',
  imports: [ CommonModule, FormsModule ],
  templateUrl: './line-graph-component.html',
  styleUrls: ['./line-graph-component.css', '../bar-graph-component/bar-graph-component.css', '../../../styles.css']
})
export class LineGraphComponent {

    @HostListener('window:resize', ['$event'])
    onWindowResize(e: Event) {
        this.handleStatChange(this.selStat, true)
    }

    alloneyr: boolean = false
    lblTxt: string = ""
    naddedtks = signal<any[]>([])
    nmrks: any[] = []
    dtmrks: any[] = []
    dtmrksH: any[] = []
    plots = signal<any[]>([])
    contScrollHgt: number = 0
    maxYVal: string = "0";
    statData: any[] = []
    valOpts = signal<any[]>([])
    selStat: string = "avg"
    statBtnWid: string = "30px"
    titleTrail: string = ""
    useData: any[] = []
    uDates: any[] = []
    selDdVal: string = ""
    selTDOpt: number = -1
    numYPlots: number = 5
    bgDepVarHgt: number = 70//height of y ticks
    totalHgt: number = 297;
    graphMsg: string = "Loading..."
    currentDelta: string = ""
    currentDeltaCls: string = "neutral"
    timeDiffOpts: any[] = []
    statOpts: string[] = ["avg", "min", "max", "mode", "median", "sum"]
    @Input() data: any[] = []
    @Input() numCol: string = ""
    @Input() column: string = ""
    @Output("title") title: EventEmitter<string> = new EventEmitter();
    @ViewChild("yAxis", { static: true }) yAxis!: ElementRef<HTMLDivElement>;
    @ViewChild("lineGraph", { static: true }) lineGraph!: ElementRef<HTMLDivElement>;
    @ViewChild("lgContain", { static: true }) lgContain!: ElementRef<HTMLDivElement>;
    @ViewChild("auxOptsCont", { static: true }) auxOptsCont!: ElementRef<HTMLDivElement>;
    @ViewChild("statOptsCont", { static: true }) statOptsCont!: ElementRef<HTMLDivElement>;
    @ViewChild("lgCanvas", { static: true }) lgCanvas!: ElementRef<HTMLCanvasElement>;
  
    constructor(public common: CommonService,
                public dataTableService: DataTableService,)
     {}

    ngOnInit() {
      const cols = this.column.split(this.dataTableService.bgSep)
      this.totalHgt = ((this.bgDepVarHgt*(this.numYPlots-1))+17);
      if(cols.length === 3){
        this.titleTrail = this.common.titleCase(cols[1]) + " by " + this.common.titleCase(cols[0]);
      } else {
        if(this.numCol)
          this.titleTrail = this.common.titleCase(this.numCol) + " by " + this.common.titleCase(cols[0]);
      }
    }

    ngAfterContentInit() {
      this.buildLg()
    }

    buildLg() {
      let valData: any[] = []
      const strODtCol = this.column.split(this.dataTableService.bgSep)[0]
      if(this.dataTableService.dataFilSrtTracker[strODtCol].selDDVals && this.dataTableService.dataFilSrtTracker[strODtCol].selDDVals.length){
        const vals = this.dataTableService.dataFilSrtTracker[strODtCol].selDDVals?.filter( (g: any) => g.checked && g.value !== "(Select All)")
        this.valOpts.set(vals.map( (v: any) => v.value))
        if(!this.selDdVal)
          this.selDdVal = vals[0].value
        valData = this.data.filter( d => d["strColumn"] === this.selDdVal)
      } else {
        valData = this.data.filter( d => true)
      }
      if(this.selTDOpt > -1){//not all time
        try{
          const oneDay = (1000*60*60*24);
          let oData = valData.filter( v => v && v["dtColumn"] && this.common.isADateObject(v["dtColumn"]) && v["dtColumn"].toString() !== "Invalid Date").
                      sort( (a, b) => a["dtColumn"] > b["dtColumn"] ? 1 : -1 );
          const vlen = oData.length
          const lastDate = oData[(vlen-1)].dtColumn.getTime()
          const cutoff = (lastDate-(this.selTDOpt*oneDay))
          valData = oData.filter( v => v["dtColumn"].getTime() >= cutoff )
        }catch(e){}
      }
      const dSet = new Set(valData.filter( v => true).sort( (a, b) => a["dtColumn"] > b["dtColumn"] ? 1 : -1 ).map( (d) => JSON.stringify(d["dtColumn"]) ))//unique dates
      dSet.forEach( (v) => { 
        const pdt = JSON.parse(v)
        if(typeof pdt === "string")
          this.uDates.push(this.common.coerceDate(pdt)) 
        else
          this.uDates.push(pdt)
      });
      this.setUseableData(valData, this.selStat)
      setTimeout( () => { 
        this.drawLineGraph(this.useData); 
      })
    }

    getYTDNumDays(dtmax: any) {
        try{
            const dt = new Date()
            const yr = dt.getFullYear()
            const oneDay = (1000*60*60*24);
            const jan1 = new Date("January 1, "+ yr +" 00:01:00")
            const gap = Math.floor((dtmax.getTime() - jan1.getTime()) / oneDay)
            return gap > 0 ? gap : null;
        } catch(e){ return null}
    }

    findTimeDiffOpts(milRange: number, dtmax: any) {
      let i = 0
      this.timeDiffOpts = []
      // const oneDay = (1000*60*60*24);
      // const range = Math.floor(milRange/oneDay)
      const ytd = "YTD"
      const ytdNum = this.getYTDNumDays(dtmax)
      let avail: any[] = [{text: "1D", val: 1}, {text: "5D", val: 5},{text: "1M", val: 31},
      {text: "6M", val: Math.ceil(365/2)},{text: "1Y", val: 365}, {text: ytd, val: ytdNum},
      {text: "5Y", val: ((365*5)+1)}];
      if(!ytdNum)
        avail = avail.filter( a => a.text !== ytd)
      const len = avail.length
      for(i; i < len; i++){
        const av = avail[i]
        // if(range > av.val)
          this.timeDiffOpts.push(av)
      }
    }

    handleStatChange(stat: string, resize?: boolean) {
      if(this.selStat === stat && !resize)
        return;
      this.killPlots("Loading...")
      this.maxYVal = "0"
      this.selStat = stat
      if(!resize)
        this.title.emit(this.common.titleCase(stat) + " " + this.titleTrail);
      setTimeout( () => { this.buildLg() })
    }

    handleValSelChange(selVal: string) {
      this.killPlots("Loading...")
      this.selDdVal = selVal
      this.maxYVal = "0"
      setTimeout( () => { this.buildLg() })
    }

    handleTimeDiffChange(topt: number) {
      this.killPlots("Loading...")
      this.selTDOpt = topt
      this.maxYVal = "0"
      setTimeout( () => { this.buildLg() })
    }

    setUseableData(valArr: any[], stat: string) {
      const dlen = this.uDates.length
      this.useData = []
      let d = 0;
      for(d; d < dlen; d++){
        let obj = {}
        const dt = this.uDates[d]
        const justVal = valArr.filter( (d) => {
                        return d && d[("dtColumn")] && this.common.isADateObject(d[("dtColumn")]) && d["dtColumn"].toString() !== "Invalid Date" &&
                        this.common.isADateObject(dt) && dt.toString() !== "Invalid Date" && d[("dtColumn")].getTime() === dt.getTime()} ).
                        map( function(d) {return d[("numColumn")]} )
        const jlen = justVal.length
        if(jlen){
          switch(stat){
            case "avg":
              obj = { dtColumn: dt, numColumn: (justVal.reduce( (acc, curr) => (acc += curr) , 0)/jlen) }
              break;
            case "min":
              obj = { dtColumn: dt, numColumn: (Math.min(...justVal)) }
              break;
            case "max":
              obj = { dtColumn: dt, numColumn: (Math.max(...justVal)) }
              break;
            case "sum":
              obj = { dtColumn: dt, numColumn: justVal.reduce( (acc, curr) => (acc += curr) , 0) }
              break;
            case "median":
              obj = { dtColumn: dt, numColumn: this.findDataMedian(justVal, jlen) }
              break;
            case "mode":
              obj = { dtColumn: dt, numColumn: this.findDataMode(justVal) }
              break;
            default: "avg"
              obj = { dtColumn: dt, numColumn: (justVal.reduce( (acc, curr) => (acc += curr) , 0)/jlen) };
          }
          this.useData.push(obj)
        }
      }
    }

    sizeUpBgDims() {
      const bgWid = this.lgContain.nativeElement.getBoundingClientRect().width
      const yWid = this.yAxis.nativeElement.getBoundingClientRect().width
      const offY = Math.ceil(yWid+5)
      this.statBtnWid = Math.floor((bgWid-offY)/this.statOpts.length) + "px";
      this.statOptsCont.nativeElement.style.marginLeft = offY + "px";
      this.auxOptsCont.nativeElement.style.marginLeft = offY + "px";
    }
  
    drawLineGraph(data: any[]): any {
      if(data && data.length){
        try{
          const lmarg = 60
          const dlen = data.length
          const lg = this.lineGraph.nativeElement
          const par = this.lgContain.nativeElement
          const canvas = this.lgCanvas.nativeElement
          const strODtCol = this.column.split(this.dataTableService.bgSep)[0]
          lg.style.width = ((par.getBoundingClientRect().width*0.92) -lmarg) + "px";
          canvas.width = ((par.getBoundingClientRect().width*0.92) -lmarg)
          const dtopts = {year: "2-digit",month: "2-digit", day: "numeric"}
          const numCol = this.numCol || this.column.split(this.dataTableService.bgSep)[1]
          let lbly = this.common.sanitizeUi(numCol)
          const sym = this.dataTableService.dataFilSrtTracker[numCol].colCellSymbol
          if(sym)
            lbly += " ("+sym+")";
          par.setAttribute("data-yaxis", lbly)

          //numbers
          const numArr = data.map( (d) => d["numColumn"] ).
          filter( (a) => !!a && a >= 0 ).sort( (a, b) => (a - b)*-1 );
          if(numArr.length < 2 || !numArr.some( (n) => n > 0 ))
              return this.killPlots("Not enough data for a graph")
          const nlen = numArr.length;
          const nmmin = numArr[(nlen-1)]
          const nmmax = numArr[0]
          const nmrange = nmmax - nmmin;
          const nqtrdts = (nmrange/4) + nmmin
          const nhalfdts = (nmrange/2) + nmmin
          const nthrqtrdts = (nmrange*0.75) + nmmin
          const nokTickVal = [nmmax, nthrqtrdts, nhalfdts, nqtrdts, nmmin]//desc order!
          const ntklen = nokTickVal.length
          let nadded = [];
          let mckNaTs: any[] = []
          let t = 0
          this.maxYVal = nmmax < 1000 ? nmmax.toLocaleString(undefined, {maximumFractionDigits: 0}) : this.common.doBigData(nmmax);
          for(t; t < ntklen; t++){
              const val = nokTickVal[t]
              const ntkval: string = val < 1000 ? val.toLocaleString(undefined, {maximumFractionDigits: 0}) : this.common.doBigData(val);
              if(mckNaTs.map( n => n.value).indexOf(ntkval) > -1)
                  continue
              mckNaTs.push({value: ntkval, visible: false})
          }
          this.naddedtks.set([...mckNaTs])
          let i = 0
          for(i; i < nlen; i++){//not seen but heard
              const unum = numArr[i]
              if(nadded.indexOf(unum) > -1)
                  continue
              const pct = (Math.max(1, unum-nmmin) / Math.max(1, nmrange))
              const usenval = unum?.toLocaleString(undefined, {maximumFractionDigits: 2});
              this.nmrks.push({value: usenval, percent: pct.toFixed(2), visible: false})
              nadded.push(usenval)
          }
          //numbers

          //dates
          let arrFrmSet: any[] = []
          const dSet = new Set(data.map( (d) => d["dtColumn"] ))//unique dates
          dSet.forEach( (v) => { arrFrmSet.push(v) });
          if(arrFrmSet.length < 2)
            return this.killPlots("Not enough data for a graph");
          const dttype = typeof arrFrmSet[0];
          const ordDts = arrFrmSet.filter( (a) => !!a ).sort( (a, b) => { 
              return (dttype !== "object" ? (parseInt(a.toString()) - parseInt(b.toString())) : ( a.getTime() - b.getTime() ))
          })
          let m = 0
          let added = []
          const olen = ordDts.length
          const yearvals = ordDts.map( (o) => typeof o !== "object" ? o : o.getFullYear() )
          this.alloneyr = (new Set(yearvals.filter( (d) => true )).size < 2) ? true : false;//unique years
          // let yrReg = new RegExp("sjdkgf", "g")//not gonna replace anything
          // if(this.alloneyr)
          //     yrReg = new RegExp("\/" + yearvals[0], "g")
          let dtrange
          let dtmin: any; let dtmax: any;
          if(typeof ordDts[0] === "object"){
              dtmin = ordDts[0]
              dtmax = ordDts[(ordDts.length-1)]
          }
          if(typeof ordDts[0] === "number"){
              dtmin = ordDts[0]
              dtmax = ordDts[(ordDts.length-1)]
          }
          if(typeof ordDts[0] === "string" && !isNaN(parseInt(ordDts[0])) && !isNaN(parseInt(ordDts[(ordDts.length-1)]))){
              dtmin = parseInt(ordDts[0]);
              dtmax = parseInt(ordDts[(ordDts.length-1)])
          }
          dtrange = typeof ordDts[0] === "object" ? (dtmax.getTime() - dtmin.getTime()) : (dtmax - dtmin)
          if(!dtrange || typeof dtrange !== "number")
            return this.killPlots("Not enough data for a graph");
          if(this.selTDOpt === -1)
            setTimeout( () => { this.findTimeDiffOpts(dtrange, dtmax) }, 500)
          const figureDtTicks = (val: number) => (typeof dtmin === "object" ? new Date(val+dtmin.getTime()) : (val+dtmin))
          const halfdts = figureDtTicks(Math.ceil(dtrange/2))
          const okDtTks = [dtmin, halfdts, dtmax];
          let de = 0
          const dtklen = okDtTks.length
          for(de; de < dtklen; de++){
              const tval = okDtTks[de]
              const useDVal = this.common.isADateObject(tval) ? tval.toLocaleDateString('en-US', dtopts)/*.replace(yrReg, "")*/ : tval
              if(this.dtmrks.find( d => d.value === useDVal))
                  continue;
              this.dtmrks.push({value: useDVal, left: 0, visible: false})
          }
          const oZ = ordDts[0].getTime()
          for(m; m < olen; m++){
              const oval = ordDts[m]
              const useDVal = this.common.isADateObject(oval) ? oval.toLocaleDateString('en-US', dtopts)/*.replace(yrReg, "")*/ : oval
              if(added.indexOf(useDVal) > -1)
                  continue
              let pct: number = 0
              if(typeof ordDts[0] === "object")
                  pct = ((ordDts[m].getTime()-oZ) / dtrange)
              if(typeof ordDts[0] === "number")
                  pct = ((ordDts[m]-ordDts[0]) / dtrange)
              if(typeof ordDts[0] === "string")
                  pct = ((parseInt(ordDts[m])-parseInt(ordDts[0])) / dtrange)
              this.dtmrksH.push({ value: useDVal, percent: pct, left: 0, visible: false })
              added.push(useDVal)
          }//space out the markers
          //dates
          //set graph dims
          setTimeout( (): any => {
            let r =0
            let hd =0
            const halfPlot = 2
            let lgbds = lg.getBoundingClientRect()
            const mrks = document.querySelectorAll("#" + par.id + " .lg-dt-marker")
            const mrlen = mrks.length
            const hmrlen = this.dtmrksH.length
            // const lastdtdv = mrks[mrlen-1].getBoundingClientRect()
            const space = lgbds.width//(lgbds.right - (lastdtdv.right/*-lmarg*/)) - halfPlot
            const divby = Math.max(1, (mrlen-1))
            const mrrgt = Math.ceil(space/divby)//divide space up by count-1 because last gets no marg right
            for(r; r < mrlen; r++){
              const dtmrk = this.dtmrks[r]
              if(dtmrk)
                dtmrk.left = (Math.floor(mrrgt*r)-halfPlot) + "px";
            }
            setTimeout( () => {
              lgbds = lg.getBoundingClientRect()
              const xrange = space
              for(hd; hd < hmrlen; hd++){
                const hmrk = this.dtmrksH[hd]
                if(hmrk)
                  hmrk.left = Math.floor((hmrk.percent*xrange)) + "px";
              }

              const nmrks = document.querySelectorAll("#" + par.id + " .bg-dep-var")
              const nmrlen = nmrks.length
              const hnmrks = this.nmrks
              const hnmrlen = hnmrks.length
              //set graph dims
              //add x label
              let colsspl = this.column.split(this.dataTableService.bgSep)
              const useCol = colsspl.length === 3 ? colsspl[2] : colsspl[0]
              const pretXlbl = this.common.sanitizeUi(this.common.titleCase(useCol))
              this.lblTxt = pretXlbl
              if(this.alloneyr)
                  this.lblTxt = yearvals[0] + " " + pretXlbl
              //add x label
              setTimeout( () => {
                //add plots
                lgbds = lg.getBoundingClientRect()
                const maxPtLft = xrange - halfPlot
                const maxPtBot = lgbds.height - (halfPlot*6) - 1;
                // const dtmrWid =mrks[0].getBoundingClientRect().width
                const findDtLft = (dt: any) => {
                    let q = 0; let k = 0
                    const ptval = this.common.isADateObject(dt) ? dt.toLocaleDateString('en-US', dtopts)/*.replace(yrReg, "")*/ : dt
                    for(q; q < mrlen; q++){
                        const dtmrk = this.dtmrks[q]
                        if(dtmrk){
                          const dttxt = dtmrk.value
                          if(ptval === dttxt)
                            return (parseFloat(dtmrk.left.replace(/[ ]?(px|\%)/g, "")) || 0)/* + (dtmrWid/2)*/ - halfPlot
                        }
                    }
                    
                    for(k; k < hmrlen; k++){
                        const hm = this.dtmrksH[k]
                        const dttxt = hm.value
                        if(ptval === dttxt)
                          return Math.min(maxPtLft, ((parseFloat(hm.left.replace(/[ ]?(px|\%)/g, "")) || 0))) - halfPlot
                    }
                    return 0;
                }
  
                const nmrHgt = (nmrks[0]?.getBoundingClientRect().height || 17)
                const lbot = lgbds.bottom
                const findNBot = (num: number) => {
                    let q = 0; let k = 0
                    const ptval = num?.toLocaleString(undefined, {maximumFractionDigits: 2});
                    for(q; q < nmrlen; q++){
                        const nmrk = this.naddedtks()[q]
                        if(nmrk){
                          const dttxt = nmrk.value
                          if(ptval === dttxt)
                              return Math.floor(lbot - nmrks[q].getBoundingClientRect().bottom) + (nmrHgt/2) - halfPlot/*halfPlot is half the dot*/
                        }
                    }
                    for(k; k < hnmrlen; k++){
                        const hnmrk = hnmrks[k]
                        const dttxt = hnmrk.value
                        if((ptval === dttxt) && hnmrk.percent){
                            const totalh = Math.floor(lgbds.height*(hnmrk.percent || 0)) + (nmrHgt/2) - halfPlot
                            return Math.min(maxPtBot, Math.ceil(totalh))/*halfPlot is half the dot*/
                        }
                    }
                    return 0;
                }
                let p = 0;
                let skipped = 0
                let plots: any[] = []
                let lgColor: string = "#00a8f3"
                let lgUndColor: string = ""
                const ctx = canvas.getContext("2d")
                if(ctx){
                  let mkPlts: any[] = [] 
                  const whiteTxt = ["white", "#FFFFFF", "#ffffff", "rgb(255, 255, 255)", "rgb(255,255,255)"];
                  if(this.dataTableService.themeColor1 && whiteTxt.indexOf(this.dataTableService.themeColor1) < 0)
                      lgColor = this.dataTableService.themeColor1;
                  let useCol: any = lgColor
                  if(lgColor.startsWith("#"))
                      useCol = this.common.hexToRgb(lgColor)
                  else
                      useCol = this.common.getRgbParts(lgColor)
                  if(useCol && typeof useCol === "object")
                      lgUndColor = "rgba("+useCol.r+", "+useCol.g+", "+useCol.b+", 0.2)";
                  const bSym = ((sym && ["$","€","£","¥","₣","₹"].indexOf(sym) > -1) ? sym : "");
                  const aSym = ((!sym || sym && ["$","€","£","¥","₣","₹"].indexOf(sym) > -1) ? "" : sym);
                  const minFrac = bSym ? 2 : 0;//currency
                  for(p; p < dlen; p++){
                      try{
                          const dval = data[p]
                          if(!dval["dtColumn"] || (typeof dval["numColumn"] !== "number"))
                              continue;
                          const plft = Math.max(0, findDtLft(dval["dtColumn"]))
                          const pbot = Math.max(0, findNBot(dval["numColumn"]))
                          if(typeof plft !== "number" || typeof pbot !== "number")
                              continue
                          const usedval = this.common.isADateObject(dval["dtColumn"]) ? dval["dtColumn"].toLocaleDateString('en-US', dtopts)/*.replace(yrReg, "")*/ : dval["dtColumn"]
                          let pt = { 
                            date: usedval, 
                            number: (bSym + dval["numColumn"].toLocaleString(undefined, {maximumFractionDigits: 2, minimumFractionDigits: minFrac}) + aSym),
                            left: plft > 0 ? (plft+halfPlot) : plft,
                            bottom: (pbot+(halfPlot*2)),
                          }
                          const plen = plots.push(pt)
                          const ptBef = plots[plen-(2+skipped)]
                          if(ptBef){  
                            const dx = pt.left - ptBef.left;
                            const dy = (lgbds.height-pt.bottom) - (lgbds.height-ptBef.bottom);
                            if(dx <= 20 && (p < (dlen-1))){
                              if(!nokTickVal.includes(dval["numColumn"])){
                                skipped += 1;
                                continue
                              }
                            }
                            skipped = 0
                            const ownCol = this.dataTableService.getColValColor(strODtCol, this.selDdVal)
                            if(ownCol){
                              lgColor = ownCol
                              useCol = lgColor
                              if(lgColor.startsWith("#"))
                                  useCol = this.common.hexToRgb(lgColor)
                              else
                                  useCol = this.common.getRgbParts(lgColor)
                              if(useCol && typeof useCol === "object")
                                  lgUndColor = "rgba("+useCol.r+", "+useCol.g+", "+useCol.b+", 0.2)";
                            }
                            this.drawCanvasLineGraph(ctx, dx, dy, ptBef.left, (lgbds.height-ptBef.bottom), lgColor, lgUndColor)
                          }
                          mkPlts.push(pt)
                      }catch(e){}
                  }
                  this.plots.set(mkPlts)
                }
                //add plots
                this.sizeUpBgDims()
                this.calcCurrChangeOverTime()
              }, 100)
            })
          }, 250)
        }catch(e){}
      }
      }

      drawCanvasLineGraph(ctx: CanvasRenderingContext2D, sideA: number, sideB: number, xb: number, yb: number, color: string, ucolor: string) {
        // Define the vertices of the right triangle
        // Assuming the right angle is at (x1, y2)
        let x2 = xb + sideA;
        let y2 = yb + sideB; // Top-right vertex

        // Draw the hypotenuse
        ctx.beginPath();
        ctx.moveTo(xb, yb); // Start at one end of the hypotenuse
        ctx.lineTo(x2, y2); // Draw to the other end of the hypotenuse
        ctx.strokeStyle = color; // Make hypotenuse red for distinction
        ctx.lineWidth = 1;
        ctx.stroke();

        // Close the path to the bottom of the canvas for filling
        ctx.lineTo(x2, this.totalHgt); // Down to the bottom at the last x-coordinate
        ctx.lineTo(xb, this.totalHgt);  // Across to the bottom at the first x-coordinate
        ctx.closePath(); // Connects back to the starting point (50, 100)

        ctx.fillStyle = ucolor || color; // Set the fill color
        ctx.fill(); // Fill the enclosed area
      }

      calcCurrChangeOverTime() {
        const dttype = typeof this.useData[0].dtColumn;
        const srtData = this.useData.filter( (a) => !!a.dtColumn ).sort( (a, b) => { 
            return (dttype !== "object" ? (parseInt(a.dtColumn.toString()) - parseInt(b.dtColumn.toString())) : ( a.dtColumn.getTime() - b.dtColumn.getTime() ))
        })
        const srtLen = srtData.length
        const firstVal = srtData[0].numColumn
        const diff = srtData[srtLen-1].numColumn - firstVal
        this.currentDelta = (((diff > 0) ? "&plus; " : "") + ((diff/firstVal)*100).toLocaleString(undefined, { maximumFractionDigits: 2 }) + "%");
        this.currentDeltaCls = diff === 0 ? "neutral" : (diff > 0 ? "success" : "error-message");
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
      
      showDotPlotInfo(dt: any, num: any): any {
          const mrlen = this.dtmrks.length
          const hmrlen = this.dtmrksH.length
          let q = 0; let k = 0
          for(q; q < mrlen; q++){
              const dttxt = this.dtmrks[q].value
              if(dt === dttxt)
                  return this.dtmrks[q].visible = true
          }
          
          for(k; k < hmrlen; k++){
              const dttxt = this.dtmrksH[k].value
              if(dt === dttxt)
                  return this.dtmrksH[k].visible = true
          }
  
          q = 0;
          k = 0;
          const nmrlen = this.naddedtks().length
          const hnmrlen = this.nmrks.length
          const ptval = num?.toLocaleString(undefined, {maximumFractionDigits: 2});
          for(q; q < nmrlen; q++){
              const dttxt = this.naddedtks()[q].value
              if(ptval === dttxt)
                  this.naddedtks()[q].visible = true
          }
          
          for(k; k < hnmrlen; k++){
              const dttxt = this.nmrks[k].value
              if(ptval === dttxt)
                  return this.nmrks[k].visible = true
          }
      }
  
      hideDotPlotInfo() {
        this.dtmrks = this.dtmrks.map( n => {
          n.visible = false
          return n
        })
        this.dtmrksH = this.dtmrksH.map( n => {
          n.visible = false
          return n
        })
        this.naddedtks.set(this.naddedtks().map( n => {
          n.visible = false
          return n
        }))
        this.nmrks = this.nmrks.map( n => {
          n.visible = false
          return n
        })
      }

      killPlots(msg?: string) {
        this.lblTxt = ""
        if(msg)
          this.graphMsg = msg
        this.selTDOpt = -1
        this.plots.set([])
        this.nmrks = []
        this.dtmrks = []
        this.uDates = []
        this.dtmrksH = []
        this.naddedtks.set([])
        this.useData = []
        this.currentDelta = ""
        this.clearCanvas()
        if(msg && /enough/g.test(msg))
          this.sizeUpBgDims()
      }
      
      clearCanvas() {
        const canvas = this.lgCanvas.nativeElement
        if(canvas){
          canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height)
        }
      }
      ngOnDestroy() {
        this.killPlots()
      }
}
