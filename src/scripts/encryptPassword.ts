

// import {
//   publicEncrypt,
//   constants,
// } from "node:crypto";

// import { readFileSync } from "node:fs";
// import { resolve } from "node:path";

// // Load RSA public key
// const publicKey = readFileSync(
//   resolve(process.cwd(), "public.pem"),
//   "utf8"
// );

// // Encrypt password
// export const encryptPassword = (password: string): string => {
//   const encryptedPassword = publicEncrypt(
//     {
//       key: publicKey,
//       padding: constants.RSA_PKCS1_OAEP_PADDING,
//       oaepHash: "sha256",
//     },
//     Buffer.from(password, "utf8")
//   );

//   return encryptedPassword.toString("base64");
// };

// // Read password from command-line arguments
// const password = process.argv[2];

// if (!password) {
//   throw new Error("Please provide a password.");
// }

// // Generate encrypted password
// const encryptedPassword = encryptPassword(password);

// // Print only encrypted password
// console.log(encryptedPassword);

// // import {
// //   publicEncrypt,
// //   constants,
// // } from "crypto";

// // import { readFileSync } from "fs";
// // import { resolve } from "node:path";

// // // Load RSA public key
// // const publicKey = readFileSync(
// //   resolve(process.cwd(), "public.pem"),
// //   "utf8"
// // );

// // // Encrypt password
// // export const encryptPassword = (password: string): string => {

// //   const encryptedPassword = publicEncrypt(
// //     {
// //       key: publicKey,
// //       padding: constants.RSA_PKCS1_OAEP_PADDING,
// //       oaepHash: "sha256",
// //     },
// //     Buffer.from(password, "utf8")
// //   );

// //   return encryptedPassword.toString("base64");
// // };
