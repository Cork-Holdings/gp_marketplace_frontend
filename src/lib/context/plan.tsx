import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useMarketplace } from './useMarketplace';
import { platformApi, type CurrentPlan } from '@/lib/platform';
import { ErrorState } from '@/components/common/ErrorState';
type State={merchant?:string;data?:CurrentPlan;error?:unknown};
const PlanContext=createContext<State&{refresh:()=>void}>({refresh:()=>{}});
export function PlanProvider({children}:{children:ReactNode}){
 const {isMerchant,user}=useAuth();const {selectedStore}=useMarketplace();const merchant=isMerchant?selectedStore?.merchant_id:undefined;
 const [revision,setRevision]=useState(0),[state,setState]=useState<State>({});const refresh=useCallback(()=>setRevision(v=>v+1),[]);
 useEffect(()=>{let ignore=false;if(!merchant){setState({});return}setState({merchant});void platformApi.current(merchant).then(data=>{if(!ignore)setState({merchant,data})},error=>{if(!ignore)setState({merchant,error})});return()=>{ignore=true}},[merchant,user?.id,revision]);
 return <PlanContext.Provider value={{...(state.merchant===merchant?state:{}),refresh}}>{children}</PlanContext.Provider>;
}
export const usePlan=()=>useContext(PlanContext);
export function PlanGate({feature,children}:{feature:string;children:ReactNode}){
 const {data,error,refresh}=usePlan();
 const {initialized,selectedStore,error:branchError,refreshStores}=useMarketplace();
 if(branchError)return <ErrorState error={branchError} onRetry={()=>void refreshStores()} title="Business branches could not be loaded"/>;
 if(initialized&&!selectedStore)return <p className="reference-notice">Choose or create a branch in <Link to="/portal/owner/stores">Stores</Link> to open this workspace.</p>;
 if(error)return <ErrorState error={error} onRetry={refresh} title="Plan access could not be checked"/>;
 if(!data)return <p role="status">Loading plan access…</p>;
 if(!data.plan.data.features.includes(feature))return <div className="reference-notice"><h1>This module is not included in your active plan</h1><p>Your existing orders and customer work remain accessible.</p><Link to="/portal/owner/plans">Review available plans →</Link></div>;
 return children;
}
