# GeePay brand and marketplace UI review

Reviewed 21 October 2026 against the supplied **Geepay Brand Guidelines.pdf**, `docs/BRANDING_AND_PLANS.md`, the live `https://mygeepay.com/` homepage, source code and the running marketplace at 1440px and 390px widths.

## Direction and scope

Brand-preserving refinement, not a new design system. Existing React, Tailwind, Radix-based components, routes, catalogue data and workflows remain intact. Design variance 3, motion intensity 2, visual density 5. The taste skill applies to the public landing page; product UX principles apply to dashboard controls and financial actions. No images were generated or financial transactions initiated for this review.

The PDF is the brand authority. Its type rules override generic skill suggestions to use a different font. Its approved white also overrides generic advice against white surfaces.

## What is already correct

- Navy `#10182B`, steel `#257DC1`, aqua `#30C5F4`, gold `#FBBF24` and white are present in the theme.
- Runtime inspection confirms DM Sans on the hero, product names and business names. Inter is used for supporting UI copy. A wholesale font replacement is unnecessary.
- The supplied light and dark logo variants are used without recolouring or forced white backing.
- Search and catalogue content are real; unimplemented capabilities are not fabricated as working reviews, ratings or discounts.
- The public page has a clear search-first path, and mobile has a persistent bottom navigation.

## Applied in this pass: selective gradient actions

1. Marketplace hero CTA, including its alternate slides.
2. Storefront hero catalogue CTA.
3. Sign in submit button.
4. Owner dashboard's primary Add Product / Service quick action.

The live homepage's buttons use a 115-degree purple/blue/cyan gradient (`#383D92`, `#2B6FC2`, `#00AFEB`) with white labels and approximately 12-14px radii. Those exact colours are not identical to the supplied PDF palette. This implementation uses the PDF's steel-to-aqua gradient direction instead, with a navy scrim so the brightest stop still supports white 14px text. It adopts the treatment, not every live-site colour.

The selected buttons have 12px radii, 44px minimum height, hover/focus states and forced-colour fallback. The existing flat controls remain the default. No gradient was added to payment, settlement, destructive or routine table actions. Disabled Sign in becomes flat again.

## Specific remaining fixes, in priority order

Implementation update: the approved Readable grid homepage is now applied. Items 1 and 2 below describe the original findings, now addressed by two-column phone grids, readable type, flexible card copy, 44px actions and a scrollbar-free category ribbon. Upcoming collections now sit in a collapsed section below the working catalogue. The mobile hero uses the approved text-first composition; desktop artwork remains unchanged. Other recommendations below remain separate follow-ups.

Browser regression checks are saved in `tests/browser/marketplace-layout.js` and `tests/browser/marketplace-recovery.js`. With the local app running, open a Playwright CLI session, then use `playwright-cli run-code --filename` with each file. These check real catalogue layouts at 320, 390, 430, 720, 768 and 1440px, long text, search/filter/empty states, keyboard ribbon scrolling and browser-only error/retry handling. No payment actions are submitted.

### 1. P1: mobile catalogue readability and clipped card content

**Where:** `/`, `src/components/reference/reference-marketplace.css:44-48`, `ReferenceMarketplacePage.tsx`, shared catalogue image/card components.

**Observed at 390px:** four cards across; product names 9px, category text 8px, business names 8px, business location text 7px, prices approximately 11px. Card copy has a fixed 100px height, while prices and action text wrap. The two-column fallback only starts at 360px, leaving many larger phones with a less readable layout than narrower phones.

**Change:** use two columns on phones, or a deliberate horizontally scrollable product rail with readable fixed-width items. Product names 14-16px, supporting text 12-14px, prices 16px. Replace fixed copy height with a flexible layout; give price and the action separate stable areas. Preserve actual data and the existing product-specific action labels.

**Check:** 360, 390, 430, 768 and 1440px, long item names, made-to-order prices, missing images, translated text and 200% zoom. No cut-off price or button.

### 2. P1: mobile category navigation and search affordances

**Where:** marketplace header/search and category ribbon; `reference-marketplace.css:39-41`, `MarketplaceNavbar.tsx`.

**Observed:** all nine categories are squeezed into one row with 7px captions. Search text is 11px. Several header controls shrink to 30-32px; the filters control is 9px text in a 32px-high target.

**Change:** retain the categories but use a horizontal ribbon or readable multi-row arrangement; target 12-14px labels and 44px touch areas. Use 16px search input text. Keep location, account and bag discoverable rather than reducing every control to fit the screenshot.

### 3. P2: finish the typography system, not a font swap

**Where:** `index.html`, `src/index.css`, `tailwind.config.js`, `reference.css`, marketplace mobile overrides.

**Observed:** the font families already match the guide. However, the app requests DM Sans only through weight 700 while some headings specify 750. Public pages rely on Google-hosted font CSS. The code repeats hard-coded family names alongside font variables.

**Change:** self-host licensed DM Sans and Inter WOFF2 assets with `font-display: swap`; include the actual weights used or adopt variable fonts. Use `--font-display` consistently for main messages/names and `--font-sans` for dense copy. Define a small heading/body/caption scale; remove the 6-11px phone typography. Do not replace DM Sans with another skill-default font.

