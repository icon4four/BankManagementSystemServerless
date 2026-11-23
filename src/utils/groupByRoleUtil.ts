
export const role = (item:any,groups:string)=>{
    const isAdmin=groups.includes("ADMIN");
    const isCustomer = groups.includes("CUSTOMER");
    if(!item){
        return false;
    }
    if(!isAdmin){
        if(!isCustomer){
            return false;
        }
    }
    return true;
}