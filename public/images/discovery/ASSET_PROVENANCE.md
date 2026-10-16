# Discovery imagery

Merchant-uploaded catalogue images are used first. These editorial category images are generated illustrations of a category, not photographs of the merchant, its staff, or a specific item. Discovery cards label them “Illustrative category image”; compact storefront cards use “Illustration”.

## Approved painted defaults (6 October 2026)

The user selected **option 3: painted editorial illustration**. Active category navigation and product/service defaults now use `painted/{category}-{size}.webp`, not the rejected emoji SVGs or the earlier generated category photos. The original files remain available, but are not used for catalogue defaults.

Uploaded product/service photos take priority. Missing, whitespace-only or failed photos use the category illustration with a visible illustration label. These are category examples, never evidence of an actual merchant's product, premises or staff. Uploaded images are not cartoonised. Promotional collection banners remain separate editorial imagery.

Mode: built-in image generation. Style reference: approved cake `C:/Users/Jar/.codex/generated_images/01a112c2-7dd6-70d2-b5f9-ae608a0779c7/exec-bd90045e-526d-4c94-8a34-33e8a9247596.png`. Generation followed the imagegen skill; all assets were visually inspected. Only resizing and WebP encoding were performed after generation, preserving the complete square scene. Sizes: 160px category thumbnails, 400px cards, 800px high-density/larger cards, quality 82. Responsive `srcset`/`sizes` avoids loading full-sized defaults for navigation. Fallbacks are contained rather than cropped, so the cake stand, garment and other subjects remain visible.

Shared final prompt: “Use case: stylized-concept. Asset type: standalone square marketplace category illustration. Input image: the approved cake is a style reference, not the subject. Subject: [category subject below]. Sophisticated warm hand-painted editorial gouache, delicate navy contours, paper texture, soft painterly shading, pale warm blue background, centrally composed and fully visible with safe margins. Premium adult-oriented illustration, not emoji, clipart, 3D or photorealism. No text, logo, watermark, UI or collage.”

| Category | Prompt subject | Original generated file (under `C:/Users/Jar/.codex/generated_images/`) |
| --- | --- | --- |
| cakes | Ivory round birthday cake on ceramic pedestal, pink frosting flowers, green leaves, three candles; original approved option 3 | `01a112c2-7dd6-70d2-b5f9-ae608a0779c7/exec-bd90045e-526d-4c94-8a34-33e8a9247596.png` |
| food | Fresh tomatoes, leafy greens, carrots and oranges in a woven basket | `01a112c1-a6d6-7201-b4a4-7a3a67a3e845/exec-1e99e360-4b65-4b7f-8b4b-b3cbbef5877e.png` |
| fashion | Tailored African patterned shirt on wooden hanger with folded fabric | `01a112c1-a6d6-7201-b4a4-7a3a67a3e845/exec-d7579e1a-7f2c-4454-ad11-754cbbbcca42.png` |
| barbering | Professional electric clipper, comb and shaving brush | `01a112c1-d43c-7853-a829-c639d342a281/exec-71c8a8b1-b97a-4f09-98a1-37a21faed86f.png` |
| repairs-v2 | Conventional chrome single-lever tap, red pipe wrench and two copper couplings arranged as separate tools, no hands or impossible operating scene | `01a0a4f7-5e70-7900-a52b-d81bdb93825a/exec-fc98e8b7-d113-4095-8e39-3419485538f4.png` |
| carwash | Professional Black worker washing a navy car with sponge and foam | `01a112c1-d43c-7853-a829-c639d342a281/exec-d1b6abfe-7c00-479b-8c2c-410a821bed24.png` |
| care | Cyan spray bottle, wooden cleaning brush and folded ivory cloth | `01a112c2-7dd6-70d2-b5f9-ae608a0779c7/exec-abc52284-d015-44f9-8fa0-01ae7e60299e.png` |
| wholesale | Plain kraft boxes on wooden pallet beside tied grain sack | `01a112c2-7dd6-70d2-b5f9-ae608a0779c7/exec-61e98824-20fe-4625-99e4-1da0d114a996.png` |
| other | Neutral canvas tote, ivory ceramic mug and small woven basket | `01a112c1-a6d6-7201-b4a4-7a3a67a3e845/exec-7ad4cbdb-4fb3-48fd-b776-2affbe4a164a.png` |

The first repairs illustration was rejected because the wrench did not convincingly grip the fitting. The user requested its correction. Built-in image editing used that image as the edit target and the selected cake as the style reference, replacing the scene with the separate-tools still life above while preserving the pale blue background and painted treatment. The new files are versioned `repairs-v2-*` to avoid stale browser caches. Original generation files are preserved.

Repair edit prompt: “Replace the hand, misplaced wrench and under-sink pipe arrangement with a clean plumbing still life: one conventional chrome single-lever sink faucet standing upright, a realistic red pipe wrench lying beside it at a slight diagonal, and two copper plumbing couplings. These are separate displayed tools. No person, hands, sink bowl, U-bend or disconnected plumbing assembly. Keep the pale blue background and approved warm hand-painted gouache, subtle paper texture, delicate navy contours and soft shading. Fully visible centered subjects, safe margins, one square asset, no text, logos, watermark or UI.”

## Archived category SVG proposal (not active)

The archived proposal used unmodified Color SVG assets from [Microsoft Fluent Emoji](https://github.com/microsoft/fluentui-emoji), pinned to commit `1ffb34c752ecf5d402f04cfb4b392c77f57c54bc`. These are not used by active category navigation. The MIT copyright and permission notice is shipped in `../categories/LICENSE.txt`.

Food: Green salad; Fashion: T-shirt; Barbering: Barber pole; Home repairs: Hammer and wrench; Custom cakes: Birthday cake; Car wash: Automobile; Home care: Sponge; Wholesale: Package; Other: Shopping bags.

## Generated category photos

Mode: built-in image generation, new assets, opaque background. Resized to 800px wide and WebP-encoded at quality 80 without modifying the scene. Final files are in this folder:

- `barber-category.webp`: A skilled Zambian Black male barber neatly trimming a Black male customer's hair with clippers in a bright refined contemporary barbershop, natural candid professional service photography.
- `repairs-category.webp`: Close-up of a plumber's hands using a red pipe wrench to repair the chrome waste pipe under a clean home sink, navy work sleeves, believable repair scene.
- `cakes-category.webp`: A beautifully crafted ivory birthday cake with delicate blush pink flowers on a cake stand in a bakery, no writing, warm natural light.
- `fashion-category.webp`: A richly textured colourful African patterned tailored shirt neatly displayed on a hanger beside folded fabric in a modern independent boutique.
- `carwash-category.webp`: A professional Zambian car wash worker carefully hand washing a dark blue car with a soft sponge and soap suds outdoors, natural daylight.
- `goods-category.webp`: A thoughtfully arranged neutral canvas tote bag, ceramic mug and small woven basket on a warm wood independent shop counter, no brands.

Shared final prompt: “Use case: photorealistic-natural. Asset type: GeePay marketplace editorial category image, used only as an explicitly labelled illustrative fallback, not as a merchant's actual item photo. Primary request: [subject above] Composition: square photograph, main subject centred and fully readable at a small thumbnail size, premium editorial realism and authentic detail, softly blurred background, naturally rich restrained colours. No logos, text, UI, borders, watermark or collage.”

## Editorial banners

Built-in image generation: `occasion-editorial.webp` (panoramic cake, tailoring and patterned fabric), `food-editorial.webp` (fresh market produce), `care-editorial.webp` (home cleaning), `bulk-editorial.webp` (warehouse supplies). These depict collections, not specific merchants or inventory.
