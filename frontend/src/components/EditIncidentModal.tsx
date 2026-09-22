import React, { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { updateIncident, type Incident } from "../api/incidentApis.ts";
import { getUsers } from "../api/usersApis.ts";
import {
  INCIDENT_SEVERITY_OPTIONS,
  INCIDENT_STATUS_OPTIONS,
  IncidentSeverity,
  IncidentStatus,
} from "../enums/incident.ts";
import { Button } from "./Button.tsx";
import { FormInput } from "./FormInput.tsx";

interface EditIncidentModalProps {
  incident: Incident | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
}

interface FormValues {
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  assignedTo: string;
}

interface UpdateIncidentPayload extends FormValues {
  version: number;
}

type FormErrors = Partial<Record<keyof FormValues, string>>;

const initialValues: FormValues = {
  title: "",
  description: "",
  severity: IncidentSeverity.MEDIUM,
  status: IncidentStatus.OPEN,
  assignedTo: "",
};

export const EditIncidentModal: React.FC<EditIncidentModalProps> = ({
  incident,
  open,
  onOpenChange,
  onUpdated,
}) => {
  const [values, setValues] = useState<FormValues>(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});

  const usersQuery = useQuery({
    queryKey: ["users", "incident-assignees"],
    queryFn: () => getUsers({ page: 1, limit: 100 }),
    enabled: open,
    placeholderData: keepPreviousData,
  });

  const mutation = useMutation({
    mutationFn: (payload: UpdateIncidentPayload) => {
      if (!incident) {
        throw new Error("Incident is required");
      }

      return updateIncident(incident.id, {
        title: payload.title,
        description: payload.description,
        severity: payload.severity,
        status: payload.status,
        ...(payload.assignedTo
          ? { assignedTo: payload.assignedTo }
          : {}),
        version: payload.version,
      });
    },

    onSuccess: () => {
      onUpdated();
      onOpenChange(false);
    },
  });

  useEffect(() => {
    if (incident && open) {
      setValues({
        title: incident.title,
        description: incident.description,
        severity: incident.severity,
        status: incident.status,
        assignedTo:
          typeof incident.assignedTo === "string"
            ? incident.assignedTo
            : (incident.assignedTo?.id ?? ""),
      });

      setErrors({});
      mutation.reset();
    }
  }, [incident, open]);

  const updateValue = <Key extends keyof FormValues>(
    key: Key,
    value: FormValues[Key],
  ) => {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));

    setErrors((current) => ({
      ...current,
      [key]: undefined,
    }));

    mutation.reset();
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!incident) return;

    const nextErrors: FormErrors = {};

    const title = values.title.trim();
    const description = values.description.trim();

    if (!title) {
      nextErrors.title = "Title is required";
    } else if (title.length > 255) {
      nextErrors.title = "Title must not exceed 255 characters";
    }

    if (!description) {
      nextErrors.description = "Description is required";
    } else if (description.length > 2000) {
      nextErrors.description =
        "Description must not exceed 2000 characters";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    mutation.mutate({
      title,
      description,
      severity: values.severity,
      status: values.status,
      assignedTo: values.assignedTo,
      version: incident.version,
    });
  };

  if (!incident) {
    return null;
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-zinc-950/35 backdrop-blur-[2px]" />

        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-zinc-200 bg-white p-8 shadow-xl focus:outline-none">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-lg font-semibold text-zinc-900">
                Edit incident
              </Dialog.Title>

              <Dialog.Description className="mt-1 text-xs text-zinc-500">
                Update incident details.
              </Dialog.Description>
            </div>

            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close edit incident"
                className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-900"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {mutation.isError && (
              <p
                role="alert"
                className="rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700"
              >
                {mutation.error.message}
              </p>
            )}

            <FormInput
              label="Title"
              maxLength={255}
              value={values.title}
              onChange={(event) =>
                updateValue("title", event.target.value)
              }
              error={errors.title}
              required
            />

            <div className="flex flex-col space-y-1.5">
              <label
                htmlFor="edit-incident-description"
                className="text-xs font-medium text-zinc-700"
              >
                Description{" "}
                <span className="ml-1 text-rose-500">*</span>
              </label>

              <textarea
                id="edit-incident-description"
                maxLength={2000}
                rows={6}
                value={values.description}
                onChange={(event) =>
                  updateValue("description", event.target.value)
                }
                className={`w-full resize-y rounded-md border bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1 ${
                  errors.description
                    ? "border-rose-400"
                    : "border-zinc-200"
                }`}
              />

              {errors.description && (
                <p className="text-xs text-rose-600">
                  {errors.description}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-700">
                Severity

                <select
                  value={values.severity}
                  onChange={(event) =>
                    updateValue(
                      "severity",
                      event.target.value as IncidentSeverity,
                    )
                  }
                  className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-normal outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900"
                >
                  {INCIDENT_SEVERITY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-1.5 text-xs font-medium text-zinc-700">
                Status

                <select
                  value={values.status}
                  onChange={(event) =>
                    updateValue(
                      "status",
                      event.target.value as IncidentStatus,
                    )
                  }
                  className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm font-normal outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900"
                >
                  {INCIDENT_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex flex-col space-y-1.5">
              <label
                htmlFor="edit-incident-assignee"
                className="text-xs font-medium text-zinc-700"
              >
                Assign to{" "}
                <span className="text-zinc-400">(optional)</span>
              </label>

              <select
                id="edit-incident-assignee"
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

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
