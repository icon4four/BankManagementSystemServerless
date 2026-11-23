
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

import { ScanCommand , PutCommand , GetCommand , QueryCommand , UpdateCommand} from "@aws-sdk/lib-dynamodb";

const dynamoDBClient = new DynamoDBClient({});

export const dynamoDB = DynamoDBDocumentClient.from(
  dynamoDBClient,
  {
    marshallOptions: {
      removeUndefinedValues: true,
    },
  }
);
//const CUSTOMER_TABLE=process.env.CUSTOMERS_TABLE!;

// create customer - retriving customerId , createAccount

export const  IdList= async(TABLE_NAME:string,projectionValue:string[])=>{
const result= await dynamoDB.send(
  new ScanCommand({
    TableName:TABLE_NAME ,
    ProjectionExpression: projectionValue.join(",")
  })
)
return result
}

// create customer - put command to store value inside the dynamoDB , -createAccount
export const PutOperation =  async(TABLE_NAME:string,item:Record<string, any>,conditionValue:string)=>{
await dynamoDB.send(
  new PutCommand({
    TableName:TABLE_NAME ,
    Item:item ,
    ConditionExpression:`attribute_not_exists(${conditionValue})`
  })
)
//return true;
}

// retrieve all the details in the dynamodb table - getCustomers

export const tableValue = async(TABLE_NAME:string)=>{
  return await dynamoDB.send(
    new ScanCommand({
      TableName:TABLE_NAME
    })
  )
}

//Get the table with the id - getCustomerById , editCustomer , deleteCustomer
export const getTableValue = async(TABLE_NAME:string,  keyName: string,keyValue:string|number)=>{
  return await dynamoDB.send(
    new GetCommand({
      TableName:TABLE_NAME,
      Key:{
        [keyName]:keyValue,
      },
    })
  )
}


// retriving value from dynamoDB -getCustomerById , deleteCustomers , GetAccounts(2)

export const GSItableValues = async (TABLE_NAME: string,indexName: string,conditionExpression: string, attributeValues: string | number) => {
  return await dynamoDB.send(
  new QueryCommand({
    TableName: TABLE_NAME,
    IndexName: indexName,
    KeyConditionExpression: `${conditionExpression}=:${conditionExpression}`,
    ExpressionAttributeValues: {
      [`:${conditionExpression}`]: attributeValues,
    }
  })
)
}




export const updateTableValues = (
  TABLE_NAME: string,
  key: Record<string, string | number>,
  updates: Record<string, unknown>
) => {
  const updateExpressions: string[] = [];

  const expressionAttributeNames: Record<string, string> = {};
  const expressionAttributeValues: Record<string, unknown> = {};

  Object.entries(updates).forEach(([field, value], index) => {
    const name = `#field${index}`;
    const valueKey = `:value${index}`;

    updateExpressions.push(`${name} = ${valueKey}`);

    expressionAttributeNames[name] = field;
    expressionAttributeValues[valueKey] = value;
  });

  if (updateExpressions.length === 0) {
    throw new Error("No fields provided for update.");
  }

  return dynamoDB.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: key,
      UpdateExpression: `SET ${updateExpressions.join(", ")}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: "ALL_NEW",
    })
  );
};
