export interface Account{
    readonly accountId:number;
    customerId:number;
    accountNumber:string;
    accountType:"SAVINGS"|"CURRENT";
    balance:number;
    branch:string,
    status:string;
    account_archived:boolean;
    createdAt:string;
}
