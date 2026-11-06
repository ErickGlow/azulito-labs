# Azulito Labs

**From Prompt to Product.** Personal portfolio of Viacheslav — AI products, automation and creative engineering —
named after Azulito, a real bird.

## Arándano Run 🫐

A 3D browser game at [`/play`](app/play/page.tsx). Spin a giant blueberry globe, pick one of Colombia's
33 departments and guide baby Azulito (no tail yet!) through the streets of its cities — 110 levels in total.
Dodge yellow taxis, buses, motos and pedestrians, and collect arándanos.

- **Globe:** React Three Fiber; the camera flies in from the whole blueberry to Colombia; the selected department lights up green.
- **Levels:** generated from the city name (same city — same streets every time); difficulty grows from city to city.
- **Collisions:** vehicle positions are a pure function of time, so hit detection is exact.
- **Controls:** arrows / WASD, swipe or tap on mobile. Progress is saved in the browser.

## Projects
| Project | Stack | Links |
|---|---|---|
| Construction Mini-CRM | React, TypeScript, Supabase, PostgreSQL RLS | [demo](https://build-crm-xi.vercel.app) · [code](https://github.com/ErickGlow/build-crm) |
| AI Product Cards | Python, LLM API, pytest | [code](https://github.com/ErickGlow/product-card-ai) |
| Multi-model AI Telegram Bot | Python, aiogram, PostgreSQL, Redis, Docker | [code](https://github.com/ErickGlow/ai-telegram-bot-Colombia) |

## Run locally
```bash
npm install
npm run dev     # http://localhost:3000
```
Stack: Next.js 16, React 19, TypeScript, three.js / React Three Fiber, framer-motion.
