
import type {   APIGatewayProxyEvent,  APIGatewayProxyResult,} from "aws-lambda";

import { GetCommand } from "@aws-sdk/lib-dynamodb";

import { dynamoDB } from "../../services/dynamodbService.js";
import { response } from "../../helpers/response.js";
import { QueryCommand } from "@aws-sdk/lib-dynamodb";

import { getTableValue ,GSItableValues } from "../../services/dynamodbService.js";

const TABLE_NAME = process.env.CUSTOMERS_TABLE!;
const ACCOUNT_TABLE_NAME = process.env.ACCOUNTS_TABLE!;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("GetCustomerById Lambda invoked");

    // Get customer ID from API path
    const customerId = Number(event.pathParameters?.customerId);

    // Retrieve customer from DynamoDB - in the dynamodbService
   const result = await getTableValue(TABLE_NAME,"customerId",customerId);
    // const result = await dynamoDB.send(
    //   new GetCommand({
    //     TableName: TABLE_NAME,
    //     Key: {
    //       customerId,
    //     },
    //   })
    // );

    if (!result.Item) {
      return response(404, {
        success: false,
        message: "Customer not found.",
      });
    }
    //Retriving account from dynamoDB -retriving value by using primary key using GSI
    const account = await GSItableValues(ACCOUNT_TABLE_NAME,"CustomerIdIndex","customerId",customerId)
//     const account = await dynamoDB.send(
//       new QueryCommand({
//     TableName: ACCOUNT_TABLE_NAME,
//     IndexName: "CustomerIdIndex",
//     KeyConditionExpression: "customerId = :customerId",
//     ExpressionAttributeValues: {
//       ":customerId": customerId,
//     },
//   })
// );
    return response(200, {
      success: true,
      message: "Customer retrieved successfully.",
      data: {
        customer:result.Item,
        accounts:account.Items ?? []
      }
    });

  } catch (error) {
    console.error("GetCustomerById failed:", error);

    return response(500, {
      success: false,
      message: "Unable to retrieve customer.",
    });
  }
};
