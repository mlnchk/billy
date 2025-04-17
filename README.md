# React + Vite + Hono + Cloudflare Workers

## Development

Install dependencies:

```bash
npm install
```

Start the development server with:

```bash
npm run dev
```

Your application will be available at [http://localhost:5173](http://localhost:5173).

## Database

1. Make changes to schema

2. Create migration files

```bash
pnpm drizzle:update
```

3. Apply migrations

```bash
pnpm db:migrate
```

## Production

Build your project for production:

```bash
npm run build
```

Preview your build locally:

```bash
npm run preview
```

Deploy your project to Cloudflare Workers:

```bash
npx wrangler deploy
```
