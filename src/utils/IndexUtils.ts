
 import { IdList } from "../services/dynamodbService.js";
 export const  Ids = async(TableName:string,projectionValue:string[],startValue:number)=>{

     const result = await IdList(TableName,projectionValue);

    const IDS = (result.Items ?? []).map(
       (item) => Number(item.customerId)
     );

     const Id = Math.max(startValue, ...IDS) + 1;
     return Id;
 }


 // group name of the cognito
 export const groupName = (claims:any)=>{
    const groupsClaim = claims?.["cognito:groups"];
    const groups =
      typeof groupsClaim === "string"
        ? groupsClaim.startsWith("[")
          ? JSON.parse(groupsClaim)
          : groupsClaim.split(",")
        : Array.isArray(groupsClaim)
          ? groupsClaim
          : [];
    return groups
 }