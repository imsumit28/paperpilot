# Brand assets

Paper Pilot logo files. Filenames must match exactly — `BrandLogo`
(apps/web/src/components/layout/BrandLogo.tsx) reads them by path.

| File | What it is | Where it shows |
|------|------------|----------------|
| `logo.png` | full wordmark (icon + "Paper Pilot" + tagline) | Auth page hero (on a white chip) |
| `mark.png` | icon mark only | Sidebar + mobile topbar (beside the "Paper Pilot" text) |

The **favicon / app icon** lives separately in `apps/web/src/app/`:
- `icon.png` — browser tab
- `apple-icon.png` — iOS home screen

Tip: export at ~2× display size with a transparent background for crispness.
