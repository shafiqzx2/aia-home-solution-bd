import "server-only";
export function businessEnabled() { return process.env.AIA_BUSINESS_ENABLED === "true"; }
export function authConfiguration() {
  const secret=process.env.BETTER_AUTH_SECRET,baseURL=process.env.BETTER_AUTH_URL;
  if(!businessEnabled()||!secret||secret.length<32||!baseURL)throw new Error("BUSINESS_NOT_CONFIGURED");
  const url=new URL(baseURL);
  if(process.env.VERCEL_ENV==='production'&&(url.protocol!=='https:'||process.env.AIA_MFA_ENABLED!=='true'||process.env.AIA_PRODUCTION_AUTH_VERIFIED!=='true'))throw new Error('PRODUCTION_SECURITY_NOT_VERIFIED');
  if(process.env.NODE_ENV==="production"&&url.protocol!=="https:"&&!["localhost","127.0.0.1","[::1]"].includes(url.hostname))throw new Error("HTTPS_REQUIRED");
  return {secret,baseURL:url.origin};
}
