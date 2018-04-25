 export function stringifyErrorReplacer(_, value) {
   if (value instanceof Error) {
     var error = {};
     Object.getOwnPropertyNames(value).forEach((key) => {
       error[key] = value[key];
     });
     return error;
   }
   return value;
 }

 export function stringifyErrorMessageReplacer(_, value) {
  if (value instanceof Error) {
    return value.message;
  }
  return value;
}
