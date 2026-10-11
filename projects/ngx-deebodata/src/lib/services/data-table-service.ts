import { Injectable, signal } from '@angular/core';
import { CommonService } from './common-service';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { ColumnSymbol } from '../interfaces/column-symbol';
import { ColumnStyles } from '../interfaces/column-styles';
import { ColumnValueColors } from '../interfaces/column-value-colors';
import { CustomSortService } from './custom-sort-service';
import { CustomSort } from '../interfaces/custom-sort';

@Injectable({
  providedIn: 'root'
})
export class DataTableService {

            constructor(private common: CommonService,
                        private customSortService: CustomSortService,
                        private http: HttpClient,
            ) {
              
            }

            sortOrder: string[] = []
            mainData: any[] = []
            mainDataLen = 0
            tblTop: number = 0;
            tblBot: number = 0;
            tblLeft: number = 0;
            tblRight: number = 0;
            dpLim: number = 1000;
            currPage = 1
            rowsPerPage = 25;
            serverSideTotal = 0;
            serverSideFilteredTotal = 0;
            currFilData: any[] = []
            currMapping: any = {}
            mapperWorkerId: number = 1;
            dTblHeight = signal<number>(500);
            listenForScroll = signal<boolean>(true)
            lockCellFocus = signal<boolean>(false);
            defltRHgt: string = "50px"
            defltRHgtNum: number = 50
            mouseIsDown: boolean = false;
            isSorting = signal<boolean>(false);
            isFiltering = signal<boolean>(false);
            showCharts = signal<boolean>(false)
            themeColor1: any = null
            themeColor2: any = null
            currEditCol: string = ""
            currEditIndex: number = -1
            visibleCols: string[] = []
            currColumnEdit: any = null;
            useColWid: string = "100px"
            currGroup: string = ""
            firstCol: string = ""
            primaryKey: string = ""
            autoScrollOnEdit: boolean = false
            listenToCloseExportOpts = false;
            listenToCloseGroupByOpts = false;
            shiftKeyDown: number = 1;
            currGrouping: Subject<any> = new Subject()
            closeExportOpts: Subject<boolean> = new Subject()
            closeGroupByOpts: Subject<boolean> = new Subject()
            gridEventWhileGrouped: Subject<any> = new Subject()
            gridScrollEndWhileGrouped: Subject<any> = new Subject()
            groupedBoundsChange: Subject<any> = new Subject()
            mouseupWhileGrouped: Subject<any> = new Subject()
            setIdealColumnWidth: Subject<any> = new Subject()
            renderEvent: Subject<any> = new Subject()
            forcePageOne: Subject<any> = new Subject()
            disablePageButtons: Subject<boolean> = new Subject()
            currSelRows: any[] = []//just be an index of mainData
            displayOnlySelRows = false
            noDataMsg: string = "Loading..."
            deboTotal: string = "deebo_total"
            bgSep: string = "__forbargX"
            errorLoading = false;
            dataFilSrtTracker: any = {}
            comparatorOpts: any = {
                text: ["Equals", "Not Equal", "Empty", "Not Empty", "Contains", "Starts With", "Ends With"],
                number: ["Equals", "Not Equal", "Empty", "Not Empty", "Less Than", "Less Than or Equal", "Greater Than", "Greater Than or Equal"],
                date: ["Equals", "Not on", "Empty", "Not Empty", "Before", "After"],
            }
            badStrings: string[] = ["null", "NULL", "Null", "undefined", "UNDEFINED", "Undefined"]

            columnSymbols: ColumnSymbol[] = []

            columnStyles: ColumnStyles[] = []

            columnValueColors: ColumnValueColors[] = []

            pieGraphColors: string[] = []
            removePieCovers: boolean|string[] = false

            getColumnStyle(col: string): string {
                const foundCol = this.columnStyles.find( c => c.column === col)?.column
                return foundCol ? (" data-cell-" + foundCol + "-") : "";
            }

            getColValColor(column: string, value: string) {
                return this.columnValueColors.filter( c => c.column === column)[0]?.
                valueColors.find( vc => vc.value === value)?.color;
            }

