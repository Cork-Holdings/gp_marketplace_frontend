import type { ReactNode } from 'react';

/** Shared product/service receipt surface; printing remains opt-in. */
export function ReceiptPaper({children,id,className=''}:{children:ReactNode;id?:string;className?:string}) {
  return <div id={id} className={`receipt-root rounded-2xl border border-cream-dark bg-white p-5 shadow-sm print:border-0 print:shadow-none ${className}`}>{children}</div>;
}
