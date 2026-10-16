import { useEffect, useState } from 'react';
import api from '@/lib/api/crud';

let modeRequest: Promise<boolean> | undefined;
// Shared request; uncertainty always falls back to real-payment copy, never
// silently enables simulation in the browser.
export function usePaymentMode() {
  const [simulated, setSimulated] = useState(false);
  useEffect(() => {
    let live = true;
    modeRequest ??= api.get('/runtime', { auth: false }).then(result => result.simulated === true).catch(() => false);
    void modeRequest.then(value => { if (live) setSimulated(value); });
    return () => { live = false; };
  }, []);
  return simulated;
}
