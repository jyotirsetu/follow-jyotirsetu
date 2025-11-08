# follow-jyotirsetu (static)

Minimal static landing for `follow.jyotirsetu.com`:
- Device/referrer detection
- A/B variant fetch from `https://jyotirsetu.com/api/follow-hub/variant`
- CTA prioritization (WhatsApp vs Google Review)
- Event logging to `https://jyotirsetu.com/api/follow-hub/event`
- GA4 `G-EQGNCD55GL`

## Local Preview
- Open `index.html` in a browser.
- Note: Variant/event endpoints require a network; if offline, defaults to variant A.

## Deploy on Vercel
1. Create new project, connect this repo.
2. Root is project root (contains `index.html`).
3. Add custom domain `follow.jyotirsetu.com` and set CNAME to Vercel.
4. No environment variables needed (public endpoints handle CORS).

## QA
- Page load should log `page_view`.
- Primary CTA renders and logs `cta_impression`.
- Clicking any link logs `cta_click` and opens in new tab.
- Admin dashboard at `https://jyotirsetu.com/admin/tools/follow-hub` shows metrics after traffic.
