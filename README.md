# Incident Management System

A multi-tenant incident management and response system built around **organizations, users, incidents, incident lifecycle tracking, comments, assignments, and audit events**.

The system uses **JWT token-based authentication** for login sessions, PostgreSQL for persistent storage, Prisma ORM for database access, and an **Express server with rate limiting** for API protection.

---

## Features

* Organization-based multi-tenancy
* JWT token-based authentication
* JWT-based login sessions
* Role-based access control
* Incident creation and management
* Incident severity classification
* Incident status/lifecycle management
* Incident assignment
* Incident comments
* Incident activity/audit history
* API rate limiting
* Idempotent incident creation
* Optimistic concurrency control for incident updates
* Organization-level data isolation
* PostgreSQL database
* Prisma ORM
* UUID-based identifiers

---

# Technology Stack

| Technology         | Purpose                       |
| ------------------ | ----------------------------- |
| Node.js            | Runtime                       |
| Express.js         | HTTP/API server               |
| TypeScript         | Application language          |
| PostgreSQL         | Primary database              |
| Prisma             | ORM/database access           |
| JWT                | Authentication/session tokens |
| bcrypt/Argon2      | Password hashing              |
| Express Rate Limit | API rate limiting             |

---

# Architecture Overview

```text
                         Client
                           │
                           │ HTTP Request
                           ▼
                    ┌──────────────┐
                    │ Express API  │
                    └──────┬───────┘
                           │
             ┌─────────────┼─────────────┐
             │             │             │
             ▼             ▼             ▼
        Rate Limiter    JWT Auth    Request Validation
             │             │             │
             └─────────────┼─────────────┘
                           ▼
                    Authorization
                           │
                           ▼
                    Business Rules
                           │
                           ▼
                       Prisma
                           │
                           ▼
                     PostgreSQL
```

The API uses middleware to protect requests before they reach the business/service layer.

---

# JWT Authentication

The application uses **JWT token-based authentication**.

## Login Flow

```text
Client
  │
  │ email + password
  ▼
Express Authentication API
  │
  ├── Validate credentials
  ├── Verify password hash
  ├── Update lastLogin
  └── Generate JWT
        │
        ▼
      Client
```

Authenticated requests include:

```http
Authorization: Bearer <JWT_TOKEN>
```

The JWT should contain the minimum identity and authorization information required by the application.

Example:

```json
{
  "sub": "user-uuid",
  "orgId": "organization-uuid",
  "role": "ADMIN"
}
```

The server validates:

* Token signature
* Token expiration
* User identity
* Organization context
* Required permissions

The client must not be trusted to provide its own organization or role for authorization.

---

# Express Server

The application runs its HTTP API through an **Express.js server**.

A typical middleware pipeline is:

```text
Request
   │
   ▼
CORS / Security Headers
   │
   ▼
Rate Limiter
   │
   ▼
JWT Authentication
   │
   ▼
Request Validation
   │
   ▼
Authorization
   │
   ▼
Route Handler
   │
   ▼
Service Layer
   │
   ▼
Prisma
   │
   ▼
PostgreSQL
```

Keeping authentication, rate limiting, validation, and authorization in middleware allows the business logic to focus on the actual incident-management operations.

---

# Rate Limiting

The Express server uses rate limiting to protect the API from excessive requests and abuse.

Rate limiting is particularly important for endpoints such as:

* Login
* Registration
* Password-related endpoints
* Incident creation
* Incident updates
* Comment creation
* Other frequently accessed APIs

A rate limiter can be implemented using middleware such as `express-rate-limit`.

Conceptually:

```text
Client
   │
   │  Request
   ▼
┌─────────────────┐
│ Express Rate    │
│ Limiter         │
└────────┬────────┘
         │
         ├── Limit exceeded ──► HTTP 429
         │
         ▼
      API Route
```

When the configured request limit is exceeded, the server should return:

```http
429 Too Many Requests
```

## Rate Limiting Strategy

Rate limits should be configured according to the endpoint's risk profile.

For example:

```text
Authentication endpoints
        │
        └── Strict rate limit

Normal authenticated APIs
        │
        └── Higher rate limit

Read-only endpoints
        │
        └── Higher throughput
```

