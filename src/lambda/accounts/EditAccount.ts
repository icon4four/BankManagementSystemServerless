import type { APIGatewayProxyEvent, APIGatewayProxyResult} from "aws-lambda";
import { groupName } from "../../utils/groupNameUtil.js";
import { getTableValue ,updateTableValues } from "../../services/dynamodbService.js";
import { role } from "../../utils/groupByRoleUtil.js";
import { response } from "../../helpers/response.js";
import { validation } from "../../validations/validateEditDetails.js";

const ACCOUNT_TABLE_NAME=process.env.ACCOUNTS_TABLE!;
export const handler = async(
    event:APIGatewayProxyEvent
):Promise<APIGatewayProxyResult>=>{
    try{

        console.log("EditAccount Lambda invoked");

        //step 1: Get account id from api
        const accountId = Number(event.pathParameters?.accountId);

        const claims = event.requestContext.authorizer?.claims;

        const groups =groupName(claims)
        

        const accountResult = await getTableValue(ACCOUNT_TABLE_NAME,"accountId",accountId)

        const correctRole=role(accountResult.Item,groups)

        if(correctRole===false){
            return response(403,{
                success:false,
                message:"You are not authorized to edit this account"
            })
        }
        const allowedFields=["branch"];

        const validationResult=validation(event.body,allowedFields);

        if(!validationResult.success){
            return validationResult.error;
        }
        const updates = validationResult.updates;
        updates.updatedAt = new Date().toISOString();

        const result = await updateTableValues(
              ACCOUNT_TABLE_NAME,
              { accountId },
              updates
            );

         return response(200, {
      message: "Customer updated successfully",
      success: true,
      customer: result.Attributes,
    });
        

    }catch(error){
    console.error("EditCustomer failed:", error);

    return response(500, {
      success: false,
      message: "Unable to update account.",
    });

    }
}