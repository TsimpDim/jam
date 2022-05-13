import { formatDate } from "@angular/common";
import { Injectable } from "@angular/core";

@Injectable({
    providedIn: 'root'
})
export class Utils {
    getProperDateFromField(field: string) {
        let inputDate = new Date(field);
        return formatDate(inputDate, 'yyyy-MM-dd', 'en_US');
    }

    getProperDisplayDate(date: string) {
        let inputDate = new Date(date);
        return formatDate(inputDate, 'MM/dd/yyyy', 'en_US');
    }
}