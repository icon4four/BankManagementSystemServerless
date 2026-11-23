
import type {   APIGatewayProxyEvent,  APIGatewayProxyResult,} from "aws-lambda";

import { response } from "../../helpers/response.js";

import { getTableValue ,updateTableValues } from "../../services/dynamodbService.js";

import { groupName } from "../../utils/groupNameUtil.js";

import { role } from "../../utils/groupByRoleUtil.js";
import { validation } from "../../validations/validateEditDetails.js";

const CUSTOMER_TABLE_NAME = process.env.CUSTOMERS_TABLE!;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("EditCustomer Lambda invoked");

    // Step 1: Get customer ID and authenticated user details
    const customerId = Number(event.pathParameters?.customerId);

    const claims = event.requestContext.authorizer?.claims;

    const groups= groupName(claims)

    //const cognitoSub = claims?.sub;


    // Step 2: Get the customer to be edited - dynamodbService
    const customerResult = await getTableValue(CUSTOMER_TABLE_NAME,"customerId",customerId)
  
  
    const correctRole=role(customerResult.Item,groups)

    if(correctRole===false){
      return response(403,{
        success:false,
        message:"You are not authorised to edit this customer"
      })
    }

     // Step 4: Allow only specified fields to be updated
    const allowedFields = [
      "firstName",
      "lastName",
      "dateOfBirth",
      "address",
      "phone",
    ] 

    
    
   const validationResult = validation(event.body, allowedFields);

   // Check whether validation failed
   if (!validationResult.success) {
     return validationResult.error;
    }

   const updates = validationResult.updates;

    // Step 6: Add updated date
    updates.updatedAt = new Date().toISOString();

    // Step 7: Update customer using reusable function
    const result = await updateTableValues(
      CUSTOMER_TABLE_NAME,
      { customerId },
      updates
    );

    // Step 8: Return updated customer details
    return response(200, {
      message: "Customer updated successfully",
      success: true,
      customer: result.Attributes,
    });


  } catch (error) {
    console.error("EditCustomer failed:", error);

    return response(500, {
      success: false,
      message: "Unable to update customer.",
    });
  }
};
