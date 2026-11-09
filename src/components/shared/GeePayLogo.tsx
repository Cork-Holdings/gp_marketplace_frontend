/** Supplied GeePay artwork: navy on light surfaces, white on dark surfaces. */
export function GeePayLogo({ surface = 'light', className = '' }: {
  surface?: 'light' | 'dark';
  className?: string;
}) {
  return <img
    src={surface === 'dark' ? '/images/geepay-white-8.png' : '/brand/geepay-wordmark.png'}
    alt="GeePay"
    width={surface === 'dark' ? 626 : 1774}
    height={surface === 'dark' ? 122 : 887}
    className={`h-16 w-32 shrink-0 object-contain ${className}`}
  />;
}
