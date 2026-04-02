# Commit log: Artist Instagram tab — shopper-facing layout

**Date:** 2026-04-02

## Checklist

- [x] [Instagram tab order](<../../app/(store)/shop/artists/[slug]/ArtistProfilePageClient.tsx>) — Curated **Highlights** grid (`custom.instagram_showcase`) first, then profile embed, then follow CTA.
- [x] [Copy](<../../app/(store)/shop/artists/[slug]/ArtistProfilePageClient.tsx>) — Removed public-facing metafield/Supabase instructions; added short hint when there is an embed but no showcase.
- [x] [Embed chrome](<../../app/(store)/shop/artists/[slug]/InstagramProfileEmbed.tsx>) — “Profile preview” label, phone-style frame, friendlier footnote.
- [x] [Styles](<../../app/(store)/shop/artists/[slug]/artist-profile.module.css>) — 3-column IG-like grid (420px column), improved image treatment, `.igShowcaseBlock` / `.igShopperHint`.

## Ops note

Merchandising still uses `custom.instagram_showcase` (JSON image URLs); document that in [`docs/features/street-collector/artist-profile-content-spec.md`](<../../docs/features/street-collector/artist-profile-content-spec.md>), not on the live tab.
