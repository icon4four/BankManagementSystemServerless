
import {
  privateDecrypt,
  constants,
} from "node:crypto";

import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";

const secretsManager = new SecretsManagerClient({
  region: process.env.AWS_REGION,
});

const SECRET_ARN = process.env.RSA_PRIVATE_KEY_SECRET_ARN;

let privateKeyPromise: Promise<string> | undefined;

const getPrivateKey = async (): Promise<string> => {
  if (!SECRET_ARN) {
    throw new Error("RSA_PRIVATE_KEY_SECRET_ARN is not configured.");
  }

  if (!privateKeyPromise) {
    privateKeyPromise = secretsManager
      .send(
        new GetSecretValueCommand({
          SecretId: SECRET_ARN,
        })
      )
      .then((result) => {
        if (!result.SecretString) {
          throw new Error("RSA private key secret is empty.");
        }

        const secret = JSON.parse(result.SecretString);

        // Read private key from nested value property
        const privateKeyValue = secret.privateKey?.value;

        if (
          typeof privateKeyValue !== "string" ||
          !privateKeyValue.trim()
        ) {
          throw new Error("RSA private key is missing from the secret.");
        }

        // Convert escaped newline characters into actual newlines
        return privateKeyValue.replace(/\\n/g, "\n");
      })
      .catch((error) => {
        privateKeyPromise = undefined;
        throw error;
      });
  }

  return privateKeyPromise;
};

export const decryptPassword = async (
  encryptedPassword: string
): Promise<string> => {
  const privateKey = await getPrivateKey();

  const decryptedPassword = privateDecrypt(
    {
      key: privateKey,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    Buffer.from(encryptedPassword, "base64")
  );

  return decryptedPassword.toString("utf8");
};
