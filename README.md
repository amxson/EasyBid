# EasyBid

EasyBid is an auction platform for buying and selling items in Ethiopian birr. Sellers publish timed listings, bidders compete on price, and administrators review commission payment proofs.

The frontend uses React and Redux Toolkit. The API uses Express and Mongoose, with MongoDB as the source of truth for bids and settlement. Payments are arranged between buyers and sellers; the app does not collect money or provide escrow.

## What works

- Public auction browsing, with search, category and status filters, and price or deadline sorting. Filters stay in the URL.
- Bidder and auctioneer accounts, cookie-based sessions, and password recovery by email.
- Bidding with an enforced starting price and deadline. Competing requests cannot overwrite a higher bid.
- Seller ownership checks, auction management, and republishing of ended listings that received no bids.
- Commission payment proof submission and administrative review.
- Transactional auction and commission settlement, plus queued email notifications.
- A listing-specific bid-help panel with budget checks. Optional AI answers use the same panel and require the visitor to opt in.

The existing sidebar, red accents, stone background, and card layout are retained.

## Run locally

Use Node.js 24 LTS and npm. The backend needs a **MongoDB replica set**; MongoDB Atlas works. A standalone `mongod` is not sufficient because bidding and settlement use transactions.

```sh
cd backend
npm ci
cp .env.example .env
```

Edit `.env` with your MongoDB connection string and a random JWT secret. Keep the database name consistent with your existing installation; the default is `MERN_AUCTION_PLATFORM`.

For an existing database, back it up and run the migration before starting the upgraded API:

```sh
npm run migrate
npm run dev
```

The migration checks for duplicate or missing emails and invalid auction dates before changing records. It normalizes emails and dates and builds indexes. It does not delete users, bids, or auctions. If it reports inconsistent records, repair them before trying again. Previously settled balances are not recalculated automatically.

In another terminal:

```sh
cd frontend
npm ci
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`. Vite forwards `/api` to the backend on port 4000. Leave `VITE_API_URL` empty for this setup.

### Disposable demo

To try the app without setting up MongoDB, copy the backend environment example, set `JWT_SECRET_KEY`, then run:

```sh
cd backend
npm ci
npm run demo
```

Start the frontend as above. The demo creates a temporary single-node replica set and seeded listings. Its data disappears when the process stops. MongoDB's test binary is downloaded on the first run.

All demo accounts use `Demo1234!`:

| Account | Email |
| --- | --- |
| Bidder | `bidder@easybid.demo` |
| Auctioneer | `auctioneer@easybid.demo` |
| Administrator | `admin@easybid.demo` |

The separate `npm run seed` command clears the selected database. It refuses to run unless `SEED_DEMO_DATA=true` is explicitly set. Use it only with a disposable database, never production.

## Services and configuration

Backend configuration is listed in `backend/.env.example`.

| Setting | Purpose |
| --- | --- |
| `MONGO_URI`, `MONGO_DB_NAME` | Replica-set connection and database name |
| `JWT_SECRET_KEY`, `JWT_EXPIRE`, `COOKIE_EXPIRE` | Session signing and lifetime |
| `FRONTEND_URL` | Exact allowed frontend origins, comma-separated |
| `CLOUDINARY_*` | Profile images, listing images, and payment proof uploads |
| `SMTP_*` | Password reset, contact messages, and settlement notifications |
| `PASSWORD_RESET_URL` | Canonical frontend URL used in reset emails |
| `CONTACT_EMAIL` | Contact inbox; defaults to `SMTP_MAIL` |
| `CRON_SECRET` | Bearer secret for the scheduled-job endpoint |
| `OPENAI_API_KEY`, `OPENAI_MODEL` | Optional AI bid help; both must be set to enable it |

Cloudinary is required for uploads. Files are limited to 5 MB. SMTP is required for real email delivery. Password recovery gives the same response for known and unknown addresses; check mail-service logs if delivery fails.

AI help is off unless configured. The built-in guide still explains deadlines, bidding rules, payments, and budget limits. If enabled, the visitor can choose to send their question, recent conversation, budget, and public listing details to OpenAI. Account and payment records are not added to those requests. The key stays on the backend. AI answers cannot place bids, initiate payments, or change accounts. Provider failures fall back to the guide.

## Bid consistency

`POST /api/v1/bid/place/:id` accepts an `amount` with at most two decimal places. It must meet the starting price and exceed the current bid.

A MongoDB transaction reads the listing, conditionally updates its price and embedded bidder list, then updates the bidder's `Bid` record. The write checks the deadline against database time. MongoDB retries write conflicts with a fresh snapshot. If any write fails, all changes roll back.

Two equal bids arriving together produce one `201` and one `409`. Two different amounts can both succeed if they form a valid increasing sequence; the final price cannot move backwards. The frontend refreshes the price after a conflict and disables repeat submission while a bid is pending.

| HTTP status | Meaning |
| --- | --- |
| `400` | Malformed ID, invalid amount, or invalid form input |
| `401` | Missing, expired, revoked, or invalid session |
| `403` | Wrong role, another seller's listing, or disallowed origin |
| `404` | Missing auction, proof, or API route |
| `409` | Price conflict, closed auction, duplicate account, or an invalid state change |
| `413` | Upload exceeds the size limit |
| `429` | Request limit reached; `Retry-After` tells the client when to retry |
| `500` / `503` | Unexpected failure or unavailable dependency; internal details stay out of the response |

## Settlement and email

On a persistent Node server, two workers run each minute unless `DISABLE_CRON=true`:

- Ended auctions record the winner and add a 5% seller commission once. Existing debt is preserved.
- Approved payment proofs reduce outstanding commission and record revenue once. Overpayments remain approved for review instead of silently clearing debt.

These changes are transactional and tolerate overlapping workers. Notifications enter an email queue in the same transaction. The mail worker leases jobs for five minutes and retries failures up to five times. Inspect `emailjobs` for exhausted jobs. Mail delivery is at least once: a process failure after SMTP accepts a message but before it is marked sent can result in a duplicate email. Balance changes remain idempotent.

## Checks

```sh
npm --prefix backend test
npm --prefix frontend run lint
npm --prefix frontend test
npm --prefix frontend run build
```

Backend tests start an isolated MongoDB replica set and exercise concurrent HTTP bids, rollback, session handling, password reset, ownership, rate limits, settlement, and bid help. Frontend tests cover filters, deadline timers, protected routes, password recovery, and help opt-in. CI runs both suites, lint, and the production build on pushes and pull requests.

## Deployment

The repository contains two Vercel projects:

- `frontend`: build with `npm run build`; output directory `dist`. Its API rewrite currently targets `https://easy-bid-dltk.vercel.app`.
- `backend`: `api.js` awaits the database connection and initializes Cloudinary before handling requests. Set the backend environment variables in this project.

Set `FRONTEND_URL` and `PASSWORD_RESET_URL` to the real frontend origin. The frontend normally keeps `VITE_API_URL` empty and uses the same-origin API rewrite. If the backend URL changes, update `frontend/vercel.json` too. Run `npm run migrate` against the intended database before switching production traffic.

Serverless deployments do not run in-process timers. Configure a scheduler to call `GET /api/internal/jobs` on the backend with `Authorization: Bearer <CRON_SECRET>`. Choose a schedule supported by your hosting plan; auction bids stop at the deadline even if settlement runs later. The endpoint handles up to 100 auctions, 100 proofs, and 25 emails per invocation. Monitor job failures and increase the invocation frequency if a backlog develops.

Before release, verify uploads and email delivery with the deployed service credentials. The test suite does not contact production Cloudinary, SMTP, or OpenAI accounts.
