import { Component, ElementRef, input, Input, SimpleChanges, ViewChild, } from '@angular/core';
import { DataTableService } from '../../../services/data-table-service';
import { ColumnHeader } from '../../../interfaces/column-header';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-export-component',
  imports: [CommonModule, DecimalPipe, FormsModule],
  templateUrl: './export-component.html',
  styleUrls: ['./export-component.css', '../../../styles.css']
})
export class ExportComponent {

  constructor(private dataTableService: DataTableService,) {

  }

  init = true
  rowsStr = "rows"
  optsOpen = false
  disableExport = input<boolean>(false)
  exporting: boolean = false;
  @Input() count: number = 0
  @Input() columns: ColumnHeader[] = []
  formats: string[] =  ["csv" ,"json" ,"psv" ,"tsv"]
  @ViewChild("ddSelect", { static: true }) ddSelect!: ElementRef<HTMLDivElement>;

  ngOnChanges(changes: SimpleChanges) {
    if(!this.init && changes){
        if(changes["count"]?.currentValue)
            this.rowsStr = this.count === 1 ? "row" : "rows"
    }
  }

  ngOnInit() {
    this.init = false
    this.dataTableService.closeExportOpts.subscribe( e => this.optsOpen = e)
  }

  toggleExportOpts() {
    this.optsOpen = !this.optsOpen
    if(this.optsOpen){
        setTimeout( () => {
            const hgt = this.ddSelect.nativeElement.getBoundingClientRect().height
            this.dataTableService.listenToCloseExportOpts = true;
            this.ddSelect.nativeElement.style.top = -(hgt+3) + "px"
        })
    }
  }

  //EXPORT
  handleExportData(format: string) { 
      if(!this.dataTableService.mainData || !this.dataTableService.mainDataLen){
          this.optsOpen = false;
          this.dataTableService.listenToCloseExportOpts = false
          return alert("Please generate a table then export data!");
      }
      this.exporting = true
      try{
          let data; let cType = "application/octet-stream";
          const dt = new Date().getTime()
          let rows = this.dataTableService.currFilData.filter( function(d) { return true })
          const rLen = rows.length
          const selLen = this.dataTableService.currSelRows.length
          if(selLen && (selLen !== rLen)){
              setTimeout( () => { this.endExportOpts() })
              const sStr = (selLen.toLocaleString(undefined, {maximumFractionDigits:0}) + (" row" + (selLen === 1 ? "" : "s")))
              const rStr = (rLen.toLocaleString(undefined, {maximumFractionDigits:0}) + (" row" + (rLen === 1 ? "" : "s")))
              const noun = (selLen === 1 ? "just that one" : "them only")
              if(!confirm("You've selected " + sStr + " but didn't toggle to export "+noun+", so you're about to export " + rStr + ". Continue?"))
                  return
          }
          if(!rLen){
              setTimeout( () => { this.endExportOpts() })
              return alert("Please include some rows to export.")
          }
          let c = 0
          let cols = []
          const colLen = this.columns.length
          for(c; c < colLen; c++)
              cols.push(this.columns[c].column)
          let title = "MyDataTable"
          const fName = title + dt
          if(format === "csv"){
              cType = "text/csv"
              data = this.whipToDelimForm(rows, cols, ",")
              return this.downloadFileExp(data, cType, fName, format)
          }
          if(format === "tsv")
              data = this.whipToDelimForm(rows, cols, '\t')
          if(format === "psv")
              data = this.whipToDelimForm(rows, cols, '|')
          if(data && (format === "tsv" || format === "psv"))
              return this.downloadFileExp(data, cType, fName, format)
          if(format === "json"){
              let n = 0
              let i = 0
              let useCols = []
              const clen = cols.length
              cType = "application/json"
              for(n; n < clen; n++){
                  if(!this.dataTableService.dataFilSrtTracker[cols[n]]["minimize"])
                      useCols.push(cols[n])
              }
              const uLen = useCols.length
              if(!uLen){
                  setTimeout( () => { this.endExportOpts() })
                  return alert("Please select or unhide some columns to export.")
              }
              if(uLen === clen){//nothing hidden just strinify
                  data = JSON.stringify(rows)
              } else {//we know we have objs by now
                  let json = []
                  for(i; i < rLen; i++){
                      const row = rows[i]
                      if(row && typeof row === "object"){
                          let exp: any = {}
                          for(const prop in row){
                              if(useCols.indexOf(prop) > -1)
                                  exp[prop] = row[prop]
                          }
                          json.push(exp)
                      } else {
                          json.push(row)
                      }
                  }
                  data = JSON.stringify(json)
              }
              if(data)
                  this.downloadFileExp(data, cType, fName, format)
          }
      }catch(e){ 
        setTimeout( () => { this.endExportOpts() })
      }
  }

  downloadFileExp(data: any, cType: string, fName: string, format: string) {
      const blob = new Blob([data], {type: cType})
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", (fName + "." + format));
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url)
      setTimeout( () => { this.endExportOpts() })
  }

  endExportOpts() {
    this.exporting = false;
    this.optsOpen = false;
    this.dataTableService.listenToCloseExportOpts = false
  }

  whipToDelimForm(rows: any[], cols: any[], delim: any) {
      let text = ""
      let i = 0; let n =0; let o = 0;
      const len = rows.length
      let useCols = []
      const clen = cols.length
      for(n; n < clen; n++){
          if(!this.dataTableService.dataFilSrtTracker[cols[n]]["minimize"])
              useCols.push(cols[n])
      }
      const ulen = useCols.length
      for(o; o < ulen; o++)
          text += (useCols[o].replace(/[,\|]/g, "") + (o < (ulen-1) ? delim : ""));//just remove commas in a col header
      if(!text)
          return alert("Please select or unhide some columns to export.")
      text += '\n'
      for(i; i < len; i++){
          const row = rows[i]
          if(typeof row === "object"){
              let z = 0
              for(const prop in row){
                  if(this.dataTableService.dataFilSrtTracker[prop]["minimize"])
                      continue
                  const val: any = row[prop]
                  if(val && typeof val === "string"){
                      if((delim === "," && /,/g.test(val)) || (delim === "|" && /\|/g.test(val)))
                          text += ('"' + val + '"' + (z < (ulen-1) ? delim : ""))
                      else
                          text += ((val || "null") + (z < (ulen-1) ? delim : ""))
                  } else
                      text += ((val || "null") + (z < (ulen-1) ? delim : ""))
                  z += 1
              }
          } else {
              if(row && typeof row === "string"){
                  if((delim === "," && /,/g.test(row)) || (delim === "|" && /\|/g.test(row)))
                      text += ('"' + row + '"')
                  else
                      text += (row || "null")
              } else
                  text += (row || "null")
          }
          if(i < (len-1))
              text += '\n'
      }
      return text
  }
  //EXPORT

}
