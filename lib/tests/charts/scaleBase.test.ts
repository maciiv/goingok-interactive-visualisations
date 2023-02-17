import { ChartSeriesAxis, ChartLinearAxis, ChartTimeAxis } from "../../src/charts/scaleBase"
import { test, expect, describe } from "@jest/globals"

describe("Testing ChartSeriesAxis class", () => {
    const id = "test-id"
    const label = "test-label"
    const domain = ["test 1", "test 2", "test 3"]
    const range = [0, 100]
    const scale = new ChartSeriesAxis(id, label, domain, range)

    test("Testing id", () => {
        expect(scale.id).toBe(id)
    })
    test ("Testing label", () => {
        expect(scale.label).toBe(label)
    })
    test("Testing scale", () => {
        expect(scale.scale.domain()).toEqual(domain)
        expect(scale.scale.range()).toEqual(range)
    })
    test("Testing axis", () => {
        expect(scale.axis.scale().domain()).toEqual(domain)
        expect(scale.axis.scale().range()).toEqual(range)
    })

    describe("Testing withinRange", () => {
        test("Testing below range", () => {
            expect(scale.withinRange(-1)).toBe(0)
        })
        test("Testing in range", () => {
            expect(scale.withinRange(50)).toBe(50)
        })
        test("testing above range", () => {
            expect(scale.withinRange(101)).toBe(100)
        })
    })
})

describe("Testing ChartLinearAxis class", () => {
    const id = "test-id"
    const label = "test-label"
    const domain = [1, 2, 3]
    const range = [0, 100]
    const scale = new ChartLinearAxis(id, label, domain, range)

    test("Testing id", () => {
        expect(scale.id).toBe(id)
    })
    test ("Testing label", () => {
        expect(scale.label).toBe(label)
    })
    test("Testing scale", () => {
        expect(scale.scale.domain()).toEqual([1, 3])
        expect(scale.scale.range()).toEqual(range)
    })
    test("Testing axis", () => {
        expect(scale.axis.scale().domain()).toEqual([1, 3])
        expect(scale.axis.scale().range()).toEqual(range)
    })

    describe("Testing getMinDomain", () => {
        test("Testing below 0", () => {
            expect(scale.getMinDomain([-1, 0, 1])).toBe(0)
        })
        test("Testing in 0", () => {
            expect(scale.getMinDomain([0, 1, 2])).toBe(0)
        })
        test("Testing above 0", () => {
            expect(scale.getMinDomain(domain)).toBe(1)
        })
    })
    
    describe("Testing withinRange", () => {
        test("Testing below range", () => {
            expect(scale.withinRange(-1)).toBe(0)
        })
        test("Testing in range", () => {
            expect(scale.withinRange(50)).toBe(50)
        })
        test("testing above range", () => {
            expect(scale.withinRange(101)).toBe(100)
        })
    })
})

describe("Testing ChartTimeAxis class", () => {
    const id = "test-id"
    const label = "test-label"
    const domain = [new Date("2020-01-01"), new Date("2021-01-01"), new Date("2022-01-01")]
    const range = [0, 100]
    const scale = new ChartTimeAxis(id, label, domain, range)

    test("Testing id", () => {
        expect(scale.id).toBe(id)
    })
    test ("Testing label", () => {
        expect(scale.label).toBe(label)
    })
    test("Testing scale", () => {
        expect(scale.scale.domain()).toEqual([new Date("2020-01-01"), new Date("2022-01-01")])
        expect(scale.scale.range()).toEqual(range)
    })
    test("Testing axis", () => {
        expect(scale.axis.scale().domain()).toEqual([new Date("2020-01-01"), new Date("2022-01-01")])
        expect(scale.axis.scale().range()).toEqual(range)
    })

    describe("Testing withinRange", () => {
        test("Testing below range", () => {
            expect(scale.withinRange(-1)).toBe(0)
        })
        test("Testing in range", () => {
            expect(scale.withinRange(50)).toBe(50)
        })
        test("testing above range", () => {
            expect(scale.withinRange(101)).toBe(100)
        })
    })
})