import { Link } from 'react-router-dom';

export function MarketplaceHero() {
  return (
    <section
      className="relative mx-4 overflow-hidden rounded-3xl bg-forest-dark lg:mx-8"
      aria-label="Geepay marketplace"
    >
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 20% 30%, rgba(139,158,139,0.45), transparent 55%), radial-gradient(ellipse at 80% 70%, rgba(196,168,130,0.25), transparent 50%)',
        }}
      />
      <div className="relative flex min-h-[420px] flex-col justify-center px-6 py-16 sm:min-h-[460px] sm:px-10 lg:px-14">
        <p className="font-serif text-sm font-medium tracking-wide text-sage sm:text-base">Geepay</p>
        <h1 className="mt-3 max-w-2xl text-3xl font-medium leading-tight text-white sm:text-4xl lg:text-5xl">
          Shop local stores.
          <br />
          <em className="font-serif not-italic text-sage">Pay with Mobile Money.</em>
        </h1>
        <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/80 sm:text-base">
          Discover restaurants, shops, and services across Zambia — order online and settle with USSD.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="#stores"
            className="inline-flex items-center gap-2 rounded-full bg-cream px-7 py-3.5 text-sm font-semibold text-forest transition hover:bg-white active:scale-[0.98]"
          >
            Browse stores
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </a>
          <Link
            to="/register/merchant"
            className="inline-flex items-center rounded-full border border-white/35 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            Sell on Geepay
          </Link>
        </div>
      </div>
    </section>
  );
}