The exact limits should be configurable through environment variables rather than hard-coded when possible.

Example configuration:

```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX_REQUESTS=10
```

Authentication endpoints should generally have stricter limits because repeated login attempts can be used for credential attacks.

Rate limiting should not replace authentication or authorization; it is an additional protection layer.

---

# Multi-Tenancy

The system is designed as a **multi-tenant application**.

An `Organization` represents the tenant boundary.

The following entities contain `orgId`:

```text
User
Incident
IncidentEvent
IncidentComment
```

All protected operations must respect the authenticated user's organization.

For example, an incident lookup should conceptually use:

```sql
SELECT *
FROM incidents
WHERE id = ?
  AND org_id = ?;
```

where `org_id` comes from the authenticated JWT/session context.

This prevents a user from accessing an incident belonging to another organization simply by knowing its UUID.

---

# Idempotency

Incident creation supports idempotency through:

```prisma
idempotencyKey String?
```

and the database constraint:

```prisma
@@unique([orgId, idempotencyKey])
```

This prevents duplicate incident creation when the same request is retried.

## Why Idempotency Is Required

Network requests can be retried because of:

* Network timeouts
* Client retries
* Reverse proxy retries
* Temporary connection failures
* User double-clicking a submit button
* Mobile/network instability

Without idempotency, the same logical request could create multiple incidents.

---

## Idempotency Flow

The client sends:

```http
POST /incidents
Idempotency-Key: 8f8f7c1e-...
Authorization: Bearer <JWT>
```

The server performs:

```text
Request
   │
   ▼
Validate JWT
   │
   ▼
Get organization from authenticated user
   │
   ▼
Read Idempotency-Key
   │
   ▼
Check existing incident
   │
   ├── Exists ─────────► Return existing result
   │
   └── Does not exist
             │
             ▼
        Create incident
             │
             ▼
        Create CREATED event
             │
             ▼
        Return response
```

The idempotency key is scoped to the organization.

Therefore:

```text
Organization A + KEY-123 → Incident A

Organization A + KEY-123 → Existing Incident A

Organization B + KEY-123 → Incident B
```

The same key can therefore exist in different organizations.

---

## Idempotency and Database Constraints

The application should not rely only on a preliminary existence check.

For example:

```text
Request A ──┐
            ├── Check key → Not found
Request B ──┘
            └── Check key → Not found
```

Both requests could pass the check concurrently.

The database constraint:

```prisma
@@unique([orgId, idempotencyKey])
```

provides the final consistency guarantee.

Therefore, the recommended implementation is:

```text
Application check
       +
Database unique constraint
       +
Transaction
```

If concurrent requests use the same organization and idempotency key, one request creates the incident and the other handles the unique-constraint conflict by returning the already-created result according to the API contract.

---

# Optimistic Concurrency Control

Incident updates use the `version` field to prevent concurrent requests from silently overwriting each other's changes.

The schema defines:

```prisma
version Int @default(1)
```

The version represents the current revision of the incident.

---

## Problem Without Concurrency Control

Consider two users:

```text
Initial Incident
version = 5
```

User A reads:

```text
version = 5
status = OPEN
```

User B also reads:

```text
version = 5
status = OPEN
```

User A changes the status:

```text
OPEN → INVESTIGATING
version 5 → 6
```

User B still has the old version:

```text
version = 5
```

If the server blindly applies User B's update, it can overwrite changes made by User A.

---

# Version-Based Incident Update

The client sends the version it last read.

Example:

```http
PATCH /incidents/:id
Authorization: Bearer <JWT>
Content-Type: application/json
```

```json
{
  "status": "MITIGATED",
  "version": 5
}
```

The server performs an update that requires the expected version.

Conceptually:

```sql
UPDATE incidents
SET
    status = 'MITIGATED',
    version = version + 1,
    updated_at = NOW()
WHERE
    id = :incidentId
    AND org_id = :organizationId
    AND version = :expectedVersion;
```

The important part is:

```sql
AND version = :expectedVersion
```

---

## Successful Update

If the current database version is `5`:

