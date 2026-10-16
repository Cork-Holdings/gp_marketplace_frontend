/** Parent navigation maps to existing discovery filters, not invented backend categories. */
export const categoryPaths:Record<string,string>={products:'/?kind=products',food:'/?category=food',services:'/?kind=services',automotive:'/?category=carwash',education:'/coming-soon/education',health:'/coming-soon/health',home:'/?category=repairs',events:'/coming-soon/events',professional:'/coming-soon/professional'};
export function cartQuantity(items:unknown){return Array.isArray(items)?items.reduce((sum,item)=>{const value=Number(item?.quantity);return sum+(Number.isFinite(value)&&value>0?value:0);},0):0;}
export function mobileAccountPaths(role:'admin'|'owner'|'customer'|'guest'){
  return {orders:role==='admin'?'/portal/admin/orders':role==='owner'?'/portal/owner/orders':'/account/ledger',store:role==='admin'?'/portal/admin/stores':role==='owner'?'/portal/owner/stores':'/register/merchant',account:role==='admin'?'/portal/admin':role==='owner'?'/portal/owner':role==='customer'?'/account':'/login'};
}
