# Promo Codes API

REST API for promo code management and activation.

## Stack

- Node.js + TypeScript
- Express
- Prisma ORM
- PostgreSQL

## Run locally

1. Copy env file:

   ```bash
   cp .env.example .env
   ```

2. Set your PostgreSQL connection in `.env`.

3. Generate Prisma client and apply migrations:

   ```bash
   npm run prisma:generate
   npm run prisma:migrate -- --name init
   ```

4. Start dev server:

   ```bash
   npm run dev
   ```

## API

### Create promo code

`POST /promocodes`

```json
{
  "code": "SPRING10",
  "discountPercent": 10,
  "activationLimit": 2,
  "expiresAt": "2026-12-31T23:59:59.000Z"
}
```

### List promo codes

`GET /promocodes`

### Get promo code by code

`GET /promocodes/:code`

### Activate promo code

`POST /activations`

```json
{
  "promoCode": "SPRING10",
  "email": "user@example.com"
}
```

## Business rules

- One email can activate a given promo code only once.
- Activation count cannot exceed promo activation limit.
- Expired promo code cannot be activated.
- Activation operation is transaction-safe and uses row-level lock on promo code.
