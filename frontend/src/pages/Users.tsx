import React, { useEffect, useState } from "react";
import {
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { Table } from "@radix-ui/themes";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Users as UsersIcon,
} from "lucide-react";
import { getUsers } from "../api/usersApis.ts";
import { AddUserModal } from "../components/AddUserModal.tsx";
import { Badge } from "../components/Badge.tsx";
import { Button } from "../components/Button.tsx";
import { USER_ROLE_OPTIONS, UserRole } from "../enums/user.ts";

export const Users: React.FC = () => {
  const [page, setPage] = useState(1);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [emailSearch, setEmailSearch] = useState("");
  const [debouncedEmail, setDebouncedEmail] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const queryClient = useQueryClient();
  const pageSize = 10;
  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedEmail(emailSearch.trim());
    }, 500);
    return () => window.clearTimeout(timeout);
  }, [emailSearch]);
  useEffect(() => {
    setPage(1);
  }, [debouncedEmail, roleFilter]);
  const usersQuery = useQuery({
    queryKey: ["users", page, pageSize, debouncedEmail, roleFilter],
    queryFn: () =>
      getUsers({
        page,
        limit: pageSize,
        email: debouncedEmail || undefined,
        role: roleFilter ? (roleFilter as UserRole) : undefined,
      }),
    placeholderData: keepPreviousData,
  });
  const users = usersQuery.data?.data ?? [];
  const total = usersQuery.data?.pagination.total ?? 0;
  const totalPages = usersQuery.data?.pagination.totalPages ?? 0;
  const hasPreviousPage = page > 1;
  const hasNextPage = totalPages > 0 && page < totalPages;

  const formatDate = (date: string | null): string => {
    if (!date) return "Never";
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(
      new Date(date),
    );
  };

  const getInitials = (name: string): string =>
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("");

  const getRoleTone = (
    role: string,
  ): "neutral" | "blue" | "amber" | "emerald" => {
    if (role === "ADMIN") return "blue";
    if (role === "MANAGER") return "amber";
    return "emerald";
  };

  return (
    <div id="page-users" className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900 tracking-tight">
            Users
          </h2>
          <p className="text-xs text-zinc-500 mt-1">
            Manage team members, roles, and organization permissions
          </p>
        </div>
        <Button size="sm" onClick={() => setIsAddUserOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add user
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-sm">
        <div className="border-b border-zinc-200 px-4 py-3 sm:px-5">
          {" "}
          <div className="flex flex-col gap-3 sm:flex-row">
            {" "}
            <div className="flex-1">
              {" "}
              <label
                htmlFor="user-email-search"
                className="mb-1.5 block text-xs font-medium text-zinc-600"
              >
                {" "}
                Search by email{" "}
              </label>{" "}
              <input
                id="user-email-search"
                type="search"
                value={emailSearch}
                onChange={(event) => setEmailSearch(event.target.value)}
                placeholder="Search email..."
                className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
              />{" "}
            </div>{" "}
            <div className="w-full sm:w-48">
              {" "}
              <label
                htmlFor="user-role-filter"
                className="mb-1.5 block text-xs font-medium text-zinc-600"
              >
                {" "}
                Filter by role{" "}
              </label>{" "}
              <select
                id="user-role-filter"
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                className="h-9 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
              >
                {" "}
                <option value="">All roles</option>{" "}
                {USER_ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>{" "}
            </div>{" "}
          </div>{" "}
        </div>
        {usersQuery.isError ? (
          <div className="p-8 text-center">
            <p className="text-sm font-medium text-rose-600">
              Unable to load users
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              {usersQuery.error.message}
            </p>
            <Button
              className="mt-4"
              size="sm"
              onClick={() => void usersQuery.refetch()}
            >
              Try again
            </Button>
          </div>
        ) : usersQuery.isLoading ? (
          <div className="p-8 text-center text-sm text-zinc-500">
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="flex min-h-[280px] items-center justify-center p-8 sm:p-12">
            <div className="max-w-xs text-center">
              <div className="mx-auto mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 ring-8 ring-zinc-50">
                <UsersIcon className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900">
                No users yet
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                Users added to this organization will appear here.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="border-b border-zinc-200 px-4 py-3 sm:px-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-zinc-900">
                    Organization users
                  </h3>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {total} {total === 1 ? "member" : "members"} in this
                    workspace
                  </p>
                </div>
                {usersQuery.isFetching && (
                  <span className="text-xs text-zinc-400">Updating...</span>
                )}
              </div>
            </div>
            <div className="overflow-x-auto">
              <Table.Root
                variant="surface"
                size="2"
                className="users-table min-w-[680px]"
              >
                <Table.Header>
                  <Table.Row className="bg-zinc-50/80">
                    <Table.ColumnHeaderCell className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                      Name
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                      Email
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                      Role
                    </Table.ColumnHeaderCell>
                    <Table.ColumnHeaderCell className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                      Last login
                    </Table.ColumnHeaderCell>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {users.map((user) => (
                    <Table.Row
                      key={user.id}
                      className="group transition-colors hover:bg-zinc-50"
                    >
                      <Table.RowHeaderCell className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[11px] font-semibold text-white">
                            {getInitials(user.name)}
                          </div>
                          <span className="font-medium text-zinc-900">
                            {user.name}
                          </span>
                        </div>
                      </Table.RowHeaderCell>
                      <Table.Cell className="px-5 py-3.5 text-sm text-zinc-600">
                        {user.email}
                      </Table.Cell>
                      <Table.Cell className="px-5 py-3.5">
                        <Badge tone={getRoleTone(user.role)}>{user.role}</Badge>
                      </Table.Cell>
                      <Table.Cell className="px-5 py-3.5 text-sm text-zinc-500">
                        {formatDate(user.lastLogin)}
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </div>

            <div className="flex flex-col gap-3 border-t border-zinc-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-zinc-500">
                {total === 0
                  ? "No users"
                  : `Page ${page} of ${totalPages} · ${total} users`}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  aria-label="Previous page"
                  disabled={!hasPreviousPage || usersQuery.isFetching}
                  onClick={() => setPage((currentPage) => currentPage - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Previous</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  aria-label="Next page"
                  disabled={!hasNextPage || usersQuery.isFetching}
                  onClick={() => setPage((currentPage) => currentPage + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Next</span>
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      <AddUserModal
        open={isAddUserOpen}
        onOpenChange={setIsAddUserOpen}
        onCreated={() => {
          void queryClient.invalidateQueries({ queryKey: ["users"] });
        }}
      />
    </div>
  );
};
