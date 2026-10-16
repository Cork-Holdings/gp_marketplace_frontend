import { useState } from 'react';
import { useMarketplace } from '@/lib/context/useMarketplace';
import { usePlan } from '@/lib/context/plan';
import { usePlatformDocuments } from '@/hooks/usePlatformDocuments';
import { platformApi, type Plan } from '@/lib/platform';
import { ErrorState } from '@/components/common/ErrorState';
import { ReferenceIcon } from './ReferenceIcon';
import './reference-plans.css';
import './PlatformManagement.css';
export function SubscriptionPlansPage(){
 const list=usePlatformDocuments<Plan>('plan');const current=usePlan();const {selectedStore,memberRole}=useMarketplace();
 const [interval,setInterval]=useState<'monthly'|'yearly'>('monthly'),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState<unknown>();
 const manager=['owner','admin','manager'].includes(memberRole??'');
 async function request(slug:string){if(busy||!selectedStore?.merchant_id)return;setBusy(true);setError(undefined);setMessage('');try{await platformApi.request(selectedStore.merchant_id,slug,interval);current.refresh();setMessage('Plan change requested. Your current access is unchanged. No payment has been taken.')}catch(err){setError(err)}finally{setBusy(false)}}
 return <div className="reference-plans-page platform-manager"><header><div><h1>Plans for your business</h1><p>Choose the tools you need. Prices are set by the marketplace administrator.</p></div><div className="platform-actions" role="group" aria-label="Billing interval"><button aria-pressed={interval==='monthly'} className={interval==='monthly'?'primary':''} onClick={()=>setInterval('monthly')}>Monthly</button><button aria-pressed={interval==='yearly'} className={interval==='yearly'?'primary':''} onClick={()=>setInterval('yearly')}>Yearly</button></div></header>
 <p className="platform-notice">{current.data?`Current plan: ${current.data.plan.data.name}. `:''}Plan changes are reviewed by the administrator. Automated collection and renewal are not enabled; choosing a plan does not charge you.</p>
 {current.error&&<ErrorState error={current.error} onRetry={current.refresh}/>} {error&&<ErrorState error={error}/>} {message&&<p className="platform-notice platform-success" role="status">{message}</p>}
 {current.data?.request&&<p className="platform-notice">Pending request: {current.data.request.plan_slug} · {current.data.request.billing_interval}. You can request a different plan to replace it.</p>}
 {list.error?<ErrorState error={list.error} onRetry={list.refresh}/>:!list.items?<p role="status">Loading plans…</p>:<div className="reference-plan-grid">{list.items.map((doc,index)=>{const active=current.data?.plan.slug===doc.slug;const price=interval==='monthly'?doc.data.monthly_minor:doc.data.yearly_minor;return <article key={doc.slug} className={`reference-plan-card tier-${Math.min(index,3)}`}><header><span className="reference-tile tone-blue"><ReferenceIcon name={index===0?'store':'layers'} size={25}/></span><div><h2>{doc.data.name}</h2><p>{doc.data.description}</p></div></header><p className="reference-plan-price"><strong>K {(price/100).toLocaleString('en-ZM',{minimumFractionDigits:2})}</strong> / {interval==='monthly'?'month':'year'}</p><button className={active?'':'primary'} disabled={busy||active||!manager||!current.data} onClick={()=>void request(doc.slug)}>{active?'Current plan':busy?'Submitting…':'Request this plan'}</button><ul className="platform-section">{doc.data.features.map(key=><li key={key} className="platform-check">✓ {list.features.find(f=>f.key===key)?.name??key}</li>)}</ul>{doc.data.is_default&&<p>Free default plan</p>}</article>})}</div>}
 {!manager&&<p className="platform-notice">Only a business owner or manager can request plan changes.</p>}
 <section className="platform-section"><h2>Modules in development</h2><p>{list.features.filter(f=>!f.available).map(f=>f.name).join(' · ')}. These modules are not included as working features in any plan.</p></section></div>;
}