```text
Expected version = 5
Database version = 5

        ↓

Update succeeds

        ↓

Version becomes 6
```

The server can then create the corresponding incident event.

```text
Transaction
 ├── UPDATE incident
 │      version 5 → 6
 │
 └── INSERT IncidentEvent
        STATUS_CHANGED
```

---

## Stale Update

If another request has already changed the incident:

```text
Expected version = 5
Database version = 6
```

The update affects zero rows.

The server should treat this as a concurrency conflict rather than silently overwriting the newer data.

A suitable response is:

```http
409 Conflict
```

Example:

```json
{
  "error": "INCIDENT_VERSION_CONFLICT",
  "message": "The incident has been modified by another request. Refresh the incident and retry.",
  "currentVersion": 6
}
```

The exact response format can be adapted to the project's API contract.

---

# Optimistic Concurrency Transaction

Incident state changes and audit events should be written atomically.

Example:

```text
PATCH Incident
       │
       ▼
Validate JWT
       │
       ▼
Validate organization
       │
       ▼
Validate role
       │
       ▼
Validate requested state transition
       │
       ▼
Start Transaction
       │
       ├── Update incident
       │      WHERE version = expectedVersion
       │
       ├── Check affected rows
       │
       ├── Increment version
       │
       └── Create IncidentEvent
       │
       ▼
Commit
```

If the version check fails, the transaction should not create an event.

This prevents an audit record from being created for an update that was never successfully applied.

---

# Idempotency vs Optimistic Concurrency

These two mechanisms solve different problems.

| Mechanism       | Problem Solved                                            |
| --------------- | --------------------------------------------------------- |
| Idempotency key | Prevents duplicate processing of the same logical request |
| Version number  | Prevents stale updates from overwriting newer changes     |

### Idempotency

Protects against:

```text
Same request
    ↓
Retry
    ↓
Retry
    ↓
Duplicate operation
```

### Optimistic concurrency

Protects against:

```text
User A reads version 5
User B reads version 5
       ↓
Both attempt updates
       ↓
Only update based on current version succeeds
```

They should therefore be used together rather than as replacements for each other.

---

# Incident Mutation Pattern

For mutation endpoints, the recommended processing order is:

```text
HTTP Request
    │
    ▼
Rate Limit
    │
    ▼
JWT Authentication
    │
    ▼
Organization Context
    │
    ▼
Role Authorization
    │
    ▼
Request Validation
    │
    ▼
Business Rule Validation
    │
    ├───────────────┐
    │               │
    ▼               ▼
Idempotency      Version Check
    │               │
    └───────┬───────┘
            ▼
        Transaction
            │
            ├── Update Incident
            │
            └── Create Event
            │
            ▼
          Commit
            │
            ▼
         Response
```

Not every endpoint requires both an idempotency key and a version check. The mechanism should be applied according to the operation.

For example:

| Operation       |                 Idempotency |    Version |
| --------------- | --------------------------: | ---------: |
| Create incident |                         Yes |         No |
| Update incident | Optional/endpoint-dependent |        Yes |
| Change status   | Optional/endpoint-dependent |        Yes |
| Change severity | Optional/endpoint-dependent |        Yes |
| Assign incident | Optional/endpoint-dependent |        Yes |
| Add comment     |          Endpoint-dependent | Usually No |

---

# Incident Audit Trail

Important mutations create `IncidentEvent` records.

Supported event types:

```text
CREATED
UPDATED
STATUS_CHANGED
SEVERITY_CHANGED
ASSIGNED
```

Example lifecycle:

```text
Incident created
       │
       ▼
CREATED
       │
       ▼
ASSIGNED
       │
       ▼
STATUS_CHANGED
       │
       ▼
SEVERITY_CHANGED
       │
       ▼
UPDATED
       │
       ▼
STATUS_CHANGED
```

The event history allows the application to reconstruct how an incident changed over time.

---

# Incident Lifecycle

Supported statuses:

```text
OPEN
  │
  ▼
INVESTIGATING
  │
  ▼
MITIGATED
  │
  ▼
RESOLVED
```

The service layer must enforce the project's documented status transition rules.

