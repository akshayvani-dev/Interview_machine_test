CREATE TYPE "Severity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "Status" AS ENUM ('OPEN', 'INVESTIGATING', 'MITIGATED', 'RESOLVED');

CREATE TABLE "incidents" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "org_id" UUID NOT NULL,
  "title" VARCHAR(255) NOT NULL,
  "description" TEXT NOT NULL,
  "severity" "Severity" NOT NULL,
  "status" "Status" NOT NULL DEFAULT 'OPEN',
  "created_by" UUID NOT NULL,
  "assigned_to" UUID,
  "version" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,

  CONSTRAINT "incidents_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "incidents_org_id_fkey"
    FOREIGN KEY ("org_id") REFERENCES "organizations"("id"),
  CONSTRAINT "incidents_created_by_fkey"
    FOREIGN KEY ("created_by") REFERENCES "users"("id"),
  CONSTRAINT "incidents_assigned_to_fkey"
    FOREIGN KEY ("assigned_to") REFERENCES "users"("id")
);

CREATE INDEX "incidents_org_id_status_created_at_idx"
  ON "incidents"("org_id", "status", "created_at");
CREATE INDEX "incidents_org_id_severity_idx"
  ON "incidents"("org_id", "severity");
CREATE INDEX "incidents_org_id_assigned_to_idx"
  ON "incidents"("org_id", "assigned_to");
