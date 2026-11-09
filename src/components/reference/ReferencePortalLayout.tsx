import { useAuth } from '@/lib/context/useAuth';
import { useMarketplace } from '@/lib/context/useMarketplace';
import { usePermissions } from '@/lib/context/permissions';
import { useMarketplaceCapabilities } from '@/hooks/useMarketplaceCapabilities';
import { useActivityCounts } from '@/hooks/useActivityCounts';
import { usePaymentMode } from '@/hooks/usePaymentMode';
import { canAccessNav } from '@/lib/permissions';
import { adminReferenceMenu,ownerReferenceMenu } from '@/lib/referenceNavigation';
import { ReferenceShell } from './ReferenceShell';
import { usePlan } from '@/lib/context/plan';
import { planFeatureForPath } from '@/lib/platform';
import { SettlementAlertsProvider } from '@/components/payments/SettlementAlerts';

export function ReferencePortalLayout() {
  const {isAdmin,isMerchant}=useAuth();
  const {stores,selectedStore,selectedStoreId,selectStore}=useMarketplace();
  const {permissions}=usePermissions();
  const {data:plan}=usePlan();
  const {isFood}=useMarketplaceCapabilities(selectedStore);
  const counts=useActivityCounts('owner',isMerchant?selectedStoreId??undefined:undefined);
  const simulated=usePaymentMode();
  const items=isAdmin?adminReferenceMenu.filter(item=>canAccessNav(permissions,item.to)):ownerReferenceMenu.filter(item=>{
    const feature=planFeatureForPath(item.to);
    return (!item.foodOnly||isFood)&&canAccessNav(permissions,item.to)&&(!feature||Boolean(plan?.plan.data.features.includes(feature)));
  });
  if(simulated){const index=items.findIndex(item=>item.to.endsWith('/settlements'));if(index>=0)items[index]={...items[index],label:isAdmin?'Financial test queue':'Settlement rehearsal'};}
  const shell=<ReferenceShell role={isAdmin?'admin':'owner'} items={items} counts={counts} stores={stores} store={selectedStore} onStoreChange={selectStore}/>;
  return isAdmin?<SettlementAlertsProvider>{shell}</SettlementAlertsProvider>:shell;
}
