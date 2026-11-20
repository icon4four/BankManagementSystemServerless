
// import { createInterface } from "readline/promises";
// import { stdin, stdout } from "process";

// import { encryptPassword } from "./encryptPassword.js";

// const rl = createInterface({
//   input: stdin,
//   output: stdout,
// });

// const registerCustomer = async () => {
//   try {
//     // Step 1: Get customer details
//     const firstName = await rl.question("First name: ");
//     const lastName = await rl.question("Last name: ");
//     const email = await rl.question("Email: ");
//     const password = await rl.question("Password: ");
//     const phone = await rl.question("Phone: ");
//     const dateOfBirth = await rl.question("Date of birth: ");
//     const address = await rl.question("Address: ");
//     const role = await rl.question("Role (ADMIN/CUSTOMER): ");

//     // Step 2: Encrypt password
//     const encryptedPassword = encryptPassword(password);

//     // Step 3: Prepare registration payload
//     const requestBody = {
//       firstName,
//       lastName,
//       email,
//       password: encryptedPassword,
//       phone,
//       dateOfBirth,
//       address,
//       role,
//     };

//     // Step 4: Display payload
//     console.log("\nEncrypted registration payload:");
//     console.log(JSON.stringify(requestBody, null, 2));

//     // Step 5: Copy payload into Postman
//     console.log("\nCopy this JSON into Postman.");
//   } catch (error) {
//     console.error(
//       "Registration encryption failed:",
//       error instanceof Error ? error.message : error
//     );
//   } finally {
//     rl.close();
//   }
// };

// registerCustomer();