Every successful status change should generate:

```text
Incident update
+
STATUS_CHANGED event
```

within the same transaction.

---

# Incident Severity

Supported severities:

```text
LOW
MEDIUM
HIGH
CRITICAL
```

Severity changes should generate:

```text
SEVERITY_CHANGED
```

events so that changes remain visible in the audit trail.

---

# Comments

Users can add comments to incidents.

Each comment belongs to:

```text
Organization
    │
    └── Incident
            │
            └── Comment
                  │
                  └── User
```

Comments must respect the same organization-level authorization rules as incidents.

A user from Organization A must not be able to add or retrieve comments belonging to an incident in Organization B.

---

# Security Model

The application uses multiple layers of protection:

```text
                    ┌──────────────────┐
                    │   HTTPS / TLS    │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  Rate Limiting   │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │ JWT Authentication│
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │  Authorization   │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │ Tenant Isolation │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │ Business Rules  │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │ DB Constraints  │
                    └──────────────────┘
```

No individual layer should be considered a replacement for the others.

---

# Database Constraints Supporting Business Rules

The database provides important integrity guarantees.

### Organization

```text
Unique organization name
Unique organization email
```

### User

```text
Unique user email
```

### Incident

```text
Unique (organization, idempotencyKey)
```

### Relationships

Foreign keys ensure that:

```text
User → Organization
Incident → Organization
Incident → Creator
Incident → Assignee
IncidentEvent → Incident
IncidentEvent → Organization
IncidentEvent → User
IncidentComment → Incident
IncidentComment → Organization
IncidentComment → User
```

remain referentially valid.

---

# Database Transactions

Operations that change incident state and create corresponding audit events should use database transactions.

For example:

```text
BEGIN
  │
  ├── Update Incident
  │
  ├── Increment Version
  │
  └── Create IncidentEvent
  │
COMMIT
```

If any operation fails:

```text
ROLLBACK
```

This ensures the application does not end up with:

```text
Incident updated
but
Audit event missing
```

or:

```text
Audit event exists
but
Incident update failed
```

---

# Environment Variables

Example:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE"

JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="15m"

RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX_REQUESTS=10
```

Production secrets must not be committed to source control.

---

# Database Setup

Install dependencies:

```bash
npm install
```

Generate Prisma Client:

```bash
npx prisma generate
```

Run migrations during development:

```bash
npx prisma migrate dev
```

Deploy migrations in production:

```bash
npx prisma migrate deploy
```

---

# Development

Start the development server:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Run production:

```bash
npm start
```

The exact scripts depend on the project's `package.json`.

---

# Design Summary

The project combines several mechanisms to provide a reliable incident-management API:

```text
┌─────────────────────────────────────────────────────┐
│                    Express API                      │
├─────────────────────────────────────────────────────┤
│ Rate Limiting                                        │
│ JWT Authentication                                   │
│ Role-Based Authorization                             │
│ Organization/Tenant Isolation                        │
│ Request Validation                                   │
├─────────────────────────────────────────────────────┤
│                 Business Logic                       │
│                                                     │
│ Incident Lifecycle                                  │
│ Idempotency                                          │
│ Optimistic Concurrency                               │
│ Assignment                                           │
│ Comments                                             │
│ Audit Events                                         │
├─────────────────────────────────────────────────────┤
│                    Prisma                            │
├─────────────────────────────────────────────────────┤
│                   PostgreSQL                         │
└─────────────────────────────────────────────────────┘
```

### Key Reliability Mechanisms

**Rate limiting**

Protects the Express API from excessive requests and abuse.

**JWT authentication**

Provides stateless authentication for API requests.

**Organization isolation**

Ensures users operate only within their authorized tenant.

**Idempotency**

Prevents duplicate incident creation when requests are retried.

**Optimistic concurrency**

Prevents stale incident updates from overwriting newer changes.

**Transactions**

Keep incident state and audit events consistent.

**Incident events**

Provide a persistent audit trail for important incident changes.

Together these mechanisms provide the foundation for a multi-tenant incident-management system with authenticated access, controlled API usage, reliable mutations, and auditable incident state changes.
