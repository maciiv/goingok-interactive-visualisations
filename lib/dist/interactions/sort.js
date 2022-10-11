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
    setChevronVisibility(id, option) {
        const parentEl = this.getParentEl(id, option);
        document.querySelectorAll(`#${id} .btn-group-toggle i`).forEach(c => c.classList.add("d-none"));
        document.querySelectorAll(`#${id} .btn-group-toggle label`).forEach(c => c.classList.remove("active"));
        parentEl.querySelector("i").classList.remove("d-none");
        parentEl.classList.add("active");
    }
    handleChevronChange(id, option, chevron) {
        const parentEl = this.getParentEl(id, option);
        parentEl.querySelector("i").classList.remove("fa-chevron-down", "fa-chevron-up");
        parentEl.querySelector("i").classList.add(chevron);
    }
    getParentEl(id, option) {
        return document.querySelector(`#${id} input[value="${option}"]`).parentElement;
    }
}
