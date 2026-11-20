import { generateKeyPairSync } from "node:crypto";
import { writeFileSync, existsSync } from "node:fs";

if (existsSync("public.pem") || existsSync("private.pem")) {
  throw new Error(
    "RSA key files already exist. Do not overwrite them accidentally."
  );
}

const { publicKey, privateKey } = generateKeyPairSync("rsa", {
  modulusLength: 2048,

  publicKeyEncoding: {
    type: "spki",
    format: "pem",
  },

  privateKeyEncoding: {
    type: "pkcs8",
    format: "pem",
  },
});

writeFileSync("public.pem", publicKey);

writeFileSync("private.pem", privateKey, {
  mode: 0o600,
});

console.log("RSA key pair generated successfully.");
console.log("Public key: public.pem");
console.log("Private key: private.pem");