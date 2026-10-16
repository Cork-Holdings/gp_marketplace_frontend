import { Link } from 'react-router-dom';
import { MarketplaceBrand } from '@/components/reference/ReferenceUI';
import { usePlatformDocuments } from '@/hooks/usePlatformDocuments';
import type { WebsitePage } from '@/lib/platform';
export function MarketplaceFooter() {
  const pages=usePlatformDocuments<WebsitePage>('page');
  return <footer className="discovery-footer"><div className="discovery-container">
    <Link to="/" aria-label="GeePay marketplace home"><MarketplaceBrand compact /></Link>
    <nav aria-label="Marketplace footer"><div><Link to="/#marketplace-results">Marketplace</Link><p>Products to shop. Services to book.</p></div><div><Link to="/register/merchant">For businesses</Link><p>Build your business with GeePay.</p></div><div><Link to="/coming-soon/support">Help & support</Link><p>Shopping, bookings & custom work.</p></div></nav>
    {Boolean(pages.items?.length)&&<nav aria-label="Website information pages">{pages.items?.map(page=><Link key={page.slug} to={`/pages/${page.slug}`}>{page.data.title}</Link>)}</nav>}
    <p className="discovery-copyright">© {new Date().getFullYear()} GeePay.<br />All rights reserved.</p>
  </div></footer>;
}
