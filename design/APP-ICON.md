# Aperio app icon — October 6, 2026

The owner explicitly requested reuse of the previous app's icon, recolored to the current theme while keeping its red ribbon.

Reference: `assets/images/icon.png` from araspberry/Aperio commit `d9e5c80ded9e378174c88d6fb83788fb4da1d10c`. The prior Expo manifest names that exact asset as its iOS icon. The reference was inspected before editing.

Mode: built-in image generation, reference-image edit. No external CLI or API key. `app-icon-master.png` is the edited artwork. The raster edit retains the leather-book composition, flame-shaped A emblem, curled page corner and red bookmark. Graphite, olive/sage and pearl replace brown, gold and yellow. No prior app source was imported.

## Final edit prompt

Edit this existing Aperio Bible iOS app icon. This is a palette-only redesign: preserve its exact composition and recognizable design, the embossed flame-shaped A emblem, pebbled leather grain, twisted stitched edge, curled top-right corner exposing layered pages, and the vivid red bookmark ribbon at upper left. Keep the ribbon RED, with its original position, shape, stitching and forked tip. Change the brown leather to rich graphite charcoal (#303536), and change the gold/copper embossed emblem and braided trim to tasteful muted olive/sage green (base #536143, softly lit bevels #AEBB92 and #CDD6B8) with sufficient contrast so the emblem reads at small app-icon size. Change the yellow/gold pages to warm off-white pearl (#FAF9F6) with subtle neutral-gray paper shadows. Retain tactile material depth and lighting, refined contemporary premium Bible app appearance. No blue, no yellow-gold metallic tones, no extra ornament, no letters or words added, no new symbols. The central emblem is the same original shape, not replaced with a typographic letter. Keep it a square 1024x1024 app-icon artwork, fully opaque and edge-to-edge, no added exterior margin or surrounding device mockup. Reference image is the owner's existing app icon, authorized for modification.

## Packaging

The generated master is 1254 × 1254. `scripts/render-icon.swift` performs only the final resize and opaque sRGB encoding to 1024 × 1024 for the AppIcon asset catalog. It does not alter the composition or colors. Keep the master so regeneration never reverts to the temporary lowercase-a icon.