            isLocalHost(andSet: boolean): boolean {
                const isLocal = (/4200/g.test(location.port) && /localhost/g.test(location.href));
                if(andSet && isLocal)
                    this.common.setLs()
                return isLocal
            }

            validateLicense(key: string) {
                return this.http.post(this.validationEndpoint, {key: key})
            }

            getNewTrackerObj(colName: string) {
                const symbol = this.columnSymbols.filter( c => c.column === colName)[0]?.symbol?.substring(0, 2);
                return { 
                        filter: "", 
                        comparator: "", 
                        sort: null, 
                        type: "string", 
                        selDDVals: null,
                        minimize: false, 
                        freeze: false, 
                        colWidth: null,
                        colCellSymbol: symbol,
                }
            }

            getFilTrkerData() {
                let obj: any = {};
                for(const prop in this.dataFilSrtTracker){
                    const trk = this.dataFilSrtTracker[prop]
                    if(trk.filter || trk.sort)
                    obj[prop] = { filter: trk.filter, sort: trk.sort };
                }
                return obj;
            }

            getTotal() {
                if(this.serverSideFilteredTotal)
                    return this.serverSideFilteredTotal
                if(this.currFilData.length !== this.mainData.length)
                    return this.serverSideFilteredTotal || this.currFilData.length || this.serverSideTotal;
                return this.serverSideTotal || this.currFilData.length;
            }

            setTblVertBounds() {
                this.tblBot = (document.getElementById("tableFooter")?.getBoundingClientRect().top || 0)
                this.tblTop = (document.getElementsByClassName("data-table-headers")[0]?.getBoundingClientRect().bottom || 0)
            }

            setTblHorizBounds() {
                const dtBds = document.getElementsByClassName("data-table")[0]?.getBoundingClientRect()
                if(dtBds){
                    this.tblLeft = (dtBds.left || 0) - 200
                    this.tblRight = (dtBds.right || 0) + 250
                }
            }

            setTblBounds() {
                this.setTblVertBounds()//critical, do it again it's ok
                this.setTblHorizBounds()
                this.groupedBoundsChange.next(true)
            }

            elIsAboveFold(el: HTMLElement | null, top: number): boolean {
                if(el){
                    const elRect = el.getBoundingClientRect()
                    if(el && elRect && elRect.bottom < top)
                        return true
                    return false
                }
                return false;
            }

            elIsBelowFold(el: HTMLElement | null, top: number): boolean {
                if(el){
                    const elRect = el.getBoundingClientRect()
                    if(el && elRect && elRect.top > top)
                        return true
                    return false
                }
                return false;
            }

            scrollBodyForTabbing(multBy: number) {
                const dtb = document.getElementById("dataTableBody")
                if(dtb){
                    const scrlBy = parseInt(this.defltRHgt.replace(/[ ]?px/g, ""))
                    dtb.scrollBy(0, (multBy*scrlBy))
                }
            }

            chartTopIsInView(column: string) {
                const lg = document.getElementById("insField" + this.common.elifyCol(column))
                if(lg){
                const lgTop = lg.getBoundingClientRect().top
                return lgTop <= this.tblBot
                }
                return true
            }

            buildDataFilSrtTracker(data: any) {
                let i = 0
                let obj: any = {}
                const len = data.length
                for(i; i < len; i++)
                    obj[data[i]] = this.getNewTrackerObj(data[i])
                return obj
            }

            resetFilSrtTracker() {
                for(const prop in this.dataFilSrtTracker){
                    const fsObj = this.dataFilSrtTracker[prop]
                    const oType = fsObj["type"]//keep
                    const ddvals = fsObj["selDDVals"]?.map( (v: any) => {v.checked = true; return v})//keep
                    const oWid = fsObj["colWidth"]//keep
                    const sym = fsObj["colCellSymbol"]//keep
                    const min = false;
                    const compToUse = (ddvals && ddvals.length) ? "Equals" : "";
                    this.dataFilSrtTracker[prop] = { filter: "", comparator: compToUse, sort: null, type: oType, selDDVals: ddvals, minimize: min, 
                        freeze: false, colWidth: oWid, colCellSymbol: sym,
                    }
                }
            }

