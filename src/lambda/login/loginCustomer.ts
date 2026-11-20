import type {  APIGatewayProxyEvent,   APIGatewayProxyResult, } from "aws-lambda";

import {  InitiateAuthCommand, } from "@aws-sdk/client-cognito-identity-provider";

import { cognito } from "../../services/cognitoService.js";
import { response } from "../../helpers/response.js";

import { decryptPassword } from "../../helpers/encryption.js";

const APP_CLIENT_ID = process.env.COGNITO_APP_CLIENT_ID!;

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("Login Lambda invoked");

    // Step 1: Get email and password
    const input = JSON.parse(event.body!);

     const decryptedPassword = await decryptPassword(input.password);

    // Step 2: Authenticate user through Cognito
    const result = await cognito.send(
      new InitiateAuthCommand({
        AuthFlow: "USER_PASSWORD_AUTH",
        ClientId: APP_CLIENT_ID,
        AuthParameters: {
          USERNAME: input.email,
          PASSWORD: decryptedPassword,
        },
      })
    );

    // Step 3: Return authentication tokens
    return response(200, {
      success: true,
      message: "Login successful",
      data: {
        accessToken: result.AuthenticationResult?.AccessToken,
        idToken: result.AuthenticationResult?.IdToken,
        refreshToken: result.AuthenticationResult?.RefreshToken,
        expiresIn: result.AuthenticationResult?.ExpiresIn,
        tokenType: result.AuthenticationResult?.TokenType,
      },
    });

  } catch (error) {
    console.error("Login failed:", error);

    return response(401, {
      success: false,
      message: "Invalid email or password.",
    });
  }
};