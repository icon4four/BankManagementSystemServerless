import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { groupName } from "../../utils/groupNameUtil.js";
import { getTableValue, updateTableValues } from "../../services/dynamodbService.js";
import { role } from "../../utils/groupByRoleUtil.js";
import { response } from "../../helpers/response.js";

const ACCOUNT_TABLE_NAME=process.env.ACCOUNTS_TABLE!;

export const handler = async(
    event:APIGatewayProxyEvent
):Promise<APIGatewayProxyResult>=>{
    try{
        console.log("DeleteAccount Lambda invoked");

        const accountId=Number(event.pathParameters?.accountId);

        const claims = event.requestContext.authorizer?.claims;
        //const cognitoSub = claims?.sub;
        const groups=groupName(claims)

        const accountResult=await getTableValue(ACCOUNT_TABLE_NAME,"accountId",accountId)

        const correctRole=role(accountResult.Item,groups)

        if(correctRole===false){
          return response(403,{
            success:false,
            message:"You are not authorised to edit this customer"
          })
        }
        if(accountResult.Item!.status !=="ACTIVE"||accountResult.Item!.account_archived){
            return response(400, {
                success: false,
                message: "Customer is already inactive.",
            });

        }
        const currentDate = new Date().toISOString();
        await updateTableValues(
            ACCOUNT_TABLE_NAME,
            {
                accountId
            },
            {
                status:"INACTIVE",
                account_archived:false,
                updatedAt:currentDate,
            }
        )
        console.log(`Account ${accountId} deactivated successfully`);

        return response(200, {
      success: true,
      message: "Account deactivated successfully.",
      data: {
        accountId,
        status: "INACTIVE",
      },
    });



    }catch(error){
        console.error("DeleteCustomer failed:", error);
        return response(500, {
            success: false,
            message: "Unable to deactivate customer.",
        });
    }
}
