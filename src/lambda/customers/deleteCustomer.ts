
import type { APIGatewayProxyEvent,  APIGatewayProxyResult,} from "aws-lambda";

import { GetCommand, QueryCommand, TransactWriteCommand,} from "@aws-sdk/lib-dynamodb";

import { dynamoDB } from "../../services/dynamodbService.js";
import { response } from "../../helpers/response.js";

import { getTableValue ,GSItableValues } from "../../services/dynamodbService.js";

const CUSTOMERS_TABLE = process.env.CUSTOMERS_TABLE!;
const ACCOUNTS_TABLE = process.env.ACCOUNTS_TABLE!;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("DeleteCustomer Lambda invoked");

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

    // Step 2: Retrieve customer
    const customerResult =await getTableValue(CUSTOMERS_TABLE,"customerId",customerId)
    // const customerResult = await dynamoDB.send(
    //   new GetCommand({
    //     TableName: CUSTOMERS_TABLE,
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
          message: "You are not authorised to delete this customer.",
        });
      }
    }

    // Step 4: Check whether customer is already inactive
    if (customer.status !== "ACTIVE" || customer.customer_archived) {
      return response(400, {
        success: false,
        message: "Customer is already inactive.",
      });
    }

    // Step 5: Retrieve all accounts belonging to the customer
    const accountsResult = await GSItableValues(ACCOUNTS_TABLE,"CustomerIdIndex","customerId",customerId)
    
    // const accountsResult = await dynamoDB.send(
    //   new QueryCommand({
    //     TableName: ACCOUNTS_TABLE,
    //     IndexName: "CustomerIdIndex",
    //     KeyConditionExpression: "customerId = :customerId",
    //     ExpressionAttributeValues: {
    //       ":customerId": customerId,
    //     },
    //   })
    // );

    const accounts = accountsResult.Items ?? [];

    // Step 6: Check that all account balances are zero
    const hasBalance = accounts.some(
      (account) => Number(account.balance) !== 0
    );

    if (hasBalance) {
      return response(400, {
        success: false,
        message:
          "Customer cannot be deactivated because one or more accounts have a balance.",
      });
    }

    // Step 7: Check that all accounts are active
    // const hasInactiveAccount = accounts.some(
    //   (account) => account.status !== "ACTIVE"
    // );

    // if (hasInactiveAccount) {
    //   return response(400, {
    //     success: false,
    //     message:
    //       "Customer cannot be deactivated because one or more accounts are already inactive.",
    //   });
    // }

    // Step 8: Prepare transaction updates
    const currentDate = new Date().toISOString();

    const transactionItems = [
      ...accounts.map((account) => ({
        Update: {
          TableName: ACCOUNTS_TABLE,
          Key: {
            accountId: account.accountId,
          },
          UpdateExpression:
            "SET #status = :status, updatedAt = :updatedAt",
          ExpressionAttributeNames: {
            "#status": "status",
          },
          ExpressionAttributeValues: {
            ":status": "INACTIVE",
            ":updatedAt": currentDate,
            ":zero": 0,
            ":active": "ACTIVE",
          },
          ConditionExpression:
            "attribute_exists(accountId) AND balance = :zero AND #status = :active",
        },
      })),

      {
        Update: {
          TableName: CUSTOMERS_TABLE,
          Key: {
            customerId,
          },
          UpdateExpression:
            "SET #status = :status, customer_archived = :archived, updatedAt = :updatedAt",
          ExpressionAttributeNames: {
            "#status": "status",
          },
          ExpressionAttributeValues: {
            ":status": "INACTIVE",
            ":archived": true,
            ":updatedAt": currentDate,
            ":active": "ACTIVE",
            ":notArchived": false,
          },
          ConditionExpression:
            "attribute_exists(customerId) AND #status = :active AND customer_archived = :notArchived",
        },
      },
    ];

    // DynamoDB transactions support a maximum of 100 actions
    if (transactionItems.length > 100) {
      return response(400, {
        success: false,
        message: "Too many accounts to deactivate in one transaction.",
      });
    }

    // Step 9: Update all accounts and customer atomically
    //need to work here 
    await dynamoDB.send(
      new TransactWriteCommand({
        TransactItems: transactionItems,
      })
    );

    console.log(`Customer ${customerId} deactivated successfully`);

    return response(200, {
      success: true,
      message: "Customer and all accounts deactivated successfully.",
      data: {
        customerId,
        status: "INACTIVE",
      },
    });

  } catch (error) {
    console.error("DeleteCustomer failed:", error);

    return response(500, {
      success: false,
      message: "Unable to deactivate customer.",
    });
  }
};
