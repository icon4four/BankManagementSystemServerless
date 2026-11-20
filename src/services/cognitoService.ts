import { SignUpCommand , AdminConfirmSignUpCommand , AdminAddUserToGroupCommand } from "@aws-sdk/client-cognito-identity-provider";

import {
  CognitoIdentityProviderClient,
} from "@aws-sdk/client-cognito-identity-provider";

export const cognito = new CognitoIdentityProviderClient({});


// create user in cognito
export const CognitoResult = async(App_Client_Id:string,userName:string,password:string,userAttributeName:string)=>{
  return await cognito.send(
    new SignUpCommand({
      ClientId:App_Client_Id,
      Username:userName,
      Password:password,
      UserAttributes:[
        {
          Name:userAttributeName,
          Value:userName
        }
      ]
    })
  )
}

// confirm the Cognito user
export const confirmCognito = async (User_Pool_Id:string,userName:string)=>{
  await cognito.send(
    new AdminConfirmSignUpCommand({
      UserPoolId:User_Pool_Id,
      Username:userName
    })
  )
}

//Add the user to the selected Cognito group

export const Cognito_Group = async (User_Pool_Id:string,userName:string,group:string)=>{
  await cognito.send(
    new AdminAddUserToGroupCommand({
      UserPoolId:User_Pool_Id,
      Username:userName,
      GroupName:group
    })
  )
}
