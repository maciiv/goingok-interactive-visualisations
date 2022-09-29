export interface IGroupBy<T> {
  key: string,
  value: Array<T>
}

export function groupBy<T>(arr: Array<T>, criteria: string): IGroupBy<T>[] {
    const newObj = arr.reduce(function (acc: IGroupBy<T>[], currentValue: any) {
      if (!acc.map(d => d.key).includes(currentValue[criteria])) {
        acc.push({"key": currentValue[criteria], "value": []})
      }
      acc.find(d => d.key == currentValue[criteria]).value.push(currentValue)
      return acc
    }, [])
    return newObj
}

export function caculateSum(arr: number[]): number {
  let sum = 0
  for (var i = 0; i < arr.length; i++) {
    sum += arr[i]
  }
  return sum
}

export function calculateMean(arr: number[]): number {
  return caculateSum(arr) / arr.length
}

export function getDOMRect(id: string): DOMRect {
  return document.querySelector(id).getBoundingClientRect()
}

export function addDays(date: Date, days: number): Date {
  let result = new Date(date);
  result.setDate(result.getDate() + days)
  return result;
}

export function minDate(arr: Date[]): Date {
  return new Date(Math.min.apply(null, arr))
}

export function maxDate(arr: Date[]): Date {
  return new Date(Math.max.apply(null, arr))
}