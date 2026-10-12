# CampusEats API

## Run locally

Copy `.env.example` to `.env`, fill in the Supabase project URL and anon key, then run:

```sh
npm install
npm start
```

The API listens on port `5000` by default. Set `PORT` to override it. `CORS_ORIGINS` accepts a comma-separated list; the local Vite URL, the production CampusEats Vercel URL, and this project's Vercel preview domains are already allowed.

## Supabase tables

Run [`supabase/schema.sql`](supabase/schema.sql) once in the Supabase SQL editor. It creates both tables, seeds the four demo menu items, enables row-level security, and configures the policies used by the API. The script is safe to rerun; existing menu rows with the same IDs are left unchanged.

The orders policy allows unauthenticated order submissions, which suits the demo flow. Add authentication and abuse protection before relying on it for a public production launch. Table creation is intentionally a one-time database migration; the frontend should not have permission to create database tables.

## Routes

- `GET /` returns the API health status.
- `GET /api/menu` returns Supabase menu rows, or the fallback menu if the table is missing or empty.
- `POST /api/orders` accepts menu item IDs and quantities. Prices and totals are looked up and calculated on the server, and the order is saved in Supabase.

Example order body:

```json
{
  "items": [{ "menu_item_id": 1, "quantity": 2 }],
  "customer_name": "Alex",
  "delivery_location": "North Hall, room 204"
}
```

## Docker

Build and run from this directory, with a configured `.env` file:

```sh
docker build -t campuseats-api .
docker run --env-file .env -p 5000:5000 campuseats-api
```