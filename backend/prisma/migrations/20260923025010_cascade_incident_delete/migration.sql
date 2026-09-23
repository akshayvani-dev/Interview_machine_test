-- DropForeignKey
ALTER TABLE "incident_comments" DROP CONSTRAINT "incident_comments_incident_id_fkey";

-- DropForeignKey
ALTER TABLE "incident_events" DROP CONSTRAINT "incident_events_incident_id_fkey";

-- AddForeignKey
ALTER TABLE "incident_events" ADD CONSTRAINT "incident_events_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "incident_comments" ADD CONSTRAINT "incident_comments_incident_id_fkey" FOREIGN KEY ("incident_id") REFERENCES "incidents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
