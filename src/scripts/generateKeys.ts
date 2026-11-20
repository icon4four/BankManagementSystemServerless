
import { generateKeyPairSync } from "crypto";
import { writeFileSync } from "fs";

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

// Save public key
writeFileSync("public.pem", publicKey);

// Save private key
writeFileSync("private.pem", privateKey, {
  mode: 0o600,
});

console.log("RSA key pair generated successfully.");
