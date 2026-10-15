<div align="center">

# ⚡ hono-commerce

**An enterprise-grade, multi-tenant e-commerce SaaS platform built for high-scale multi-vendor marketplaces and independent brand storefronts.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x%2F6.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16%20App%20Router-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Hono](https://img.shields.io/badge/Hono-v4-E36002?logo=hono&logoColor=white)](https://hono.dev/)
[![Bun](https://img.shields.io/badge/Bun-v1.3-FBF0DF?logo=bun&logoColor=black)](https://bun.sh/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%2B-4169E1?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Drizzle ORM](https://img.shields.io/badge/Drizzle_ORM-v0.45-C5F74F?logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![Redis](https://img.shields.io/badge/Redis-BullMQ-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Better Auth](https://img.shields.io/badge/Better--Auth-v1.7-black)](https://better-auth.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![wakatime](https://wakatime.com/badge/github/edmealem-k/hono-commerce.svg)](https://wakatime.com/badge/github/edmealem-k/hono-commerce)

</div>

---

> [!NOTE]
> **Active Development Notice**: `hono-commerce` is actively being developed. Architecture blueprints, core engines, and foundational portal modules are live. Follow along or star the repository for updates as new features, payment integrations, and storefront flows land!

---

## 🌟 Key Highlights

- **Multi-Tenant Subdomain & Custom Domain Routing**:
  - Independent branded storefronts (`[slug].shop.com` / `[slug].localhost:3001`) and management portals (`[slug].localhost:3002`).
  - Next.js 16 Edge proxying (`proxy.ts`) with RFC 6761 zero-config local subdomain resolution.
  - Built-in header spoofing protection and verified tenant context propagation.
- **End-to-End Type Safety (Hono Native RPC)**:
  - 100% type-safe client-server communication using Hono's `hc<AppType>()`.
  - Zero manual route dictionaries: backend TypeScript AST directly infers routes, URL parameters, query parameters, and return types.
  - Shared Zod validation schemas across API validators (`zValidator`) and frontend forms (`react-hook-form` + `zodResolver`).
- **Modern Next.js 16 & React 19 Frontend**:
  - Powered by Next.js 16 App Router, React 19, and Tailwind CSS v4.
  - Headless `@base-ui/react` primitives combined with shared enterprise UI composites (Dynamic Data Tables, Stacked Drawers, Modal Dialogs, Resizable Split-View, S3 File Previewers).
  - Shareable, URL-addressable view state managed via `nuqs` synchronized with TanStack Query.
- **Robust Multi-Tenant Authentication & RBAC (`packages/auth`)**:
  - Powered by Better Auth with PostgreSQL Drizzle adapter.
  - Cross-subdomain cookie sharing across root and tenant subdomains (`.localhost` in dev, `.yourdomain.com` in prod).
  - Fine-grained Dynamic RBAC with namespace-scoped permissions cached directly in sessions.
- **Asynchronous Event-Driven Pipeline (`packages/queue` & `apps/worker`)**:
  - Unified Redis message bus via BullMQ with automatic exponential backoff retries and dead-letter queueing.
  - Decoupled workers for order state machines, transactional emails (React Email + Nodemailer/Resend), notification fan-out, and storage cleanup.
  - Embedded visual Bull-Board monitoring dashboard at `/admin/queues`.
- **Dedicated Real-Time Server (`apps/realtime`)**:
  - Standalone Socket.io WebSocket server with Redis Pub/Sub adapter for customer support, merchant team chat, and system notifications.
- **Secure Cloud Storage (`apps/api/src/modules/storage`)**:
  - Direct S3 presigned upload & short-lived read URL workflows (`@aws-sdk/s3-request-presigner`).
  - Strict tenant storage isolation (`tenants/{tenantId}/{category}/{file}`).

---

## 🏛️ System Architecture & Monorepo Topology

```
hono-commerce/
├── apps/
│   ├── storefront/              # Public Storefront & Customer Portal (Next.js 16 + React 19)
│   │                            #   • Multi-tenant routing: [slug].shop.com & custom CNAMEs
│   │                            #   • Product catalog, cart, checkout, reviews & live support
│   ├── dashboard/               # Unified Management Portal (Next.js 16 + React 19)
│   │                            #   • /(tenant) Store & order management, catalog, team settings
│   │                            #   • /(admin) Superadmin platform oversight & Bull-Board UI
│   │                            #   • /(public) Auth, sign-in, signup, verification & invitations
│   ├── api/                     # High-Performance Backend API (Hono on Bun)
│   │                            #   • Modular domain slices (tenants, invitations, users, storage)
│   │                            #   • Better-Auth handlers, Bull-Board dashboard, S3 presigning
│   ├── realtime/                # Dedicated WebSocket Server (Socket.io + Redis Pub/Sub)
│   │                            #   • Customer-to-vendor support, merchant chat, room management
│   └── worker/                  # Background Asynchronous Consumer (BullMQ + Redis)
│                                #   • Transactional emails, notification pipelines, storage cleanup
│
├── packages/
│   ├── auth/                    # Better-Auth configuration, cross-domain cookies, RBAC policies
│   ├── db/                      # PostgreSQL Drizzle ORM schemas, relations, and migration tooling
│   ├── ui/                      # Shared component library (@base-ui/react, Tailwind v4, composites)
│   ├── queue/                   # Pluggable Queue Manager, BullMQ contracts, typed job publishers
│   ├── notification/            # React Email templates & multi-channel notification dispatcher
│   ├── types/                   # Shared Zod schemas, domain DTOs, and frontend route catalog
│   ├── env/                     # Type-safe environment validation (@t3-oss/env-* + Zod)
│   └── config/                  # Shared TypeScript, ESLint, Oxlint, and Tailwind configurations
│
└── docs/
    ├── architecture/            # Deep architectural blueprints & system design documentation
    └── specs/                   # Spec-Driven Development (SDD) feature contracts & execution plans
```

---

## 🛠️ Tech Stack

| Layer                         | Technologies                                                                                                                                             |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Runtime & Package Manager** | [Bun](https://bun.sh/) (Workspace monorepo via Turborepo)                                                                                                |
| **Frontend Framework**        | [Next.js 16](https://nextjs.org/) (App Router, Server Actions, `proxy.ts` edge routing)                                                                  |
| **UI & Styling**              | [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), [@base-ui/react](https://base-ui.com/), [Lucide Icons](https://lucide.dev/) |
| **State & Data Fetching**     | [TanStack Query v5](https://tanstack.com/query), [nuqs](https://nuqs.47ng.com/) (URL search params state)                                                |
| **Backend API**               | [Hono v4](https://hono.dev/) on Bun, Typed RPC Client (`hc`)                                                                                             |
| **Database & ORM**            | [PostgreSQL 15+](https://www.postgresql.org/), [Drizzle ORM](https://orm.drizzle.team/) (Relational Queries API)                                         |
| **Authentication**            | [Better-Auth](https://better-auth.com/) (with cross-subdomain sessions & custom RBAC)                                                                    |
| **Message Queue & Jobs**      | [BullMQ](https://bullmq.io/) + [Redis 7](https://redis.io/), [@bull-board/hono](https://github.com/felixmosh/bull-board)                                 |
| **Realtime**                  | [Socket.io](https://socket.io/) with `@socket.io/redis-adapter`                                                                                          |
| **Emails**                    | [React Email](https://react.email/), [Resend](https://resend.com/) / Nodemailer                                                                          |
| **Storage**                   | [AWS S3](https://aws.amazon.com/s3/) (Presigned Uploads & Private Read URLs)                                                                             |
| **Linting & Formatting**      | [Oxlint](https://oxc.rs/) + [Oxfmt](https://oxc.rs/) (Lightning-fast Rust-based tooling)                                                                 |

---

## 🌐 Local Development & Subdomain Resolution

Thanks to [RFC 6761](https://tools.ietf.org/html/rfc6761), all `*.localhost` subdomains natively resolve to `127.0.0.1` in all modern browsers without needing `/etc/hosts` modifications!

| Service / Portal              | Local URL                             | Description                                              |
| ----------------------------- | ------------------------------------- | -------------------------------------------------------- |
| **Backend API**               | `http://localhost:3000`               | Core REST & RPC API server                               |
| **API Health Check**          | `http://localhost:3000/api/v1/health` | API status endpoint                                      |
| **Bull-Board Dashboard**      | `http://localhost:3000/admin/queues`  | Live visual BullMQ job queue inspector                   |
| **Public Storefront**         | `http://localhost:3001`               | Public marketplace / root storefront                     |
| **Tenant Storefront**         | `http://[slug].localhost:3001`        | Branded tenant store (e.g. `http://acme.localhost:3001`) |
| **Dashboard (Public Auth)**   | `http://localhost:3002`               | Sign-in, sign-up, email verification, invites            |
| **Tenant Merchant Portal**    | `http://[slug].localhost:3002`        | Store management (e.g. `http://acme.localhost:3002`)     |
| **Platform Superadmin**       | `http://admin.localhost:3002`         | Platform administration & tenant oversight               |
| **Realtime WebSocket Server** | `http://localhost:3003`               | Dedicated Socket.io server                               |
| **Drizzle Studio**            | `bun run db:studio`                   | Interactive web GUI for PostgreSQL database              |

---

## 🚀 Getting Started

### 1. Prerequisites

Ensure you have the following installed locally:

- [Bun](https://bun.sh/) `v1.2.0` or higher
- [PostgreSQL](https://www.postgresql.org/) `v15` or higher (or running via Docker)
- [Redis](https://redis.io/) `v7` or higher (or running via Docker)
- [Docker & Docker Compose](https://www.docker.com/) (optional, for running dependencies or full-stack containers)

### 2. Clone the Repository

```bash
git clone https://github.com/edmealem-k/hono-commerce.git
cd hono-commerce
```

### 3. Install Dependencies

```bash
bun install
```

### 4. Configure Environment Variables

Copy the example environment files for each application:

```bash
cp apps/api/.env.example apps/api/.env
cp apps/dashboard/.env.example apps/dashboard/.env
cp apps/storefront/.env.example apps/storefront/.env
cp apps/worker/.env.example apps/worker/.env
cp apps/realtime/.env.example apps/realtime/.env
```

Key variables to check in `apps/api/.env` and `apps/worker/.env`:

- `DATABASE_URL`: Your PostgreSQL connection string (e.g. `postgresql://postgres:postgres@localhost:5432/hono_commerce_db`)
- `REDIS_URL`: Your Redis connection string (e.g. `redis://localhost:6379`)
- `BETTER_AUTH_SECRET`: A 32+ character secret key (generate with `openssl rand -base64 32`)
- `BETTER_AUTH_URL`: `http://localhost:3000`
- `BETTER_AUTH_COOKIE_DOMAIN`: `localhost` (allows auth session sharing across all `*.localhost` subdomains)

### 5. Start Infrastructure (PostgreSQL & Redis)

If you'd like to run Redis and PostgreSQL with Docker:

```bash
docker run -d --name hono-redis -p 6379:6379 redis:7-alpine
docker run -d --name hono-postgres -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=hono_commerce_db postgres:16-alpine
```

### 6. Initialize the Database

Push the schema to your PostgreSQL database:

```bash
bun run db:push
```

_(Optional: Run the database seeder)_

```bash
bun run db:seed
```

### 7. Run the Development Server

Start all services simultaneously via Turborepo:

```bash
bun run dev
```

Or start specific apps individually:

```bash
bun run dev:api         # Hono API Server (port 3000)
bun run dev:dashboard   # Merchant & Admin Portal (port 3002)
bun run dev:storefront  # Public Storefront (port 3001)
bun run dev:worker      # BullMQ Worker
bun run dev:realtime    # Socket.io Realtime Server (port 3003)
```

---

## 📜 Available Scripts

| Command                | Action                                                                                          |
| ---------------------- | ----------------------------------------------------------------------------------------------- |
| `bun run dev`          | Start all monorepo applications in concurrent development mode                                  |
| `bun run build`        | Build all production applications with Turborepo caching                                        |
| `bun run check-types`  | Run TypeScript type checks across all apps and packages                                         |
| `bun run check`        | Run fast linting and formatting auto-fix ([Oxlint](https://oxc.rs/) & [Oxfmt](https://oxc.rs/)) |
| `bun run verify`       | Complete verification pipeline: Oxlint + Oxfmt format check + Turborepo type checks             |
| `bun run db:push`      | Push Drizzle schema changes directly to PostgreSQL                                              |
| `bun run db:generate`  | Generate SQL migration files from Drizzle schema definitions                                    |
| `bun run db:migrate`   | Apply pending SQL migrations to the database                                                    |
| `bun run db:seed`      | Run database seed script                                                                        |
| `bun run db:studio`    | Launch Drizzle Studio browser database GUI                                                      |
| `bun run docker:build` | Build Docker images for production deployment                                                   |
| `bun run docker:up`    | Spin up containerized stack via Docker Compose in the background                                |
| `bun run docker:logs`  | Follow live container logs                                                                      |
| `bun run docker:down`  | Stop and tear down Docker Compose containers                                                    |

---

## 🐳 Docker Deployment

The repository includes ready-to-run container configurations for deployment via Docker Compose:

```bash
# Build and spin up the complete stack
bun run docker:up

# Check container health and view logs
bun run docker:logs

# Shut down the stack
bun run docker:down
```

---

## 📐 Architecture & Standards

Detailed architectural documentation, Decision Records (ADRs), and implementation specifications live in the `docs/` folder:

- 📖 [System Architecture Blueprint](docs/architecture/system-architecture.md)
- 🔐 [Authentication & RBAC Architecture](docs/architecture/authentication-architecture.md)
- 🔀 [Domain Routing & Edge Proxy Architecture](docs/architecture/routing-and-proxy-architecture.md)
- 🎨 [Design System Guidelines](docs/architecture/design-system-guidelines.md)
- 📋 [Spec-Driven Development (SDD) Catalog](docs/specs/)

---

## 🤝 Contributing

Contributions, issues, and feature suggestions are very welcome!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/amazing-feature`)
3. Commit your Changes (`git commit -m 'feat: add amazing feature'`)
4. Verify code quality (`bun run verify`)
5. Push to the Branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more details.
