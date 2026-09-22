import React, { useState } from 'react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { Table } from '@radix-ui/themes';
import { AlertCircle, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { getCurrentProfile } from '../api/authApis.ts';
import { getIncidents } from '../api/incidentApis.ts';
import { AddIncidentModal } from '../components/AddIncidentModal.tsx';
import { Badge } from '../components/Badge.tsx';
import { Button } from '../components/Button.tsx';
import { getIncidentSeverityTone, getIncidentStatusTone } from '../utils/incident.ts';

export const Incidents: React.FC = () => {
  const [page, setPage] = useState(1);
  const [isAddIncidentOpen, setIsAddIncidentOpen] = useState(false);
  const pageSize = 10;
  const queryClient = useQueryClient();
  const profileQuery = useQuery({
    queryKey: ['current-profile'],
    queryFn: getCurrentProfile,
    staleTime: 5 * 60 * 1000,
  });
  const incidentsQuery = useQuery({
    queryKey: ['incidents', page, pageSize],
    queryFn: () => getIncidents(page, pageSize),
    placeholderData: keepPreviousData,
  });

  const incidents = incidentsQuery.data?.data ?? [];
  const total = incidentsQuery.data?.pagination.total ?? 0;
  const totalPages = incidentsQuery.data?.pagination.totalPages ?? 0;
  const hasPreviousPage = page > 1;
  const hasNextPage = totalPages > 0 && page < totalPages;
  const canCreateIncident = profileQuery.data?.type === 'user';

  const formatDate = (date: string): string =>
    new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(date));

  return (
    <div id="page-incidents" className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-zinc-900">Incidents</h2>
          <p className="mt-1 text-xs text-zinc-500">Track active operational events and system escalations</p>
        </div>
        {canCreateIncident && (
          <Button size="sm" onClick={() => setIsAddIncidentOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add incident
          </Button>
        )}
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        {incidentsQuery.isError ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-rose-600">Unable to load incidents</p>
            <p className="mt-1 text-xs text-zinc-500">{incidentsQuery.error.message}</p>
            <Button className="mt-4" size="sm" onClick={() => void incidentsQuery.refetch()}>Try again</Button>
          </div>
        ) : incidentsQuery.isLoading ? (
          <div className="p-8 text-center text-sm text-zinc-500">Loading incidents...</div>
        ) : incidents.length === 0 ? (
          <div className="flex min-h-[280px] items-center justify-center p-8 sm:p-12">
            <div className="max-w-xs text-center">
              <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 ring-8 ring-zinc-50">
                <AlertCircle className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900">No incidents yet</h3>
              <p className="mt-2 text-xs leading-relaxed text-zinc-500">Incidents created for this organization will appear here.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="border-b border-zinc-200 px-4 py-3 sm:px-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900">Organization incidents</h3>
                  <p className="mt-0.5 text-xs text-zinc-500">{total} {total === 1 ? 'incident' : 'incidents'} recorded</p>
                </div>
                {incidentsQuery.isFetching && <span className="text-xs text-zinc-400">Updating...</span>}
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table.Root variant="surface" size="2" className="users-table min-w-[820px]">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeaderCell>Incident</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Description</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Severity</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Status</Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell>Created</Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {incidents.map((incident) => (
                    <Table.Row key={incident.id}>
                      <Table.RowHeaderCell>
                        <span className="font-medium text-zinc-900">{incident.title}</span>
                      </Table.RowHeaderCell>
                      <Table.Cell className="max-w-[280px] truncate">{incident.description}</Table.Cell>
                      <Table.Cell><Badge tone={getIncidentSeverityTone(incident.severity)}>{incident.severity}</Badge></Table.Cell>
                      <Table.Cell><Badge tone={getIncidentStatusTone(incident.status)}>{incident.status}</Badge></Table.Cell>
                      <Table.Cell>{formatDate(incident.createdAt)}</Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </div>
            <div className="flex flex-col gap-3 border-t border-zinc-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-zinc-500">Page {page} of {totalPages} · {total} {total === 1 ? 'incident' : 'incidents'}</p>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" aria-label="Previous page" disabled={!hasPreviousPage || incidentsQuery.isFetching} onClick={() => setPage((currentPage) => currentPage - 1)}>
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Previous</span>
                </Button>
                <Button size="sm" variant="outline" aria-label="Next page" disabled={!hasNextPage || incidentsQuery.isFetching} onClick={() => setPage((currentPage) => currentPage + 1)}>
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Next</span>
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {canCreateIncident && (
        <AddIncidentModal
          open={isAddIncidentOpen}
          onOpenChange={setIsAddIncidentOpen}
          onCreated={() => {
            void queryClient.invalidateQueries({ queryKey: ['incidents'] });
          }}
        />
      )}
    </div>
  );
};
