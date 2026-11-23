
import type { APIGatewayProxyEvent,  APIGatewayProxyResult,} from "aws-lambda";

import { response } from "../../helpers/response.js";

import { getTableValue ,GSItableValues, updateTableValues} from "../../services/dynamodbService.js";

import { groupName } from "../../utils/groupNameUtil.js";

import { role } from "../../utils/groupByRoleUtil.js";

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

    //const cognitoSub = claims?.sub;

    const groups = groupName(claims)


    // Step 2: Retrieve customer
    const customerDetail =await getTableValue(CUSTOMERS_TABLE,"customerId",customerId)
  

    const correctRole=role(customerDetail.Item,groups)

     if(correctRole===false){
      return response(403,{
        success:false,
        message:"You are not authorised to edit this customer"
      })
    }

    // Step 4: Check whether customer is already inactive
    if (customerDetail.Item!.status !== "ACTIVE" || customerDetail.Item!.customer_archived) {
      return response(400, {
        success: false,
        message: "Customer is already inactive.",
      });
    }

    // Step 5: Retrieve all accounts belonging to the customer
    const allAccountDetail = await GSItableValues(ACCOUNTS_TABLE,"CustomerIdIndex","customerId",customerId)
    
   

    const accounts = allAccountDetail.Items ?? [];

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


    // Step 8: Prepare transaction updates
    const currentDate = new Date().toISOString();

for (const account of accounts) {
  await updateTableValues(
    ACCOUNTS_TABLE,
    {
      accountId: account.accountId,
    },
    {
      status: "INACTIVE",
      account_archived: false,
      updatedAt: currentDate,
    }
  );
}

console.log("All customer accounts deactivated successfully");

await updateTableValues(
  CUSTOMERS_TABLE,
  {
    customerId,
  },
  {
    status: "INACTIVE",
    customer_archived: false,
    updatedAt: currentDate,
  }
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
