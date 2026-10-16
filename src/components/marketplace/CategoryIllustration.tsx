import type { DiscoveryCategory } from '@/lib/discovery';
import { CategoryImage } from './CategoryImage';

// Approved painted illustration family, shared with catalogue defaults.
export function CategoryIllustration({ category, className = '' }: { category: DiscoveryCategory; className?: string }) {
  return <CategoryImage category={category} className={className} sizes="68px" eager />;
}
