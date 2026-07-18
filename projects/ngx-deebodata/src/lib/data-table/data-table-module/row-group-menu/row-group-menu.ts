import { CommonModule } from '@angular/common';
import { Component, ViewChild, ElementRef, input, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonService } from '../../../services/common-service';
import { DataTableService } from '../../../services/data-table-service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-row-group-menu',
  imports: [CommonModule, FormsModule],
  templateUrl: './row-group-menu.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./row-group-menu.css', '../export-component/export-component.css', '../../../styles.css']
})
export class RowGroupMenu {

  groups = input<string[]>([])
  disableGB = input<boolean>(false)
  optsOpen = signal<boolean>(false)
  enableClear = input<boolean>(false)
  
  @ViewChild("ddSelect", { static: true }) ddSelect!: ElementRef<HTMLDivElement>;

  constructor(public common: CommonService,
              private dataTableService: DataTableService,
  ) { }

  ngOnInit() {
    this.dataTableService.closeGroupByOpts.subscribe( e => { this.setOptsOpen(e) })
  }

  setOptsOpen(e: boolean) {
    this.optsOpen.set(e)
  }

  toggleGroupByOpts() {
    this.setOptsOpen(!this.optsOpen())
    if(this.optsOpen()){
      setTimeout( () => {
        const hgt = this.common.goodLs() ? this.ddSelect.nativeElement.getBoundingClientRect().height : 10;
        this.dataTableService.listenToCloseGroupByOpts = true;
        this.ddSelect.nativeElement.style.top = -(hgt+3) + "px"
      })
    }
  }

  setGrouping(group: string | null) {
    this.dataTableService.currGrouping.next(group)
    if(!group){
      let i = 0
      const len = this.groups().length
      for(i; i < len; i++){
        const el = <HTMLInputElement>document.getElementById("groupby" + this.groups()[i])
        if(el)
          el.checked = false
      }
    }
  } 

}
