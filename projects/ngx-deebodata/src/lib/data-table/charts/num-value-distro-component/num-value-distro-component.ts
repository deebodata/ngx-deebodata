import { Component, ElementRef, EventEmitter, Input, NgZone, Output, signal, ViewChild } from '@angular/core';
import { CommonService } from '../../../services/common-service';
import { DataTableService } from '../../../services/data-table-service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-num-value-distro-component',
  imports: [CommonModule],
  templateUrl: './num-value-distro-component.html',
  styleUrls: ['./num-value-distro-component.css', '../../../styles.css']
})
export class NumValueDistroComponent {

  nmrksVdn: any[] = []
  nmrksVdnH = signal<any[]>([])
  nColValBars = signal<any[]>([])
  avgColValBar: any = null
  naddedtks: any = []
  @Input() title: string = ""
  @Input() column: string = ""
  @Input() average: number = 0
  @Input() originalArr: number[] = []
  @Output("done") doneLoading: EventEmitter<string> = new EventEmitter()
  @ViewChild("numColDistContainer", { static: true }) numColDistContainerEl!: ElementRef<HTMLElement>; 

  constructor(public common: CommonService,
              public dataTableService: DataTableService,
              private _zone: NgZone,)
 {}

 ngOnInit() {
     this.showNumColValDist(this.common.elifyCol(this.column), this.title, this.average)
 }

