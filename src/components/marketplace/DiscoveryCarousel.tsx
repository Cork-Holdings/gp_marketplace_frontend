import { useEffect, useState } from 'react';
import { CategoryIllustration } from './CategoryIllustration';
import { DiscoveryIcon } from './DiscoveryIcon';
import type { DiscoveryCategory } from '@/lib/discovery';
const slides: { title: string; body: string; action: string; category: DiscoveryCategory; image: string; imagePosition?: string }[] = [
  { title: 'Made for your occasion', body: 'Custom cakes, tailored outfits and thoughtful creations.', action: 'Explore custom creations', category: 'cakes', image: '/images/discovery/occasion-editorial.webp' },
  { title: 'A little help at home', body: 'Find the right professional for repairs and care at your place.', action: 'Explore home services', category: 'care', image: '/images/discovery/care-editorial.webp', imagePosition: 'center 45%' },
  { title: 'Big plans. Bulk orders.', body: 'Discuss quantities, agree a price and follow your order.', action: 'Explore wholesale', category: 'wholesale', image: '/images/discovery/bulk-editorial.webp' },
];
export function DiscoveryCarousel({ onExplore }: { onExplore: (category: DiscoveryCategory) => void }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const [imageError, setImageError] = useState<string | null>(null);
  useEffect(() => { const media = window.matchMedia('(prefers-reduced-motion: reduce)'); const update = () => setReducedMotion(media.matches); media.addEventListener('change', update); return () => media.removeEventListener('change', update); }, []);
  useEffect(() => { if (paused || hovered || focused || reducedMotion) return; const timer = window.setInterval(() => setActive(index => (index + 1) % slides.length), 7000); return () => window.clearInterval(timer); }, [paused, hovered, focused, reducedMotion]);
  function select(index: number) { setActive((index + slides.length) % slides.length); setPaused(true); }
  const slide = slides[active];
  return <section className="discovery-carousel" aria-label="More ways to discover" aria-roledescription="carousel" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={e => { if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false); }}>
    <div className="discovery-carousel-art" aria-hidden="true">{imageError === slide.image ? <CategoryIllustration category={slide.category} /> : <img key={slide.image} src={slide.image} alt="" width={1400} height={480} loading="lazy" style={{ objectPosition: slide.imagePosition }} onError={() => setImageError(slide.image)} />}</div>
    <div className="discovery-carousel-copy" aria-live={paused || focused || reducedMotion ? 'polite' : 'off'}><h2>{slide.title}</h2><p>{slide.body}</p><button type="button" className="discovery-link-button" onClick={() => onExplore(slide.category)}>{slide.action}<DiscoveryIcon name="arrow" size={16} /></button></div>
    <div className="discovery-carousel-controls"><div><button type="button" className="discovery-icon-button" aria-label="Previous collection" onClick={() => select(active - 1)}><DiscoveryIcon name="left" size={16} /></button><button type="button" className="discovery-icon-button" aria-label="Next collection" onClick={() => select(active + 1)}><DiscoveryIcon name="right" size={16} /></button></div><div className="discovery-carousel-dots">{slides.map((s, index) => <button type="button" key={s.title} aria-label={`Show collection ${index + 1}: ${s.title}`} aria-pressed={active === index} onClick={() => select(index)}><span /></button>)}{!reducedMotion && <button type="button" aria-label={paused ? 'Play collection slideshow' : 'Pause collection slideshow'} onClick={() => setPaused(!paused)}><DiscoveryIcon name={paused ? 'play' : 'pause'} size={13} /></button>}</div></div>
  </section>;
}
