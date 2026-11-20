
import type {   APIGatewayProxyEvent,  APIGatewayProxyResult,} from "aws-lambda";

import {  GetCommand,  UpdateCommand,} from "@aws-sdk/lib-dynamodb";

import { dynamoDB } from "../../services/dynamodbService.js";
import { response } from "../../helpers/response.js";

import { getTableValue } from "../../services/dynamodbService.js";

const TABLE_NAME = process.env.CUSTOMERS_TABLE!;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("EditCustomer Lambda invoked");

    // Step 1: Get customer ID and authenticated user details
    const customerId = Number(event.pathParameters?.customerId);

    const claims = event.requestContext.authorizer?.claims;

    const cognitoSub = claims?.sub;
    const groupsClaim = claims?.["cognito:groups"];

    const groups =
      typeof groupsClaim === "string"
        ? groupsClaim.startsWith("[")
          ? JSON.parse(groupsClaim)
          : groupsClaim.split(",")
        : Array.isArray(groupsClaim)
          ? groupsClaim
          : [];

    const isAdmin = groups.includes("ADMIN");
    const isCustomer = groups.includes("CUSTOMER");

    // Step 2: Get the customer to be edited - dynamodbService

    const customerResult = await getTableValue(TABLE_NAME,"customerId",customerId)
    // const customerResult = await dynamoDB.send(
    //   new GetCommand({
    //     TableName: TABLE_NAME,
    //     Key: {
    //       customerId,
    //     },
    //   })
    // );

    const customer = customerResult.Item;

    if (!customer) {
      return response(404, {
        success: false,
        message: "Customer not found.",
      });
    }

    // Step 3: Check authorization
    if (!isAdmin) {
      if (
        !isCustomer ||
        customer.cognitoSub !== cognitoSub
      ) {
        return response(403, {
          success: false,
          message: "You are not authorised to edit this customer.",
        });
      }
    }

    // Step 4: Read editable fields from request body
    const input = JSON.parse(event.body!);

    const allowedFields = [ "firstName","lastName","dateOfBirth","address","phone"] as const;

    const updateExpressions: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, unknown> = {};

    // Step 5: Build update expression using only allowed fields
    for (const field of allowedFields) {
      if (input[field] !== undefined) {
        const nameKey = `#${field}`;
        const valueKey = `:${field}`;

        updateExpressions.push(`${nameKey} = ${valueKey}`);

        expressionAttributeNames[nameKey] = field;
        expressionAttributeValues[valueKey] = input[field];
      }
    }

    if (updateExpressions.length === 0) {
      return response(400, {
        success: false,
        message: "No editable customer details provided.",
      });
    }

    // Update the timestamp
    updateExpressions.push("#updatedAt = :updatedAt");

    expressionAttributeNames["#updatedAt"] = "updatedAt";
    expressionAttributeValues[":updatedAt"] = new Date().toISOString();

    // Step 6: Update customer in DynamoDB -dynamodbService
    const result = await dynamoDB.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          customerId,
        },
        UpdateExpression: `SET ${updateExpressions.join(", ")}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ConditionExpression: "attribute_exists(customerId)",
        ReturnValues: "ALL_NEW",
      })
    );

    return response(200, {
      success: true,
      message: "Customer updated successfully.",
      data: result.Attributes,
    });

  } catch (error) {
    console.error("EditCustomer failed:", error);

    return response(500, {
      success: false,
      message: "Unable to update customer.",
    });
  }
};
