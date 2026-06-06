# 💵 SendMeOneDollar.org

A shameless, single-page website with exactly one request: **send me one dollar.**

No pitch. No product. No backend. Just a dollar. Please.

🔗 **Live site:** [sendmeonedollar.org](https://sendmeonedollar.org)

---

## What this is

A polished, absurdist one-page site that asks visitors to send the owner **$1 via PayPal**. The entire deployable artefact is a single `index.html` — pure HTML, CSS, and vanilla JavaScript. No frameworks, no build step, no dependencies.

### Features
- Scrolling ticker tape
- Floating 💵 hero with a pulsing PayPal call-to-action
- **Confetti burst** when you click the donate button
- Six airtight, legally-not-binding reasons to send a dollar
- A fake animated dollar counter (*"not connected to anything — but imagine if it was"*)
- An earnest/funny FAQ
- A second, guilt-based call-to-action
- Responsive, dark, dollar-green (`#00c853`) and yellow (`#ffe600`) aesthetic
- Fonts: **Bebas Neue** (headlines), **Permanent Marker** (taglines), **DM Sans** (body)
- Respects `prefers-reduced-motion`

## PayPal integration

The donate buttons link to a [PayPal.Me](https://www.paypal.com/paypalme/) link in the format:

```
https://paypal.me/stevejZA/1
```

The trailing `/1` pre-fills the amount to **$1.00 USD** for the sender. No API keys, webhooks, or backend are involved — it's a direct redirect to PayPal.

## Tech

| | |
|---|---|
| **Stack** | Single static `index.html` (HTML + CSS + vanilla JS) |
| **Hosting** | GitHub Pages |
| **DNS / CDN / SSL** | Cloudflare (proxied) |
| **Build step** | None |

## Local development

It's one file. Open it:

```bash
# just open index.html in a browser, or serve it:
python -m http.server 8000
# then visit http://localhost:8000
```

## Deployment

Hosted on **GitHub Pages** with **Cloudflare** in front for DNS and SSL.

- The repo root contains a `CNAME` file with `sendmeonedollar.org`, which tells GitHub Pages the custom domain.
- Cloudflare DNS points the apex domain at GitHub Pages' IPs (A records) and `www` at `USERNAME.github.io` (CNAME).
- Cloudflare SSL/TLS mode is set to **Full**.

Any push to `main` redeploys automatically.

## Licence

Do whatever you want with the code. The dollar, however, is mine. 💵
