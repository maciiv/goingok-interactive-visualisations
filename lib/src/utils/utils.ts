export function groupBy<T>(arr: Array<T>, criteria: string) {
    const newObj = arr.reduce(function (acc: any, currentValue: any) {
      if (!acc[currentValue[criteria]]) {
        acc[currentValue[criteria]] = [];
      }
      acc[currentValue[criteria]].push(currentValue);
      return acc;
    }, {});
    return newObj;
}