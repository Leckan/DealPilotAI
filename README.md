# DealPilot AI

DealPilot AI is an AI-powered real estate deal analyzer for investors.

> The AI acquisitions analyst every real estate investor wishes they had.

This MVP helps investors analyze fix-and-flip, rental, BRRRR, and small multifamily deals with fast underwriting metrics, deal scoring, saved local analyses, and mock AI acquisition notes.

## Features

- Landing page, dashboard, new deal analysis, results, and saved deals pages
- Deal input form with validation
- Server-backed analysis route at `/api/deals/analyze`
- Mock AI insight route at `/api/deals/insights`
- LocalStorage saved deals for MVP persistence
- PostgreSQL-ready schema reference in `src/lib/deal-schema.ts`
- Metrics for MAO, profit, ROI, cash flow, NOI, cap rate, cash-on-cash return, DSCR, score, risk, and recommendation
- Placeholder PDF export panel ready for a future report-generation API

## Tech Stack

- Next.js App Router
- TypeScript
- React
- Tailwind CSS
- Node test runner

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

```bash
npm test
npm run lint
npm run build
```

## Notes

The MVP uses mock calculations and local browser storage. Future integrations are marked in code for:

- Property data APIs
- Rent comp APIs
- AI analysis
- PDF generation
- PostgreSQL persistence

## Validation

Current checks:

```bash
npm test
npm run lint
npm run build
```

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
