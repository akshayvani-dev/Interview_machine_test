import React, { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { createIncident } from "../api/incidentApis.ts";
import { getUsers } from "../api/usersApis.ts";
import {
  INCIDENT_SEVERITY_OPTIONS,
  INCIDENT_STATUS_OPTIONS,
  IncidentSeverity,
  IncidentStatus,
} from "../enums/incident.ts";
import { Button } from "./Button.tsx";
import { FormInput } from "./FormInput.tsx";

interface AddIncidentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

interface IncidentFormValues {
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  assignedTo: string;
}

type FormErrors = Partial<Record<keyof IncidentFormValues, string>>;

const initialValues: IncidentFormValues = {
  title: "",
  description: "",
  severity: IncidentSeverity.MEDIUM,
  status: IncidentStatus.OPEN,
  assignedTo: "",
};

export const AddIncidentModal: React.FC<AddIncidentModalProps> = ({
  open,
  onOpenChange,
  onCreated,
}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});

  // One idempotency key for one incident creation attempt.
  const [idempotencyKey, setIdempotencyKey] = useState(() =>
    crypto.randomUUID(),
  );

  const usersQuery = useQuery({
    queryKey: ["users", "incident-assignees"],
    queryFn: () => getUsers({ page: 1, limit: 100 }),
    enabled: open,
    placeholderData: keepPreviousData,
  });

  const createIncidentMutation = useMutation({
    mutationFn: createIncident,
    onSuccess: () => {
      onCreated();
      onOpenChange(false);
    },
  });

  useEffect(() => {
    if (!open) {
      setValues(initialValues);
      setErrors({});
      createIncidentMutation.reset();

      // Generate a fresh key for the next incident.
      setIdempotencyKey(crypto.randomUUID());
    }
  }, [open]);

  const updateValue = <Key extends keyof IncidentFormValues>(
    key: Key,
    value: IncidentFormValues[Key],
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    createIncidentMutation.reset();
  };

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};
    const title = values.title.trim();
    const description = values.description.trim();

    if (!title) nextErrors.title = "Title is required";
    else if (title.length > 255)
      nextErrors.title = "Title must not exceed 255 characters";

    if (!description) nextErrors.description = "Description is required";
    else if (description.length > 2000)
      nextErrors.description = "Description must not exceed 2000 characters";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!validate()) return;

    createIncidentMutation.mutate({
      payload: {
        title: values.title.trim(),
        description: values.description.trim(),
        severity: values.severity,
        status: values.status,
        ...(values.assignedTo ? { assignedTo: values.assignedTo } : {}),
      },
      idempotencyKey,
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-zinc-950/35 backdrop-blur-[2px]" />

        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-zinc-200 bg-white p-8 shadow-xl focus:outline-none">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-lg font-semibold text-zinc-900">
                Add incident
              </Dialog.Title>

              <Dialog.Description className="mt-1 text-xs text-zinc-500">
                Record an operational event for this organization.
              </Dialog.Description>
            </div>

            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close add incident dialog"
                className="rounded-md p-1.5 text-zinc-400 outline-none hover:bg-zinc-100 hover:text-zinc-700 focus:ring-2 focus:ring-zinc-900"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {createIncidentMutation.isError && (
              <p
                role="alert"
                className="rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700"
              >
                {createIncidentMutation.error.message}
              </p>
            )}

            <FormInput
              label="Title"
              placeholder="e.g. API latency increased"
              maxLength={255}
              value={values.title}
              onChange={(event) => updateValue("title", event.target.value)}
              error={errors.title}
              required
            />

            <div className="flex flex-col space-y-1.5">
              <label
                htmlFor="incident-description"
                className="text-xs font-medium text-zinc-700"
              >
                Description <span className="ml-1 text-rose-500">*</span>
              </label>

              <textarea
                id="incident-description"
                value={values.description}
                onChange={(event) =>
                  updateValue("description", event.target.value)
                }
                placeholder="Describe what happened and the affected service"
                maxLength={2000}
                rows={4}
                className={`w-full resize-y rounded-md border bg-white px-3 py-2 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1 ${
                  errors.description ? "border-rose-400" : "border-zinc-200"
                }`}
                required
              />

              {errors.description && (
                <p className="text-xs text-rose-600">{errors.description}</p>
              )}
            </div>

            <div className="flex flex-col space-y-1.5">
              <label
                htmlFor="incident-severity"
                className="text-xs font-medium text-zinc-700"
              >
                Severity <span className="ml-1 text-rose-500">*</span>
              </label>

              <select
                id="incident-severity"
                value={values.severity}
                onChange={(event) =>
                  updateValue(
                    "severity",
                    event.target.value as IncidentSeverity,
                  )
                }
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1"
              >
                {INCIDENT_SEVERITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col space-y-1.5">
              <label
                htmlFor="incident-assignee"
                className="text-xs font-medium text-zinc-700"
              >
                Assign to <span className="text-zinc-400">(optional)</span>
              </label>

              <select
                id="incident-assignee"
                value={values.assignedTo}
                onChange={(event) =>
                  updateValue("assignedTo", event.target.value)
                }
                disabled={usersQuery.isLoading || usersQuery.isError}
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1 disabled:cursor-not-allowed disabled:bg-zinc-50"
              >
                <option value="">Unassigned</option>

                {(usersQuery.data?.data ?? []).map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>

              {usersQuery.isError && (
                <p className="text-xs text-rose-600">
                  Unable to load organization users
                </p>
              )}
            </div>

            <div className="flex flex-col space-y-1.5">
              <label
                htmlFor="incident-status"
                className="text-xs font-medium text-zinc-700"
              >
                Status <span className="ml-1 text-rose-500">*</span>
              </label>

              <select
                id="incident-status"
                value={values.status}
                onChange={(event) =>
                  updateValue("status", event.target.value as IncidentStatus)
                }
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1"
              >
                {INCIDENT_STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={createIncidentMutation.isPending}>
                {createIncidentMutation.isPending
                  ? "Creating..."
                  : "Create incident"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
