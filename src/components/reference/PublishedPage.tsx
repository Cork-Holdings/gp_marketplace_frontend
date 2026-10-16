import { Link, useParams } from 'react-router-dom';
import { usePlatformDocuments } from '@/hooks/usePlatformDocuments';
import type { WebsitePage } from '@/lib/platform';
import { ErrorState } from '@/components/common/ErrorState';
import './PlatformManagement.css';
export function PublishedPage(){
 const {slug}=useParams();const list=usePlatformDocuments<WebsitePage>('page');const doc=list.items?.find(item=>item.slug===slug);
 return <main className="platform-public-page"><Link to="/">← Marketplace</Link>{list.error?<ErrorState error={list.error} onRetry={list.refresh}/>:!list.items?<p role="status">Loading page…</p>:!doc?<><h1>Page not available</h1><p>This page is unpublished or does not exist.</p></>:<><h1>{doc.data.title}</h1><p>{doc.data.summary}</p><div className="body">{doc.data.body}</div></>}</main>;
}
