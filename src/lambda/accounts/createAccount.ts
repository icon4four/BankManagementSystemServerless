
import type { APIGatewayProxyEvent , APIGatewayProxyResult } from "aws-lambda";

import { PutCommand , ScanCommand } from "@aws-sdk/lib-dynamodb";

// import { cognito } from "../../services/cognitoService.js";
// import { DynamoDB } from "@aws-sdk/client-dynamodb";

import type { Account } from "../../types/account.js";
import { response } from "../../helpers/response.js";
import { dynamoDB } from "../../services/dynamodbService.js";

import { IdList ,PutOperation } from "../../services/dynamodbService.js";

const TABLE_NAME=process.env.ACCOUNTS_TABLE!

export const handler = async(
    event:APIGatewayProxyEvent
):Promise<APIGatewayProxyResult>=>{
    try{

        console.log("Account creation started")

        //get the account details
        const input = JSON.parse(event.body!);

        //generate the next accountId
        const result =await IdList(TABLE_NAME,["accountId","accountNumber"])
        // const result = await dynamoDB.send(
        //     new ScanCommand({
        //         TableName:TABLE_NAME,
        //         ProjectionExpression:"accountId,accountNumber"
        //     })
        // );
        const accounts = result.Items ?? [] ;
        const accountIds = accounts.map(
            (item)=>Number(item.accountId)
        );

        const accountId=Math.max(9999, ...accountIds)+1;

        // generate the next account number

        const accountNumbers=accounts.map(
            (item)=>Number(String(item.accountNumber).slice(2))
        )
        const accountNumberValue = Math.max(999999999 , ...accountNumbers)+1;
        const accountNumber = "SB"+accountNumberValue;

        //create the date to add

        const currentDate = new Date().toISOString();

        const account:Account={
            accountId,
            customerId:input.customerId,
            accountNumber,
            accountType:input.accountType,
            balance:input.balance,
            branch:input.branch,
            status:"ACTIVE",
            account_archived:false,
            createdAt:currentDate
        };

        await PutOperation(TABLE_NAME,account,"accountId");

        // await dynamoDB.send(
        //     new PutCommand({
        //         TableName:TABLE_NAME,
        //         Item:account,
        //         ConditionExpression:"attribute_not_exists(accountId)",
        //     })
        // );

        return response(201 , {
            success:true,
            message:"Account created successfully",
            data:account

        });

    }catch(error){
        console.error("Account creation failed:",error)

        return response(500,{
            success:false,
            message :error instanceof Error ? error.message:"something went wrong"
        });
    }
};

