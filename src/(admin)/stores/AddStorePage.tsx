import { Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/context/useAuth';
import { CreateStoreForm } from '@/(owner)/stores/CreateStoreForm';

export default function AdminAddStorePage() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  if (!isAdmin) return <Navigate to="/portal" replace />;

  return (
    <div className="w-full space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-navy px-6 py-8 text-cream sm:px-10 sm:py-10">
        <div className="auth-brand-glow pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative z-10">
          <Link
            to="/portal/admin/stores"
            className="inline-flex items-center gap-1 text-xs font-medium text-cream/70 transition hover:text-cream"
          >
            ← Back to stores
          </Link>
          <h1 className="mt-4 font-serif text-3xl font-medium tracking-tight sm:text-4xl">
            Launch a new storefront
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-cream/75 sm:text-base">
            Create a customer-facing branch under an existing merchant business. Branding and page copy can wait —
            the merchant can finish that in their portal.
          </p>
        </div>
      </div>

      <CreateStoreForm
        adminMode
        cancelTo="/portal/admin/stores"
        onSuccess={() => {
          navigate('/portal/admin/stores', { replace: true });
        }}
      />
    </div>
  );
}