**Check:** offline/slow-font fallback, heading line breaks, loading shifts and actual downloaded weights. Current font checks succeeded; that does not prove loading is resilient offline.

### 4. P2: logo clear space and favicon

**Where:** marketplace masthead, dashboard sidebar, login/onboarding and `index.html`; `ReferenceUI.tsx`, `brand-refinements.css`, `GeePayLogo.tsx`.

**Observed:** the background-appropriate variants are correct. The Marketplace descriptor still sits only about 3-5px from the logo box, while the supplied guide specifies protected clear space. The favicon is the full horizontal white logo squeezed into a square browser slot.

**Change:** separate the Marketplace descriptor from the protected logo zone and place Clickmore as secondary attribution. Use the supplied G mark for favicon/app icon and other genuinely compact slots. Follow the guide's stated 2x clear-space rule; confirm a compact digital exception with the brand owner if necessary rather than claiming that a few pixels comply. Preserve logo proportions and original pixels.

### 5. P2: colour tokens still contain older purple ramps

**Where:** `tailwind.config.js` cobalt/navy ramps, `src/index.css` chart and gradient aliases; dashboard metric and chart styles.

**Observed:** primary palette values were updated, but some light/dark cobalt ramp values and chart accents still use lavender/purple values such as `#7679CF` and `#26296D`. There are overlapping aliases and hard-coded reference colours.

**Change:** consolidate the approved palette and its documented tints/shades after tracing consumers. Reserve aqua for emphasis and interaction, navy/white for most surfaces, gold for occasional value highlights. Keep success/warning/error colours semantic. Do not recolour financial statuses merely to make every colour match the logo.

### 6. P2: public page spends attention on unavailable features

**Where:** the four Shopping collections links below the category ribbon, the hero's Ratings & reviews tile and supporting catalogue copy in `ReferenceMarketplacePage.tsx`.

**Observed:** prominent slots lead to Coming soon routes, and repeated caveats compete with actual offerings. This is truthful but visually dominates the first shopping impression.

**Change:** move unavailable collections to a quieter preview area or mark them non-actionable until supported. Give those prime slots to working category/search destinations. Preserve honesty: do not relabel a generic feed as personalised recommendations or invent discounts/reviews. This is an information-hierarchy recommendation, not a brand requirement.

### 7. P2: hero imagery and mobile composition

**Where:** `ReferenceMarketplacePage.tsx:25`, `ReferenceUI.tsx` ReferencePhoto, `reference-marketplace.css:21,40`.

**Observed:** the hero photo is a crop of the client mockup atlas; `mix-blend-mode: luminosity` makes it monochrome. On phones the photo and three mini benefit tiles compete with a narrow copy column, producing tiny supplementary text and a three-line headline.

**Change:** replace the screenshot crop with an approved original photo or licensed brand asset; retain a deliberate crop and natural colour unless a brand-directed monochrome treatment is approved. Use one clear mobile message and CTA, with benefits below rather than all compressed beside the image. Keep desktop hero compact, not oversized. The PDF has visual examples but no detailed written photographic specification; this is a design recommendation, not a claimed prohibition.

### 8. P3: standardise icons and shape roles

**Where:** `ReferenceIcon.tsx`, `WorkflowIcon.tsx`, category tiles, buttons and card styles.

**Observed:** reference icons use 1.7px strokes and workflow icons 1.8px, against the guide's approximately 2px direction. Most line-art, 24px grid and rounded-cap treatment is already aligned. Controls mix pill, 6px, 10px, 12px and other radii without a single documented role scale.

**Change:** retain the existing icon family, standardise stroke/optical sizing, and reserve gradient icons for rare featured moments. Document a simple radius scale by role: buttons 12px, fields 8-12px, cards 12-16px, pills only for status/filter chips. No icon-library migration is needed for this fix.

## Suggested implementation order

1. Mobile cards, readable text and touch targets.
2. Font loading/weights and consistent type tokens.
3. Masthead clear space and G-mark favicon.
4. Palette/token cleanup, followed by hero image and unavailable-feature hierarchy.
5. Icon/radius consistency and final visual QA.

These follow-ups are proposals, not completed changes. No payment or custody behaviour is part of this design work.

## Verification completed for gradient change

- Focused brand tests sample 101 positions across normal and hover gradients, requiring at least 4.5:1 white-label contrast. The limiting end is approximately 4.9:1 at rest.
- TypeScript, targeted ESLint and production build passed.
- Browser checks at 1440px and 390px confirmed gradients on marketplace/storefront/Sign in, 44px hero CTA height, keyboard focus, flat disabled Sign in and no outer horizontal overflow. Owner dashboard primary gradient and flat secondary actions were checked.
- Financial writes were blocked in the browser. No collection, recovery, payout or plan request was submitted.
- The production bundle remains about 1.20MB minified / 346KB gzip and emits Vite's existing size warning. No Lighthouse/Core Web Vitals pass is claimed.
- Before/after screenshots are in `output/playwright/brand-review/`. Visual and responsive checks do not constitute full accessibility certification.
