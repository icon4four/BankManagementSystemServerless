 // group name of the cognito
 export const groupName = (claims:any)=>{
    const groupsClaim = claims?.["cognito:groups"];
    const groups =
      typeof groupsClaim === "string"
        ? groupsClaim.startsWith("[")
          ? JSON.parse(groupsClaim)
          : groupsClaim.split(",")
        : Array.isArray(groupsClaim)
          ? groupsClaim
          : [];
    return groups
 }


 