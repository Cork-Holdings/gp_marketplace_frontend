import { Link,useParams } from 'react-router-dom';
import { adminReferenceMenu,ownerReferenceMenu,featurePath,type ReferenceRole } from '@/lib/referenceNavigation';
import { ReferenceIcon } from './ReferenceIcon';
import { Soon } from './ReferenceUI';

const explanations:Record<string,string>={
  crm:'Customer profiles, segmentation, purchase history and follow-ups will be available here.',
  accounting:'Income, expenses, reconciliation and financial reports will be available here. Recorded collections are not profit.',
  marketing:'Promotions, campaigns and discount management will be available here.',
  website:'The website builder is being prepared. Your existing storefront and branding settings remain available.',
  hr:'Attendance, leave, employee records and payroll capabilities are being prepared. Team membership and roles remain available.',
  financing:'Financing options and applications are being prepared. No credit eligibility or approval is implied.',
  notifications:'Durable state-change notifications and per-user unread markers are being prepared. Existing count badges indicate total records, not unread messages.',
  settlements:'The administrative payment and settlement workspace is being prepared. This page cannot collect, disburse or refund money.',
  revenue:'The complete commission and marketplace revenue workspace is being prepared.',
  disputes:'The central reviews and disputes queue is being prepared. Existing service-visit issue reporting remains in the work record.',
  geographic:'Geographic transaction aggregates and map drill-down are being prepared.',
  analytics:'Advanced comparisons, business insights and report exports are being prepared. Existing dashboard data remains available.',
  risk:'Advanced monitoring is being prepared. Existing KYC review and business activation are available to authorized administrators.',
  support:'In-app support messaging is being prepared. You can still browse the marketplace help and your existing business/account sections.',
  favourites:'Saved products and favourite businesses are being prepared.',
  deals:'Promotions, discounted products and clearance offers are being prepared. No discount is promised by this preview.',
  scan:'Product and business scanning is being prepared. Text search remains available.',
};

export function ComingSoonPage({role='customer',featureOverride}:{role?:ReferenceRole;featureOverride?:string}) {
  const {feature:routeFeature}=useParams();
  const feature=featureOverride??routeFeature??'';
  const menus=[...adminReferenceMenu,...ownerReferenceMenu];
  const entry=menus.find(item=>item.to===featurePath(role,feature));
  const fallback:Record<string,string>={notifications:'Notifications',support:'Help & support',settings:'Settings',favourites:'Saved items',deals:'Deals & offers',discounts:'Discounted products',arrivals:'New arrivals',clearance:'Clearance sale',scan:'Scan',education:'Education',health:'Health',events:'Events',professional:'Professional services'};
  const title=entry?.label??fallback[feature]??'Upcoming feature';
  const root=role==='customer'?'/account':`/portal/${role}`;
  return <section className="reference-coming-page"><span className="reference-tile tone-blue"><ReferenceIcon name={entry?.icon??'clock'} size={28}/></span><h1>{title}</h1><Soon/><p>{explanations[feature]??'This feature is not implemented yet. Its place in the navigation is reserved so you can find it when it becomes available.'}</p><p>Your existing orders, bookings, payments and account data are unchanged. No action or payment was submitted.</p><div className="reference-coming-links"><Link to={root}>Back to dashboard</Link><Link to="/">Browse Marketplace</Link>{role==='owner'&&['website','settings'].includes(feature)&&<Link to="/portal/owner/store-settings">Open Branding</Link>}{role==='owner'&&feature==='hr'&&<Link to="/portal/owner/team">Open Team</Link>}{role==='admin'&&feature==='risk'&&<Link to="/portal/admin/kyc">Open KYC Review</Link>}</div></section>;
}
