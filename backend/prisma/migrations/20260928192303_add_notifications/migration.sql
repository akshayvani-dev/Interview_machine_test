-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INCIDENT_CREATED', 'INCIDENT_ASSIGNED', 'INCIDENT_UPDATED');

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "org_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "incident_id" UUID NOT NULL,
    "incident_event_id" UUID NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "read_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_created_at_idx" ON "notifications"("user_id", "read_at", "created_at");

-- CreateIndex
CREATE INDEX "notifications_org_id_created_at_idx" ON "notifications"("org_id", "created_at");

-- CreateIndex
CREATE INDEX "notifications_incident_id_created_at_idx" ON "notifications"("incident_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "notifications_incident_event_id_user_id_key" ON "notifications"("incident_event_id", "user_id");

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_org_id_fkey" FOREIGN KEY ("org_id") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_incident_event_id_fkey" FOREIGN KEY ("incident_event_id") REFERENCES "incident_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
