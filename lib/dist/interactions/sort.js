export class Sort {
    sortData(a, b, sorted) {
        if (a < b) {
            if (sorted) {
                return -1;
            }
            else {
                return 1;
            }
        }
        if (a > b) {
            if (sorted) {
                return 1;
            }
            else {
                return -1;
            }
        }
        return 0;
    }
    ;
    setSorted(sorted, option) {
        return sorted == option ? "" : option;
    }
}
