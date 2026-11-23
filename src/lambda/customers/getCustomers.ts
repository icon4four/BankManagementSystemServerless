
import type {  APIGatewayProxyEvent,  APIGatewayProxyResult, } from "aws-lambda";

import { response } from "../../helpers/response.js";

import { tableValue } from "../../services/dynamodbService.js";

import { groupName } from "../../utils/groupNameUtil.js";

const TABLE_NAME = process.env.CUSTOMERS_TABLE!;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("GetCustomers Lambda invoked");

    // step 1: Get groups from the verified Cognito access token
    const claims = event.requestContext.authorizer?.claims;

    const groups = groupName(claims);

    // Only ADMIN can retrieve all customers
    if (!groups.includes("ADMIN")) {
      return response(403, {
        success: false,
        message: "You are not authorised to view all customers.",
      });
    }

    // Retrieve all customers - it is in the dynamo table
    const result = await tableValue(TABLE_NAME)
   
    return response(200, {
      success: true,
      message: "Customers retrieved successfully.",
      data: result.Items ?? [],
    });

  } catch (error) {
    console.error("GetCustomers failed:", error);

    return response(500, {
      success: false,
      message: "Unable to retrieve customers.",
    });
  }
};
