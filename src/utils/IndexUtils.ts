
 import { IdList } from "../services/dynamodbService.js";
 export const  Ids = async(items:Record<string,unknown>[],fieldName:string,startValue:number)=>{

     //const result = await IdList(TableName,projectionValue);
    const IDS = items.map(
       (item) => Number(item[fieldName])
     ).filter(Number.isFinite)

     const Id = Math.max(startValue, ...IDS) + 1;
     return Id;
 }

export const prefixIds = async(items:Record<string,unknown>[],fieldName:string,prefix:string,startValue:number)=>{
    const IDS =items.map(
        (item)=>Number(String(item[fieldName]).slice(2))

    )
    const accNumVal=Math.max(startValue , ...IDS)+1;
    const accNum=prefix+accNumVal;
    return accNum;
}