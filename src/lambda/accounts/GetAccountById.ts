import { APIGatewayProxyEvent , APIGatewayProxyResult } from "aws-lambda";

import { getTableValue } from "../../services/dynamodbService.js";
import { response } from "../../helpers/response.js";

const ACCOUNT_TABLE_NAME=process.env.ACCOUNTS_TABLE!;

export const handler = async(
    event:APIGatewayProxyEvent
):Promise<APIGatewayProxyResult>=>{
    try{
        console.log("GetAccountById Lambda invoked");

        //step 1: Get account Id from the api path
        const accountId=Number(event.pathParameters?.accountId);

        const result = await getTableValue(ACCOUNT_TABLE_NAME,"accountId",accountId);

        if(!result.Item){
            return response(404,{
                success:404,
                message:"account not found"
            })
        }
        return response(200,{
            success:true,
            message:"account retrieved successfully",
            data:{
                account:result.Item
            }
        })

    }catch(error){
        console.error("GetCustomerById failed:", error);

        return response(500, {
            success: false,
            message: "Unable to retrieve customer.",
        });

    }
}