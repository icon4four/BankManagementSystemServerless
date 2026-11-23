import type { APIGatewayProxyEvent , APIGatewayProxyResult } from "aws-lambda";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { dynamoDB } from "../../services/dynamodbService.js"
import {response} from "../../helpers/response.js"
import { QueryCommand } from "@aws-sdk/lib-dynamodb";

import { GSItableValues } from "../../services/dynamodbService.js";

import { groupName } from "../../utils/groupNameUtil.js";

const ACCOUNT_TABLE_NAME=process.env.ACCOUNTS_TABLE!
const CUSTOMER_TABLE=process.env.CUSTOMERS_TABLE!

export const handler = async(
    event:APIGatewayProxyEvent
):Promise<APIGatewayProxyResult>=>{
    try{
        console.log("GetAccounts lambda invoked");
        const claims = event.requestContext.authorizer?.claims
        const cognitoSub = claims?.sub;

        const group=groupName(claims)
        // const groupsClaim = claims?.["cognito:groups"];

        // const group =
        //           typeof groupsClaim === "string"
        //              ? groupsClaim.startsWith("[")
        //              ?JSON.parse(groupsClaim)
        //              :groupsClaim.split(",")
        //              :Array.isArray(groupsClaim)
        //              ?groupsClaim
        //              :[];
        // when the user is CUSTOMER
        if(group.includes("CUSTOMER")){

            const result =await GSItableValues(CUSTOMER_TABLE,"CognitoSubIndex","cognitoSub",cognitoSub)

            // const result = await dynamoDB.send(
            //     new QueryCommand({
            //         TableName: CUSTOMER_TABLE,
            //         IndexName: "CognitoSubIndex",
            //         KeyConditionExpression: "cognitoSub = :cognitoSub",
            //         ExpressionAttributeValues: {
            //             ":cognitoSub": cognitoSub,
            //         },
            //     })
            // );
            const customerId = result.Items?.[0]?.customerId;

//don't know if this works
            const accounts = await dynamoDB.send(
                new QueryCommand({
                    TableName:ACCOUNT_TABLE_NAME,
                    IndexName:"CustomerIdIndex",
                    KeyConditionExpression:"customerId=:customerId",
                     FilterExpression: "account_archived = :archived",
                    ExpressionAttributeValues:{
                        ":customerId":customerId,
                        ":archived": false,
                    },
                })
            );
            if(!accounts){
                return response(404,{
                    success:false,
                    message:"There are no active accounts"
                })
            }
            return response(200,{
                success:true,
                message:"Active accounts details retrived successfully",
                data:accounts.Items
            })
        }
        else{
            const account = await dynamoDB.send(
                new ScanCommand({
                    TableName:ACCOUNT_TABLE_NAME,
                    FilterExpression: "account_archived = :archived",
                    ExpressionAttributeValues: {
                        ":archived": false,
                    },
                })
            );
            if(!account){
                return response(404,{
                    success:false,
                    message:"There are no active accounts"
                })
            }
            return response(200,{
                success:true,
                message:"Active accounts details retrived successfully",
                data:account.Items
            })
        }
    }catch(error){
        console.error("Account creation failed:",error)

        return response(500,{
            success:false,
            message :error instanceof Error ? error.message:"something went wrong"
        });
    }
}