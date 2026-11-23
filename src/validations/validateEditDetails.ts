import type { APIGatewayProxyResult } from "aws-lambda";
import { response } from "../helpers/response.js";

type ValidationResult =
  | {
      success: true;
      updates: Record<string, unknown>;
    }
  | {
      success: false;
      error: APIGatewayProxyResult;
    };

export const validation = (
  eventBody: string | null,
  allowedFields: readonly string[]
): ValidationResult => {

  if (!eventBody) {
    return {
      success: false,
      error: response(400, {
        message: "Request body is required",
        success: false,
      }),
    };
  }

  let input: Record<string, unknown>;

  try {
    input = JSON.parse(eventBody);
  } catch {
    return {
      success: false,
      error: response(400, {
        message: "Invalid JSON request body",
        success: false,
      }),
    };
  }

  const updates: Record<string, unknown> = {};

  for (const field of allowedFields) {
    if (input[field] !== undefined) {
      updates[field] = input[field];
    }
  }

  if (Object.keys(updates).length === 0) {
    return {
      success: false,
      error: response(400, {
        message: "No valid fields provided for update",
        success: false,
      }),
    };
  }

  return {
    success: true,
    updates,
  };
};