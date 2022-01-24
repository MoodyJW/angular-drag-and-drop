import {
  AfterViewInit,
  Component,
  Input,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatTable } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

import { Observable, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

export interface CraftsData {
  position: number;
  id: string;
  entityIds: number[];
  name: string;
  description: string;
  modifiedBy: string;
  modificationDate: Date;
  modifiedById: number;
  status: string;
}

@Component({
  selector: 'ui-max-mt-admin-crafts-table',
  templateUrl: './admin-crafts-table.component.html',
  styleUrls: ['./admin-crafts-table.component.scss'],
})
export class AdminCraftsTableComponent implements AfterViewInit, OnDestroy {
  @ViewChild('table') table: MatTable<any>;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @Input() crafts: CraftsData[];
  @Input() isLoading: boolean;

  formGroup: FormGroup;
  dataSource: MatTableDataSource<CraftsData> = new MatTableDataSource();
  displayedColumns: string[] = [
    'position',
    'name',
    'description',
    'modifiedBy',
    'modificationDate',
    'status',
    'edit',
  ];
  noDataMessage = 'No crafts data to display';
  loadingMessage = 'Loading crafts data...';
  unsubscribe$ = new Subject();

  constructor(formBuilder: FormBuilder) {
    this.formGroup = formBuilder.group({
      searchValue: '',
    });
    this.formGroup.disable();
    this.formGroup.valueChanges
      .pipe(takeUntil(this.unsubscribe$))
      .subscribe((value) => {
        const craftsFilter = {
          ...value,
          searchValue: value.searchValue
            ? value.searchValue.trim().toLowerCase()
            : '',
        };
        this.dataSource.filter = craftsFilter as string;
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes && changes.crafts && changes.crafts.currentValue) {
      this.dataSource.data = this.crafts;
      this.initFilterPredicate();
    }
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  ngOnDestroy(): void {
    this.unsubscribe$.next();
  }

  drop(event: CdkDragDrop<any[]>): void {
    const previousIndex = this.dataSource.data.findIndex(
      (row) => row === event.item.data
    );
    moveItemInArray(this.dataSource.data, previousIndex, event.currentIndex);
    this.dataSource.data = this.dataSource.data.slice();
    localStorage.setItem(
      'crafts-table-order',
      JSON.stringify(this.dataSource.data)
    );
  }

  private initFilterPredicate(): void {
    this.dataSource.filterPredicate = (
      craftsData: CraftsData,
      craftsFilter: any
    ): boolean => {
      if (!craftsFilter.searchValue) return true;

      const craftsDataSearchProps = {
        id: craftsData.id,
        name: craftsData.name,
        description: craftsData.description,
        modifiedBy: craftsData.modifiedBy,
        modificationDate: craftsData.modificationDate,
        status: craftsData.status,
      };

      const filterSearchValue = craftsFilter?.searchValue?.trim().toLowerCase();
      if (!!filterSearchValue) {
        return Object.values(craftsDataSearchProps).some(
          (val: string | Date) => {
            if (typeof val !== 'string') return;
            return val.trim().toLowerCase().includes(filterSearchValue);
          }
        );
      }
    };
    this.formGroup.enable();
    this.dataSource.paginator = this.paginator;
  }
}
