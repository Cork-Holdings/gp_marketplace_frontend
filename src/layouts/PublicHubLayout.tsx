import { Outlet } from 'react-router-dom';

/** Public marketplace hub shell — no cart chrome. */
export function PublicHubLayout() {
  return <Outlet />;
}

export default PublicHubLayout;
