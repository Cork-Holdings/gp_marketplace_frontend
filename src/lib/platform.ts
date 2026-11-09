import { secureFetch } from './api/crud';
export type Feature = {key:string;name:string;available:boolean};
export type Plan = {name:string;description:string;active:boolean;is_default:boolean;monthly_minor:number;yearly_minor:number;features:string[]};
export type WebsitePage = {title:string;summary:string;body:string;active:boolean};
export type Deal = {title:string;text:string;link:string;image:string;active:boolean};
export type MarketplaceContent = {title:string;subtitle:string;link:string;action:string;active:boolean;deals:Deal[]};
export type PlatformDocument<T=Plan|WebsitePage|MarketplaceContent> = {kind:string;slug:string;data:T;version:number};
export type PlanResponse = {items:PlatformDocument<Plan>[];features:Feature[]};
export type CurrentPlan = {plan:PlatformDocument<Plan>;request:{plan_slug:string;billing_interval:string}|null;billing_enabled:boolean};
export const platformApi = {
 list:<T,>(kind:string,admin=false):Promise<{items:PlatformDocument<T>[];features:Feature[]}>=>secureFetch(`${admin?'/admin/platform':'/content'}/${kind}`),
 save:<T,>(doc:PlatformDocument<T>)=>secureFetch(`/admin/platform/${doc.kind}/${encodeURIComponent(doc.slug)}`,{method:'PUT',body:{data:doc.data,version:doc.version}}),
 current:(merchant:string):Promise<CurrentPlan>=>secureFetch(`/merchants/${merchant}/plan`),
 request:(merchant:string,plan:string,interval:string)=>secureFetch(`/merchants/${merchant}/plan-request`,{method:'POST',body:{plan_slug:plan,billing_interval:interval}}),
 requests:():Promise<{items:PlanRequest[]}>=>secureFetch('/admin/plan-requests'),
 assign:(merchant:string,plan:string,note:string)=>secureFetch(`/admin/merchant-plans/${merchant}`,{method:'PUT',body:{plan_slug:plan,note}}),
};
export type PlanRequest={merchant_id:string;merchant_name:string;plan_slug:string;billing_interval:string;requested_at:string};
export const essentialFeatures=['catalog','orders','bookings','quotes','jobs','custom'];
export function planFeatureForPath(path:string):string|undefined {
 if(path.startsWith('/portal/owner/purchasing')||path.startsWith('/portal/owner/stock-control'))return 'inventory';
 if(path.startsWith('/portal/owner/accounting')||path.startsWith('/portal/owner/reports')||path.startsWith('/portal/owner/reconciliation'))return 'accounting';
 if(path.startsWith('/portal/owner/people'))return 'hr';
 if(path.startsWith('/portal/owner/customers'))return 'crm';
 if(path.startsWith('/portal/owner/inventory'))return 'inventory';
 if(path.startsWith('/portal/owner/counter'))return 'sales';
 return undefined;
}
