import { Link } from 'react-router-dom';

function GeepayLogo({ className = 'h-10 w-10' }) {
  return (
    <div
      className={`flex items-center justify-center rounded-2xl bg-forest-dark ring-1 ring-white/10 ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 40 40" className="h-6 w-6" fill="none">
        <circle cx="20" cy="20" r="14" stroke="#D1D2EF" strokeWidth="2" />
        <path d="M20 8a12 12 0 0 1 0 24" fill="#00afeb" stroke="#D1D2EF" strokeWidth="1.5" />
        <circle cx="20" cy="20" r="4" fill="#ECECF8" />
      </svg>
    </div>
  );
}

export function OnboardingLayout({ title, subtitle, steps, currentStep, children, footer }) {
  const stepIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4 py-8">
      <div className="flex w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-cream-dark">
        <aside className="auth-brand-panel relative hidden w-[38%] flex-col justify-between overflow-hidden p-8 lg:flex">
          <div className="auth-brand-glow pointer-events-none absolute inset-0" aria-hidden="true" />
          <div className="relative z-10">
            <GeepayLogo className="h-12 w-12" />
            <p className="mt-4 font-serif text-2xl font-medium text-cream">{title}</p>
            {subtitle && <p className="mt-2 text-sm leading-relaxed text-cream/70">{subtitle}</p>}
          </div>
          <nav className="relative z-10 space-y-3" aria-label="Onboarding progress">
            {steps.map((step, i) => {
              const done = i < stepIndex;
              const active = step.id === currentStep;
              return (
                <div
                  key={step.id}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${
                    active ? 'bg-white/15 text-cream' : done ? 'text-sage' : 'text-cream/50'
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      active ? 'bg-cream text-forest' : done ? 'bg-sage text-forest' : 'bg-white/10'
                    }`}
                  >
                    {done ? '✓' : i + 1}
                  </span>
                  {step.label}
                </div>
              );
            })}
          </nav>
          <p className="relative z-10 text-xs text-cream/50">
            Secure onboarding · Documents encrypted at rest
          </p>
        </aside>

        <main className="flex flex-1 flex-col px-6 py-8 sm:px-10">
          <div className="mb-6 flex items-center justify-between lg:hidden">
            <GeepayLogo className="h-9 w-9" />
            <StepIndicator steps={steps} currentStep={currentStep} compact />
          </div>

          <div className="mx-auto flex w-full max-w-lg flex-1 flex-col">
            <div className="mb-6 hidden lg:block">
              <StepIndicator steps={steps} currentStep={currentStep} />
            </div>
            <div className="flex-1">{children}</div>
            {footer && <div className="mt-8 border-t border-cream-dark pt-6">{footer}</div>}
          </div>
        </main>
      </div>
    </div>
  );
}

export function StepIndicator({ steps, currentStep, compact = false }) {
  const idx = steps.findIndex((s) => s.id === currentStep);
  if (compact) {
    return (
      <span className="text-xs font-medium text-forest-muted">
        Step {idx + 1}/{steps.length}
      </span>
    );
  }
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-forest-muted">
        Step {idx + 1} of {steps.length}
      </p>
      <p className="text-lg font-semibold text-charcoal">{steps[idx]?.label}</p>
      <div className="mt-3 flex gap-1">
        {steps.map((s, i) => (
          <div
            key={s.id}
            className={`h-1.5 flex-1 rounded-full ${i <= idx ? 'bg-forest' : 'bg-cream-dark'}`}
          />
        ))}
      </div>
    </div>
  );
}

export function OnboardingNav({ onBack, onNext, nextLabel = 'Continue', submitting = false, nextDisabled = false }) {
  return (
    <div className="flex items-center justify-between gap-3">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl px-4 py-2.5 text-sm font-medium text-forest-muted hover:bg-cream"
        >
          ← Back
        </button>
      ) : (
        <span />
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={submitting || nextDisabled}
        className="auth-sign-in-btn rounded-xl px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {submitting ? 'Please wait…' : nextLabel}
      </button>
    </div>
  );
}

export function AuthPageLink({ to, children }) {
  return (
    <p className="text-center text-sm text-forest-muted">
      <Link to={to} className="font-medium text-forest underline-offset-2 hover:underline">
        {children}
      </Link>
    </p>
  );
}

export default OnboardingLayout;
