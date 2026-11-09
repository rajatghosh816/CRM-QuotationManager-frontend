# CRM Quotation Manager

One Angular app with three areas:

| Area | URL | Who | What they do |
|---|---|---|---|
| Super admin | `/superadmin` | Platform owner | Onboard businesses, manage subscription plans, enable/disable users |
| Business admin | `/business` | A business on the platform | Manage customers and products, create, send and track quotations |
| Customer portal | `/portal` | A business's customer | View quotations sent to them, accept or decline, print |

The UI uses Tailwind CSS v4 utility classes only. `src/styles.css` only imports Tailwind.

## Run it

```bash
npm install
npm start          # http://localhost:4200
```

## Demo accounts (mock data)

| Role | Email | Password |
|---|---|---|
| Super admin | admin@crm.test | admin123 |
| Business admin (Acme Interiors) | owner@acme.test | admin123 |
| Business admin (BrightWave Solar) | owner@brightwave.test | admin123 |
| Customer (of Acme) | john@carterhomes.test | customer123 |
| Customer (of BrightWave) | rahul@mehtatextiles.test | customer123 |

GreenLeaf Catering (`owner@greenleaf.test`) is suspended, so its users cannot sign in.
Changes are saved in the browser's localStorage. Use **Reset demo data** on the login page to start over.

## How the mock data works

Components never touch mock data directly. They call services in `src/app/core/services/`, and those services make real `HttpClient` requests to `/api/...`.
`src/app/core/mock/mock-backend.interceptor.ts` intercepts those requests and answers them from an in-memory database seeded by `core/mock/seed-data.ts`. It adds network latency, sends proper error responses, checks roles and scopes each request to the signed-in user's business or customer record.

**To switch to the real backend:**

1. Remove `mockBackendInterceptor` from `src/app/app.config.ts`.
2. Set `API_URL` in `src/app/core/api.ts`, or add a dev-server proxy for `/api`.
3. Build the endpoints listed below. The request and response shapes are the types in `src/app/core/models.ts`.

## API contract

Every endpoint except login needs `Authorization: Bearer <token>`. Errors return `{ "message": string }`.

**Auth**
- `POST /api/auth/login` `{email, password}` → `{token, user}`
- `GET /api/auth/me` → `User`
- `PUT /api/auth/password` `{currentPassword, newPassword}`

**Super admin** (`superadmin` role)
- `GET /api/admin/stats` → `PlatformStats`
- `GET|POST /api/admin/businesses`, `GET|PUT|DELETE /api/admin/businesses/:id` (POST also creates the first business admin)
- `GET|POST /api/admin/plans`, `PUT|DELETE /api/admin/plans/:id`
- `GET /api/admin/users`, `PATCH /api/admin/users/:id` `{status}`

**Business admin** (`business_admin` role, scoped to the user's business)
- `GET /api/business/stats` → `BusinessStats`
- `GET|PUT /api/business/profile`
- `GET|POST /api/business/customers`, `GET|PUT|DELETE /api/business/customers/:id` (POST also creates the customer's portal login)
- `GET|POST /api/business/products`, `PUT|DELETE /api/business/products/:id`
- `GET|POST /api/business/quotations`, `GET|PUT|DELETE /api/business/quotations/:id` (body may include `send: true`)
- `POST /api/business/quotations/:id/send`, `POST /api/business/quotations/:id/duplicate`

**Customer portal** (`customer` role, scoped to the user's customer record)
- `GET /api/portal/stats`, `GET /api/portal/business`
- `GET /api/portal/quotations`, `GET /api/portal/quotations/:id` (marks a `sent` quotation as `viewed`)
- `POST /api/portal/quotations/:id/accept` `{comment?}`, `POST /api/portal/quotations/:id/reject` `{comment}`
- `GET|PUT /api/portal/profile`

## Quotation lifecycle

`draft` → `sent` → `viewed` (the customer opened it) → `accepted` / `rejected`.
A `sent` or `viewed` quotation becomes `expired` after its valid-until date. Editing a sent quotation moves it back to `draft` until it is re-sent. Accepted quotations are locked; duplicate one to make changes.

## Project layout

```
src/app/
  core/          models, API services, auth, guards, mock backend
  shared/        shell layout, UI pieces, quotation document, Tailwind class presets (ui.ts)
  features/
    auth/        login
    superadmin/  dashboard, businesses, plans, users, account
    business/    dashboard, quotations, editor, customers, products, settings
    portal/      home, quotations, quotation response, profile
```