            figureCellText(text: any, notNum: boolean, symbol?: any) {
                if(this.common.isADateObject(text))
                    return { prop: "textContent", value: text.toLocaleDateString() }
                if((text && this.badStrings.indexOf(text) < 0) || (text === 0)){
                    if(notNum){
                        const isProd = true;
                        if(/[<>]/g.test(text) || (!/(blob:)?((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-:]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w\-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w\.\/-]*))?)/g.test(text)))
                            return { prop: "textContent", value: text }
                        let useText = text
                        const urls = text.matchAll(/(blob:)?((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-:]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w\-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w\.\/-]*))?)/g)
                        if(urls){
                            try{
                                let imgs = []
                                let ancs = []
                                const blobSchm = (isProd ? "blob:https://" : "blob:http://")
                                const blobUrl = blobSchm + location.host
                                let i = 0; let a = 0
                                for(const url of urls){
                                    const low = (url[0] && typeof url[0] === "string") ? url[0].toLocaleLowerCase() : "";
                                    if((this.common.mystartsWith(low, "https") || this.common.mystartsWith(low, blobUrl)) && /(blob|\.)/g.test(low)){
                                        if(imgs.indexOf(url[0]) < 0 && (this.common.mystartsWith(low, blobUrl) ||
                                        /\.(webp|jpeg|jpg|png|jfif|pjpeg|pjp|avif)/g.test(url[0].toLocaleLowerCase()))){
                                            imgs.push(url[0].split("?")[0])
                                        } else {
                                            if(ancs.indexOf(url[0]) < 0)
                                                ancs.push(url[0]/*.split("?")[0]*/)
                                        }
                                    }
                                }
                                const ilen = imgs.length
                                const alen = ancs.length
                                for(i; i < ilen; i++)
                                    useText = useText.replace(new RegExp(imgs[i], "g"), ' <img src="'+imgs[i]+'" alt="Image in cell data" /> ')
                                for(a; a < alen; a++){//only get ones with space at first
                                    const anc = ancs[a]
                                    useText = useText.replace(new RegExp((anc.replace(/\?/g, "\\?") + " "), "g"), (' <a href="'+anc+'" target="_blank">'+anc+'</a> '))
                                    if(useText.endsWith(anc))
                                        useText = useText.replace(new RegExp(" " + anc.replace(/\?/g, "\\?"), "g"), (' <a href="'+anc+'" target="_blank">'+anc+'</a>'))
                                    if(useText === anc)
                                        useText = useText.replace(new RegExp(anc.replace(/\?/g, "\\?"), "g"), ('<a href="'+anc+'" target="_blank">'+anc+'</a>'))
                                }
                                if(imgs.length || ancs.length)
                                    return { prop: "innerHTML", value: useText, ancs: ancs }
                                return { prop: "textContent", value: this.common.sanitizeUi(text) };
                            }catch(e){ return { prop: "textContent", value: this.common.sanitizeUi(text) } }
                        }
                        return { prop: "textContent", value: this.common.sanitizeUi(text) }
                    }
                    try{
                        const minFracDigs = (symbol && ["$","€","£","¥","₣","₹"].indexOf(symbol) > -1) ? 2 : 0;
                        if(typeof text === "number")
                            return { prop: "textContent", value: text.toLocaleString(undefined, { minimumFractionDigits: minFracDigs, maximumFractionDigits: 2 }) }
                        const numVal = /\./g.test(text) ? parseFloat(text) : parseInt(text);
                        if(!isNaN(numVal))
                            return { prop: "textContent", value: numVal.toLocaleString(undefined, { minimumFractionDigits: minFracDigs, maximumFractionDigits: 2 }) }
                        return { prop: "textContent", value: this.common.sanitizeUi(text) }
                    } catch(e){
                        return { prop: "textContent", value: this.common.sanitizeUi(text) }
                    }
                }
                return { prop: "textContent", value: " " };
            }

            figureFilterType(col: any): string {
                const item = this.dataFilSrtTracker[col]
                if(item){
                    switch(item.type){
                        case "string":
                            return "text";
                        case "number":
                            return "number";
                        case "date":
                            return "date"
                        default:
                            return "text";
                    }
                }
                return "text"
            }

            mapCompToSym(comp: string) {
                switch(comp){//not all comps will get converted
                    case "Equals":
                    return "=";
                    case "Not Equal":
                    return "!=";
                    case "Less Than":
                    return "<";
                    case "Less Than or Equal":
                    return "<=";
                    case "Greater Than":
                    return ">";
                    case "Greater Than or Equal":
                    return ">=";
                }
                return comp;
            }

            clearAllFocused() {//for editing
                const els = document.getElementsByClassName("focused-el")
                const len = els.length
                for(var i = (len-1); i >= 0; i--)
                    els[i].classList.remove("focused-el")
            }

            clearDCellFcsd() {
                const els = document.getElementsByClassName("dragger-cell-focused")
                const len = els.length
                for(let i = (len-1); i >= 0; i--){
                    const el = els[i]
                    if(el)
                        el.classList.remove("dragger-cell-focused")
                }
            }

            findObjIndxInData(item: any, data?: any[]) {
                try{
                    if(this.primaryKey)
                        return (data || this.mainData).indexOf( (data || this.mainData).find( d => d[this.primaryKey] === item[this.primaryKey]) )
                    let i = 0; let eq = 0;
                    const propLen = Object.keys(item).length
                    const len = (data || this.mainData)?.length
                    for(i; i < len; i++){
                        eq = 0
                        const mD = (data || this.mainData)[i]
                        for(const prop in item){
                            if(item[prop] === mD[prop])
                                eq += 1
                            if(eq === propLen)//they all equal
                                return i
                        }
                    }
                    return -1
                } catch(e) { return -1 }
            }

            nLevelSort(data: any[], sortOrder: string[], obj: any) {
                let sortData = data.filter( (d: any) => true)
                const len = sortOrder.length
                for(var i = (len-1); i >= 0; i--){
                    const field = sortOrder[i]
                    const sortDir = obj[field]["sort"];
                    const dir = sortDir === "asc" ? 1 : -1;
                    const custom = this.customSortService.customSort[sortDir as keyof CustomSort][field];
                    if(custom && typeof custom === "function"){
                        sortData = sortData.sort(custom);
                    } else {
                        sortData = sortData.sort( (a: any, b: any) => { 
                            if(!a[field] && a[field] !== 0)
                                return 1
                            if(!b[field] && b[field] !== 0)
                                return -1
                            if(a[field] > b[field])
                                return (1*dir)
                            if((a[field] === b[field]) || (JSON.stringify(a[field]) === JSON.stringify(b[field])))
                                return 0
                            return (-1*dir)
                        })
                    }
                }
                return sortData
            }

            doSortOnField(field: any) {
                const k = this.common.goodLs()
                if(!this.sortOrder.length || this.sortOrder.indexOf(field) < 0){
                    this.sortOrder.push(field)
                    this.dataFilSrtTracker[field]["sort"] = "asc"
                    if(!k){
                    this.sortOrder.reverse() 
                    this.sortOrder.pop()
                    }
                } else {
                    const currSort = this.dataFilSrtTracker[field]["sort"]
                    switch(currSort){
                        case "desc":
                            this.dataFilSrtTracker[field]["sort"] = null
                            this.sortOrder = this.sortOrder.filter( (s: string) => s !== field )
                        break;
                        case "asc":
                            this.dataFilSrtTracker[field]["sort"] = "desc"
                        break;
                    }
                }
                this.currFilData = this.nLevelSort(this.currFilData, this.sortOrder, this.dataFilSrtTracker)
            }

            nLevelFilter(data: any, filterVal: any, ddVals: any, comparator: any, field: any) {
                const sixHrs = (1000*60*60*6)
                const oneDay = (1000*60*60*24)
                const symReg = new RegExp(/[$€£₹¥¢\,]/, "g")
                const isDtReg = new RegExp(/\d+(\/|-)\d+(\/|-)\d+/)
                if(filterVal && typeof filterVal === "string"){
                    filterVal = filterVal.toLocaleLowerCase()
                    if(!this.common.idCol(field) && !isDtReg.test(filterVal) && !isNaN(parseInt(filterVal.replace(symReg, ""))))//not viewed as num, but can be
                        filterVal = /\./g.test(filterVal) ? parseFloat(filterVal.replace(symReg, "")) : parseInt(filterVal.replace(symReg, ""))
                    if(this.common.testShortDate(filterVal) || this.common.testISODate(filterVal) || this.common.testLongDate(filterVal))
                        filterVal = new Date(filterVal)
                }
                return data.filter( (d: any) => {
                    if(!ddVals && (!filterVal && filterVal != "0") && (!comparator || (comparator && comparator !== "Not Empty" && comparator !== "Empty")))
                        return true
                    let colVal = d[field]
                    if(typeof colVal === "string")
                        colVal = colVal.toLocaleLowerCase()
                    if(!comparator){//what we did originally
                        if(ddVals && ddVals.length){
                            const chkdVs = ddVals.filter( (d: any) => d.checked ).
                            map( (v: any) => typeof v.value === "string" ? v.value.toLocaleLowerCase() : v.value )
                            if(chkdVs.length === ddVals.length){
                                chkdVs.push(null)
                                chkdVs.push("")
                            }
                            return chkdVs.indexOf(colVal) > -1
                        } else {
                            if(typeof colVal === "string")
                                return (colVal == filterVal || colVal.startsWith(filterVal) || colVal.indexOf(filterVal) > -1)
                            if(typeof colVal === "number")
                                return (colVal == filterVal)//assume equals
                            if(this.common.isADateObject(filterVal) && this.common.isADateObject(colVal))
                                return Math.abs(colVal.getTime() - filterVal.getTime()) < sixHrs
                            return colVal == filterVal
                        }
                    } else {
                        if(comparator === "Equals"){
                            if(ddVals && ddVals.length){
                                const chkdVs = ddVals.filter( (d: any) => d.checked ).
                                map( (v: any) => typeof v.value === "string" ? v.value.toLocaleLowerCase() : v.value )
                                if(chkdVs.length === ddVals.length){
                                    chkdVs.push(null)
                                    chkdVs.push("")
                                }
                                return chkdVs.indexOf(colVal) > -1
                            } else {
                                if(this.common.isADateObject(filterVal) && this.common.isADateObject(colVal))
                                    return Math.abs(colVal.getTime() - filterVal.getTime()) < sixHrs
                                return colVal == filterVal
                            }
                        }
                        if(comparator === "Not Equal" || comparator === "Not on"){
                            if(ddVals && ddVals.length){
                                const chkdVs = ddVals.filter( (d: any) => !d.checked ).
                                map( (v: any) => typeof v.value === "string" ? v.value.toLocaleLowerCase() : v.value )
                                return chkdVs.indexOf(colVal) > -1
                            } else {
                                if(this.common.isADateObject(filterVal) && this.common.isADateObject(colVal))
                                    return Math.abs(colVal.getTime() - filterVal.getTime()) > oneDay
                                return colVal != filterVal
                            } 
                        }
                        if(comparator === "Contains")
                            return colVal && ((typeof colVal === "string" && colVal.indexOf(filterVal) > -1) || colVal == filterVal)
                        if(comparator === "Starts With")
                            return colVal && ((typeof colVal === "string" && colVal.startsWith(filterVal)) || (typeof colVal !== "string" && colVal.toString().startsWith(filterVal)))
                        if(comparator === "Ends With")
                            return colVal && ((typeof colVal === "string" && colVal.endsWith(filterVal)) || (typeof colVal !== "string" && colVal.toString().endsWith(filterVal)))
                        if(comparator === "Less Than" || comparator === "Before")
                            return colVal < filterVal
                        if(comparator === "Less Than or Equal")
                            return colVal <= filterVal
                        if(comparator === "Greater Than" || comparator === "After")
                            return colVal > filterVal
                        if(comparator === "Greater Than or Equal")
                            return colVal >= filterVal
                        if(comparator === "Not Empty"){
                            if(ddVals && ddVals.length && this.hasUnchkdDDVals(this.dataFilSrtTracker[field])){
                                const chkdVs = ddVals.filter( (d: any) => d.checked && d.value ).
                                map( (v: any) => typeof v.value === "string" ? v.value.toLocaleLowerCase() : v.value )
                                return chkdVs.indexOf(colVal) > -1
                            }
                            if(!filterVal && filterVal != "0")
                                return !!colVal || (colVal === 0)//just return non empty
                            //treat it like normal filter
                            if(typeof colVal === "string")
                                return (colVal == filterVal || colVal.startsWith(filterVal) || colVal.indexOf(filterVal) > -1)
                            if(typeof colVal === "number")
                                return (colVal == filterVal || colVal.toString().startsWith(filterVal) || colVal.toString().indexOf(filterVal) > -1)
                            if(this.common.isADateObject(filterVal) && this.common.isADateObject(colVal))
                                return Math.abs(colVal.getTime() - filterVal.getTime()) < sixHrs
                            return colVal == filterVal
                        }
                        if(comparator === "Empty")
                            return (!colVal && colVal !== 0)
                        return false
                    }
                }).sort( (a: any, b: any) => { 
                    if(comparator)
                        return 0
                    const colVal = a[field]
                    if(colVal && typeof colVal === "string")
                        return (colVal.toLocaleLowerCase() == filterVal || colVal.toLocaleLowerCase().startsWith(filterVal)) ? -1 : 1
                    if(colVal && typeof colVal === "number")
                        return (colVal == filterVal || colVal.toString().startsWith(filterVal)) ? -1 : 1
                    return 0
                 })
            }
    
            columnFilter(dataI: any[], field: string, dataObj: any, sortOrder: string[], manual: any) {
                if(manual && !this.displayOnlySelRows && !dataObj[field].filter && this.arefilSrtTrkPropsDefault(true))
                    return this.currFilData = this.mainData.filter( (d: any) => true )
                const initData = !this.displayOnlySelRows ? dataI :
                dataI.filter( (d: any, ind: any) => { return this.currSelRows.indexOf(ind) > -1 })
                let dataM = this.nLevelFilter(initData, dataObj[field].filter, dataObj[field].selDDVals, dataObj[field].comparator, field)
                const doWithoutFilt = ["Not Empty", "Empty"]
                for(const prop in dataObj){
                    if(field === prop) 
                        continue;
                    if((dataObj[prop].filter || this.hasUnchkdDDVals(dataObj[prop])) || (dataObj[prop].comparator && doWithoutFilt.indexOf(dataObj[prop].comparator) > -1))
                        dataM = this.nLevelFilter(dataM, dataObj[prop].filter, dataObj[prop].selDDVals, dataObj[prop].comparator, prop)
                }
                this.currFilData = this.nLevelSort(dataM, sortOrder, dataObj)
                return this.currFilData
            }

            hasUnchkdDDVals(obj: any) {
                if(obj && obj.selDDVals && obj.selDDVals.length)
                    return obj.selDDVals.filter( (v: any) => v && !v.checked ).length
                return false
            }

            getAllFilSrtInfo(): string {
                let filinfo = "Filtered By:";
                let srtinfo = "Sorted By:";
                const doWithoutFilt = ["Not Empty", "Empty"]
                const initB = " <span>";
                for(const prop in this.dataFilSrtTracker){
                    const obj = this.dataFilSrtTracker[prop]
                    const colNm = this.common.sanitizeUi(this.common.titleCase(prop));
                    if(obj && (obj.filter || this.hasUnchkdDDVals(obj) || (obj.comparator && doWithoutFilt.indexOf(obj.comparator) > -1))){
                        const comp = this.mapCompToSym(obj.comparator ? obj.comparator : (obj.type === "string" ? "Contains" : "Equals"))
                        let propFilTxt = (initB + colNm + "</span> " + comp)
                        if(obj.filter)
                            propFilTxt += (initB + this.common.sanitizeUi(obj.filter) + "</span>");
                        if(!obj.filter && obj.selDDVals && obj.selDDVals.length && this.hasUnchkdDDVals(obj)){
                            const chkdVals = obj.selDDVals.filter( (v: any) => v && v.checked ).map( (v: any) => v.value).join()
                            propFilTxt += (initB + chkdVals + "</span>");
                        }
                        if(propFilTxt.endsWith("Equals"))
                            propFilTxt = "";
                        if(filinfo === "Filtered By:"){
                            filinfo += propFilTxt
                        } else {
                            filinfo += ("," + propFilTxt)
                        }
                    }
                }
                let s = 0
                const solen = this.sortOrder.length
                for(s; s < solen; s++){
                    const prop = this.sortOrder[s]
                    const obj = this.dataFilSrtTracker[prop]
                    if(obj && obj.sort){
                        const colNm = this.common.sanitizeUi(this.common.titleCase(prop));
                        const propSrtTxt = (initB + colNm + "</span> " + obj.sort)
                        if(srtinfo === "Sorted By:"){
                            srtinfo += propSrtTxt
                        } else {
                            srtinfo += ("," + propSrtTxt)
                        }
                    }
                }
                if(filinfo === "Filtered By:")
                    filinfo = "";
                if(srtinfo === "Sorted By:")
                    srtinfo = "";
                if(filinfo && srtinfo)
                    return (" &bull; " + filinfo + " &bull; " + srtinfo)
                if(filinfo && !srtinfo)
                    return (" &bull; " + filinfo)
                if(!filinfo && srtinfo)
                    return (" &bull; " + srtinfo)
                return "";
            }

            public validationEndpoint: string = "https://deebodata.com/api/validate-license"//NEVER CHANGE THIS

            easyFilter(val: any, dataI: any[], sortOrder: string[]) {
                const initData = !this.displayOnlySelRows ? dataI :
                dataI.filter( (d: any, ind: any) => { return this.currSelRows.indexOf(ind) > -1 })
                let dataM = this.allDataFilter(val, initData)
                this.currFilData = this.nLevelSort(dataM, sortOrder, this.dataFilSrtTracker)
            }

            allDataFilter(filterVal: any, data: any[]) {
                const sixHrs = (1000*60*60*6)
                const symReg = new RegExp(/[$€£₹¥¢\,]/, "g")
                const isDtReg = new RegExp(/\d+(\/|-)\d+(\/|-)\d+/)
                if(filterVal && typeof filterVal === "string"){
                    filterVal = filterVal.toLocaleLowerCase()
                    if(!isDtReg.test(filterVal) && !isNaN(parseInt(filterVal.replace(symReg, ""))))//not viewed as num, but can be
                        filterVal = /\./g.test(filterVal) ? parseFloat(filterVal.replace(symReg, "")) : parseInt(filterVal.replace(symReg, ""))
                    if(this.common.testShortDate(filterVal) || this.common.testISODate(filterVal) || this.common.testLongDate(filterVal))
                        filterVal = new Date(filterVal)
                }
                return data.filter( (d: any) => {
                    if(!filterVal && filterVal != "0")
                        return true
                    for(const prop in d){
                        let colVal = d[prop]
                        if(typeof colVal === "string")
                            colVal = colVal.toLocaleLowerCase()
                        if(typeof colVal === "string" && (colVal == filterVal || colVal.startsWith(filterVal) || colVal.indexOf(filterVal) > -1))
                            return true
                        if(typeof colVal === "number" && (colVal == filterVal || colVal.toString().startsWith(filterVal) || colVal.toString().indexOf(filterVal) > -1))
                            return true
                        if(this.common.isADateObject(filterVal) && this.common.isADateObject(colVal) && 
                            (Math.abs(colVal.getTime() - filterVal.getTime()) < sixHrs || (colVal == filterVal || 
                            colVal.startsWith(filterVal) || colVal.indexOf(filterVal) > -1)))
                                return true
                        if(colVal == filterVal)
                            return true
                    }
                    return false
                })
            }

            arefilSrtTrkPropsDefault(ignoreColFM?: any) {
                for(const prop in this.dataFilSrtTracker){
                    // const elId= prop.replace(/ /g, this.common.uniSep)
                    const obj = this.dataFilSrtTracker[prop]
                    if(obj && (obj.filter || obj.comparator || obj.sort || obj.minimize || obj.freeze || obj.selDDVals)){
                        const fm = ignoreColFM ? true : (!obj.minimize && !obj.freeze);
                        const defComp = !obj.comparator || ["Equals", "Contains"].indexOf(obj.comparator) > -1;
                        if(!obj.filter && !obj.sort && fm && defComp /*&& document.getElementById("selectComp" + elId) */&& 
                        (!obj.selDDVals || (obj.selDDVals && !obj.selDDVals.filter( (v: any) => { return v && !v.checked } ).length))){
                            //let it go
                        } else
                            return false
                    }
                }
                return true
            }
  
}
