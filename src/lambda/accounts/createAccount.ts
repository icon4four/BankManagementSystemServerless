
import type { APIGatewayProxyEvent , APIGatewayProxyResult } from "aws-lambda";

import type { Account } from "../../types/account.js";
import { response } from "../../helpers/response.js";

import { Ids,prefixIds } from "../../utils/IndexUtils.js";

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
      

        const accountId=await Ids(result.Items??[],"accountId",9999)
        const accountNumber=await prefixIds(result.Items??[],"accountNumber","SB",999999999)
       

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
            createdAt:currentDate,
            updatedAt:currentDate
        };

        await PutOperation(TABLE_NAME,account,"accountId");

      
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

