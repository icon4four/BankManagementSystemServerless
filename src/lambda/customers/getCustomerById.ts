
import type {   APIGatewayProxyEvent,  APIGatewayProxyResult,} from "aws-lambda";

import { response } from "../../helpers/response.js";

import { getTableValue ,GSItableValues } from "../../services/dynamodbService.js";

const TABLE_NAME = process.env.CUSTOMERS_TABLE!;
const ACCOUNT_TABLE_NAME = process.env.ACCOUNTS_TABLE!;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("GetCustomerById Lambda invoked");

    // step 1: Get customer ID from API path
    const customerId = Number(event.pathParameters?.customerId);

    //step 2: Retrieve customer from DynamoDB - in the dynamodbService
   const result = await getTableValue(TABLE_NAME,"customerId",customerId);
    
    if (!result.Item) {
      return response(404, {
        success: false,
        message: "Customer not found.",
      });
    }
    //stwp 3: Retriving account from dynamoDB -retriving value by using primary key using GSI
    const account = await GSItableValues(ACCOUNT_TABLE_NAME,"CustomerIdIndex","customerId",customerId)

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
