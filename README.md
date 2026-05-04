# HGV Travel Oneworld

A Next.js trip planner for Hilton Grand Vacations stays, with:

- CSV-backed HGV hotel/resort destinations
- YYZ as the fixed origin airport
- Suggested destination airports
- Winter ski pass mapping for Ikon and Epic
- Estimated drive distance from hotel to ski resorts
- Weather cards
- Nearby attractions
- oneworld routing estimates

## Local Development

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Optional Environment Variables

The app works from the bundled CSV without secrets. For live date-specific flight-offer counts, add:

```bash
AMADEUS_CLIENT_ID=
AMADEUS_CLIENT_SECRET=
```

For Vercel, add these in Project Settings → Environment Variables.
