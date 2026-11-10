export const resources=["products","categories","services","projects","content","company","media","requests","customers","quotations","sales","payments","inventory","documents","reports","users","roles","audit","pricing"] as const;
export const actions=["view","create","update","archive","publish","approve","issue","export","manage"] as const;
export const allScopes=resources.flatMap(r=>actions.map(a=>`${r}.${a}`));
export type AccessProfile={id:string;active:boolean;root:boolean;customerOnly:boolean;roles:string[];allowed:string[];denied:string[]};
export function hasAccess(profile:AccessProfile|null,scope:string) {
  if(!profile?.active||profile.customerOnly||!allScopes.includes(scope))return false;
  if(profile.root)return true;
  return !profile.denied.includes(scope)&&profile.allowed.includes(scope);
}
export function effectiveScopes(roleScopes:string[],overrides:{scope:string;effect:"ALLOW"|"DENY"}[]) {
  const denied=overrides.filter(o=>o.effect==="DENY").map(o=>o.scope);
  return {denied,allowed:[...new Set([...roleScopes,...overrides.filter(o=>o.effect==="ALLOW").map(o=>o.scope)])].filter(s=>allScopes.includes(s)&&!denied.includes(s))};
}
