import {
  publicEncrypt,
  constants,
} from "node:crypto";

import { readFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";

const publicKey = readFileSync("public.pem", "utf8");

const encryptPassword = (password: string): string => {
  const encryptedPassword = publicEncrypt(
    {
      key: publicKey,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    Buffer.from(password, "utf8")
  );

  return encryptedPassword.toString("base64");
};

const main = async () => {
  const readline = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const password = await readline.question("Enter your password: ");

    const encryptedPassword = encryptPassword(password);

    console.log("\nEncrypted password:");
    console.log(encryptedPassword);

  } finally {
    readline.close();
  }
};

main();