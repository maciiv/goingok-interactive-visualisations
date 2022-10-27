import d3 from "d3";
import { IAdminAnalyticsData } from "../../data/data.js";

export class Totals {
    private _data: IAdminAnalyticsData[]
    get data() {
        return this._data
    }
    set data(entries: IAdminAnalyticsData[]) {
        this._data = entries.filter(d => d.selected)
        this.render()
    }
    constructor(data: IAdminAnalyticsData[]) {
        this.data = data;
    }
    render() : void {
        let _this = this
        let users =  d3.select<HTMLSpanElement, number>("#users-total .card-title span").datum();
        d3.select<HTMLSpanElement, number>("#users-total .card-title span")
            .datum(d3.sum(_this.data.map(d => d.usersTotal)))
            .transition()
            .duration(1000)
            .tween("html", function() {
                let oldUsers = users == undefined ? 0 : users;
                let newUsers = d3.sum(_this.data.map(d => d.usersTotal))
                return function(t: number) {
                    if(oldUsers < newUsers) {
                        this.innerHTML = (oldUsers + Math.round(t * (newUsers - oldUsers))).toString();
                    } else {
                        this.innerHTML = (oldUsers - Math.round(t * (oldUsers - newUsers))).toString();
                    }
                    
                }
            });
        let refs = d3.select<HTMLSpanElement, number>("#ref-total .card-title span").datum();
        d3.select<HTMLSpanElement, number>("#ref-total .card-title span")
            .datum(d3.sum(_this.data.map(d => d.refTotal)))
            .transition()
            .duration(1000)
            .tween("html", function() {
                let oldRefs = refs == undefined ? 0 : refs;
                let newRefs = d3.sum(_this.data.map(d => d.refTotal))
                return function(t: number) {
                    if(oldRefs < newRefs) {
                        this.innerHTML = (oldRefs + Math.round(t * (newRefs - oldRefs))).toString();
                    } else {
                        this.innerHTML = (oldRefs - Math.round(t * (oldRefs - newRefs))).toString();
                    }
                    
                }
            });
        let ruRate = d3.select<HTMLSpanElement, number>("#ru-rate .card-title span").datum();
        d3.select<HTMLSpanElement, number>("#ru-rate .card-title span")
            .datum(_this.data.length != 0 ? Math.round(d3.mean(_this.data.map(d => (d.ruRate) * 100))) / 100 : 0)
            .transition()
            .duration(1000)
            .tween("html", function() {
                let oldRURate = ruRate == undefined ? 0 : ruRate;
                let newRURate = _this.data.length != 0 ? Math.round(d3.mean(_this.data.map(d => (d.ruRate) * 100))) / 100 : 0;
                return function(t: number) {
                    if(oldRURate < newRURate) {
                        this.innerHTML = (oldRURate + (t * (newRURate - oldRURate))).toFixed(2);
                    } else {
                        this.innerHTML = (oldRURate - (t * (oldRURate - newRURate))).toFixed(2);
                    }
                    
                }
            });
    };
}