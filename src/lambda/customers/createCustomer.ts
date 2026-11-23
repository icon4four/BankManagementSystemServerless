import type { APIGatewayProxyEvent,APIGatewayProxyResult,} from "aws-lambda";

import { IdList} from "../../services/dynamodbService.js";

import type { Customer } from "../../types/customer.js";
import { response } from "../../helpers/response.js";

import { PutOperation } from "../../services/dynamodbService.js";

import { decryptPassword  } from "../../helpers/encryption.js";
import { Ids } from "../../utils/IndexUtils.js";
import { CognitoResult ,confirmCognito ,Cognito_Group} from "../../services/cognitoService.js";

const CUSTOMER_TABLE_NAME = process.env.CUSTOMERS_TABLE!;
const APP_CLIENT_ID = process.env.COGNITO_APP_CLIENT_ID!;
const USER_POOL_ID = process.env.USER_POOL_ID!;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("Customer registration started");

    // Step 1: Get registration details
    const input = JSON.parse(event.body!);

    //step 2: decrpt the encrypted password
    const decryptedPassword = await decryptPassword(input.password);

    // Step 3: Get the customer table value of customerId
    const customers = await IdList(CUSTOMER_TABLE_NAME,["customerId"]);

    //STEP 4: Generate customerId
    const customerId=await Ids(customers.Items??[],"customerId",999)
  
    // Step 5: Create user in Cognito
    const cognitoResult = await CognitoResult(APP_CLIENT_ID,input.email,decryptedPassword,"email");
    
    // Step 6: Confirm the Cognito user
    await confirmCognito(USER_POOL_ID,input.email)
    
    // Step 7: Add the user to the selected Cognito group
    await Cognito_Group(USER_POOL_ID,input.email,input.role);
    
    // Step 8: Prepare customer profile
    const currentDate = new Date().toISOString();

    const customer: Customer = {
      customerId,
      cognitoSub: cognitoResult.UserSub!,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      phone: input.phone,
      dateOfBirth: input.dateOfBirth,
      address: input.address,
      role: input.role,
      status: "ACTIVE",
      customer_archived: false,
      createdAt: currentDate,
      updatedAt: currentDate,
    };

    // Step 9: Store customer details in DynamoDB
    await PutOperation(CUSTOMER_TABLE_NAME,customer,"customerId");

    console.log(`Customer ${customerId} registered successfully`);

    return response(201, {
      success: true,
      message: "Customer registered successfully",
      data: customer,
    });

  } catch (error) {
    console.error("Customer registration failed:", error);

    return response(500, {
      success: false,
      message: error instanceof Error ? error.message:"something went wrong"
    });
  }
};