  showNumColValDist(elIdCol: any, title: any, avg: any) {//will be only numbers
        try{
            const numArr = this.originalArr.sort( (a: number, b: number) => a - b );
            const nlen = numArr.length;
            const nmmin = numArr[0]
            const nmmax = numArr[(nlen-1)]
            const nmrange = nmmax - nmmin;
            const nqtrdts = (nmrange/4) + nmmin
            const nhalfdts = (nmrange/2) + nmmin
            const nthrqtrdts = (nmrange*0.75) + nmmin
            const nokTickVal = [nmmin, nqtrdts, nhalfdts, nthrqtrdts, nmmax]
            const ntklen = nokTickVal.length
            let nadded = []
            let t = 0
            const maxDigs = nmrange > 3 ? 0 : 2;
            const whiteTxt = ["white", "#FFFFFF", "#ffffff", "rgb(255, 255, 255)", "rgb(255,255,255)"];
            for(t; t < ntklen; t++){
                const ntkval = nokTickVal[t]?.toLocaleString(undefined, {maximumFractionDigits: maxDigs});
                if(!ntkval || this.naddedtks.indexOf(ntkval) > -1 || ntkval === "NaN")
                    continue
                this.nmrksVdn.push({value: ntkval})
                this.naddedtks.push(ntkval)
            }
            let h = 0
            let nHmck: any[] = []
            for(h; h < nlen; h++){//not seen but heard
                const unum = numArr[h]
                const usenval = unum?.toLocaleString(undefined, {maximumFractionDigits: maxDigs});
                if(nadded.indexOf(usenval) > -1)
                    continue
                let pct = ((unum-nmmin) / nmrange)
                if(isNaN(pct))
                    pct = 0
                nHmck.push({ value: usenval, percent: pct.toFixed(2) })
                nadded.push(usenval)
            }
            /*avg marker*/
            if(avg && typeof avg === "number"){
                let pct = ((avg-nmmin) / nmrange)
                if(isNaN(pct))
                    pct = 0
                const usenval = avg.toLocaleString(undefined, {maximumFractionDigits: maxDigs});
                nHmck.push({ value: usenval, percent: pct.toFixed(2) })
                nadded.push(usenval)
            }
            /*avg marker*/
            this.nmrksVdnH.set([...nHmck])
            if(!this.naddedtks.length)
                return;
            setTimeout( () => {
                try{
                    let r =0
                    let hd =0
                    const halfPlot = 6
                    const pbds = this.numColDistContainerEl.nativeElement.getBoundingClientRect()
                    const outParId = ("insField" + elIdCol)
                    const mrks = document.querySelectorAll("#" + outParId + " .vd-n-marker")
                    const mrlen = this.nmrksVdn.length
                    const hmrlen = this.nmrksVdnH().length
                    const lastdtdv = mrks[mrlen-1].getBoundingClientRect()
                    const space = (pbds.right - (lastdtdv.right)) - halfPlot
                    const divby = Math.max(1, (mrlen-1))
                    const mrrgt = (Math.ceil(space/divby))//divide space up by count-1 because last gets no marg right
                    for(r; r < mrlen; r++)
                        this.nmrksVdn[r].left = Math.floor((mrrgt*r)) + "px";
                    setTimeout( () => {
                        const xrange = Math.min((mrks[mrlen-1].getBoundingClientRect().right - pbds.left) - (Math.ceil(lastdtdv.width/2)+halfPlot+1))
                        for(hd; hd < hmrlen; hd++){
                            const hmrk = nHmck[hd]
                            const per = hmrk.percent
                            nHmck[hd].left = (Math.floor(parseFloat(per)*xrange)) + "px";
                        }
                        this.nmrksVdnH.set([...nHmck])
                        let mrkbds = mrks[0].getBoundingClientRect()
                        const findNLft = (val: any, avg: boolean) => {
                            let q = 0; let k = 0
                            for(q; q < mrlen; q++){
                                try{
                                    const mrk = this.nmrksVdn[q]
                                    const mrkEl = mrks[q]
                                    mrkbds = mrkEl.getBoundingClientRect()
                                    const dttxt = mrk.value
                                    let toadd = 0
                                    if(avg)
                                        toadd -= halfPlot
                                    if(val === dttxt)
                                        return (parseInt(mrk.left.replace(/[ ]?(px|\%)/g, ""))) + (((mrkbds.width/2)-halfPlot)-toadd)
                                }catch(e){ }
                            }
                            
                            for(k; k < hmrlen; k++){
                                try{
                                    const hmrk = this.nmrksVdnH()[k]
                                    const dttxt = hmrk.value
                                    let toadd = 0;
                                    if(avg)
                                        toadd -= halfPlot
                                    if(val === dttxt)
                                        return (parseInt(hmrk.left.replace(/[ ]?(px|\%)/g, ""))) - toadd
                                }catch(e){ }
                            }
                            return null;
                        }
                        
                        let i = 0;
                        let minL = 0
                        let nvBars: any[] = []
                        const maxLft = Math.floor((pbds.right - mrks[0].getBoundingClientRect().left) - Math.ceil((lastdtdv.width/2)+1))
                        for(i; i < nlen; i++){
                            const usennum = numArr[i]?.toLocaleString(undefined, {maximumFractionDigits: maxDigs})
                            const plft = findNLft(usennum, false)
                            if((plft && plft !== 0) && !isNaN(plft)){
                                const nBar: any = { number: "", left: "", background: "", stat: "" }
                                const dmn = Math.max(Math.ceil(plft), minL)
                                if(i === (nlen-1))
                                    nBar.left = (dmn + "px");
                                else
                                    nBar.left = Math.min(dmn, maxLft) + "px";
                                nBar.number = usennum
                                nvBars.push(nBar)
                                if(this.dataTableService.themeColor1 && whiteTxt.indexOf(this.dataTableService.themeColor1) < 0)
                                    nBar.background = this.dataTableService.themeColor1
                                if(i === 0 || i === (nlen-1))
                                    nBar.stat = ((i === 0) ? "min" : "max")
                                if(i === 0)//don't let anything lay before it
                                    minL = Math.ceil(Math.min(dmn, maxLft) + 1);
                            }
                        }
                        this.nColValBars.set([...nvBars])
    
                        /*avg marker*/
                        if(avg && typeof avg === "number"){
                            const useavg = avg.toLocaleString(undefined, {maximumFractionDigits: maxDigs})
                            const aplft = findNLft(useavg, true)
                            if((aplft && aplft !== 0) && !isNaN(aplft))
                                this._zone.run( () => { this.avgColValBar = { number: useavg, left: (Math.floor(aplft) + "px") } } )
                        }
                        /*avg marker */
                        this.doneLoading.emit(title?.replace(/Building /g, "").replace(/distribution\.\.\./g, "distribution"))
                    }, 250)
                }catch(e){ }
            }, 250)
        } catch(e){ }
    }

    matchVdBarToStat(parent: string, stat: string) {
        try{
            let elIdCol = ""
            let selOrFil = ""
            if(stat){
                const useStat = /(min|max)/g.test(stat) ? stat : "avg";
                if(parent && useStat){
                    const parts = parent.split("insField");
                    if(parts.length === 1)
                        elIdCol = parts[0]
                    if(parts.length === 2){
                        selOrFil = parts[0] || "";
                        elIdCol = parts[1]
                    }
                    const matchEl = document.querySelector("#" + useStat + selOrFil + this.common.elifyCol(this.column))?.lastElementChild
                    if(matchEl)
                        matchEl.classList.add("save-hilite")
                }
            }
        } catch(e){}
    }

    killAllVdHighlights() {
        try{
            const els = document.querySelectorAll(".insight-field .save-hilite")
            const len = els.length
            for(var i = (len-1); i >= 0; i--)
                els[i].classList.remove("save-hilite")
        }catch(e){}
    }
}
