
export interface Customer {
  customerId: number;
  cognitoSub: string;

  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  role: "CUSTOMER" | "ADMIN";
  status: string;
  customer_archived: boolean;
  createdAt: string;
  updatedAt: string;
}
