import { addDays, calculateMean, calculateSum, getDOMRect, groupBy, maxDate, minDate } from "../../src/utils/utils"
import { test, expect } from "@jest/globals"

test("Testing groupBy", () => {
    const obj1 = {"key": "group 1", "values": 1}
    const obj2 = {"key": "group 1", "values": 2}
    const obj3 = {"key": "group 2", "values": 3}
    const arr = [obj1, obj2, obj3]
    const result = [{"key": "group 1", "value": [obj1, obj2]}, {"key": "group 2", "value": [obj3]}]
    expect(groupBy(arr, "key")).toEqual(result)
})

test("Testing calculateSum", () => {
    const values = [1, 2, 3]
    expect(calculateSum(values)).toBe(6)
})

test("Testing calculateMean", () => {
    const values = [1, 2, 3]
    expect(calculateMean(values)).toBe(2)
})

test("Testing getDOMRect", () => {
    document.body.innerHTML = `<div id="test"></div>`
    const actualDiv = getDOMRect("#test")
    const expectedDiv = document.querySelector("#test")?.getBoundingClientRect()
    expect(actualDiv).toEqual(expectedDiv)
})

test("Testing addDays", () => {
    const date = new Date("2020-01-01")
    expect(addDays(date, 30)).toEqual(new Date("2020-01-31"))
})

test("Testing minDate", () => {
    const dates = [new Date("2020-01-01"), new Date("2021-01-01"), new Date("2022-01-01")]
    expect(minDate(dates)).toEqual(new Date("2020-01-01"))
})

test("Testing maxDate", () => {
    const dates = [new Date("2020-01-01"), new Date("2021-01-01"), new Date("2022-01-01")]
    expect(maxDate(dates)).toEqual(new Date("2022-01-01"))
})