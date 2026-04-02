# Commit log: Artist Instagram embed + vendor `instagram_url` seed

**Date:** 2026-04-02

## Checklist

- [x] [Instagram profile embed (iframe)](../../app/(store)/shop/artists/[slug]/InstagramProfileEmbed.tsx) — Artist tab loads `https://www.instagram.com/{handle}/embed/` when `instagram` + `instagramUrl` exist on the artist API payload.
- [x] [Artist profile tab UI](<../../app/(store)/shop/artists/[slug]/ArtistProfilePageClient.tsx>) — Instagram tab shows embed above optional `custom.instagram_showcase` grid; footnote links to open profile if embed shows a login wall.
- [x] [Styles](<../../app/(store)/shop/artists/[slug]/artist-profile.module.css>) — `.igEmbedWrap`, `.igEmbedFrame`, responsive padding.
- [x] [CSP `frame-src`](<../../next.config.js>) — Allow `https://www.instagram.com` and `https://instagram.com` so the embed is not blocked.
- [x] [Supabase migration](<../../supabase/migrations/20260402140000_vendor_instagram_urls_street_collector.sql>) — `UPDATE vendors.instagram_url` for curated Street Collector artist names (case-insensitive match). **Apply on your project** (CLI `db push` or SQL editor) if remote migration history is in sync; this repo reported remote/local migration drift when dry-running `db push`.

## Notes

- Full in-app grids without Meta login require the Instagram Graph API / oEmbed for posts, not whole profiles. The embed route is the practical “preview” supported for public profiles.
- Skipped: Facio (URL redacted in source list), Jennypo Art (no link).
