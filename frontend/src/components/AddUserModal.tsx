import React, { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Eye, EyeOff, X } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { createUser } from '../api/usersApis.ts';
import { USER_ROLE_OPTIONS, UserRole } from '../enums/user.ts';
import { Button } from './Button.tsx';
import { FormInput } from './FormInput.tsx';
import toast from 'react-hot-toast';

interface AddUserModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

interface UserFormValues {
  name: string;
  email: string;
  role: UserRole;
  password: string;
  confirmPassword: string;
}

type FormErrors = Partial<Record<keyof UserFormValues, string>>;

const initialValues: UserFormValues = {
  name: '',
  email: '',
  role: UserRole.MEMBER,
  password: '',
  confirmPassword: '',
};

export const AddUserModal: React.FC<AddUserModalProps> = ({
  open,
  onOpenChange,
  onCreated,
}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const createUserMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      onCreated();
       toast.success("User created successfully");
      onOpenChange(false);
    },
  });

  useEffect(() => {
    if (!open) {
      setValues(initialValues);
      setErrors({});
      setShowPassword(false);
      setShowConfirmPassword(false);
      createUserMutation.reset();
    }
  }, [open]);

  const updateValue = <Key extends keyof UserFormValues>(key: Key, value: UserFormValues[Key]) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    createUserMutation.reset();
  };

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};
    const trimmedName = values.name.trim();
    const trimmedEmail = values.email.trim();

    if (!trimmedName) nextErrors.name = 'Name is required';
    else if (trimmedName.length < 2) nextErrors.name = 'Name must be at least 2 characters';
    else if (trimmedName.length > 255) nextErrors.name = 'Name must not exceed 255 characters';

    if (!trimmedEmail) nextErrors.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(trimmedEmail)) nextErrors.email = 'Enter a valid email address';
    else if (trimmedEmail.length > 255) nextErrors.email = 'Email must not exceed 255 characters';

    if (!values.password) nextErrors.password = 'Password is required';
    else if (values.password.length < 8) nextErrors.password = 'Password must be at least 8 characters';

    if (!values.confirmPassword) nextErrors.confirmPassword = 'Confirm password is required';
    else if (values.password !== values.confirmPassword) nextErrors.confirmPassword = 'Passwords do not match';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    createUserMutation.mutate({
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      password: values.password,
      role: values.role,
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-zinc-950/35 backdrop-blur-[2px]" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-lg border border-zinc-200 bg-white p-6 shadow-xl focus:outline-none">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-lg font-semibold text-zinc-900">Add user</Dialog.Title>
              <Dialog.Description className="mt-1 text-xs text-zinc-500">
                Create a user account for this organization.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Close add user dialog"
                className="rounded-md p-1.5 text-zinc-400 outline-none hover:bg-zinc-100 hover:text-zinc-700 focus:ring-2 focus:ring-zinc-900"
              >
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {createUserMutation.isError && (
              <p role="alert" className="rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {createUserMutation.error.message}
              </p>
            )}

            <FormInput
              label="Name"
              placeholder="e.g. Jane Doe"
              maxLength={255}
              value={values.name}
              onChange={(event) => updateValue('name', event.target.value)}
              error={errors.name}
              required
              autoComplete="name"
            />

            <FormInput
              label="Email"
              type="email"
              placeholder="jane.doe@example.com"
              maxLength={255}
              value={values.email}
              onChange={(event) => updateValue('email', event.target.value)}
              error={errors.email}
              required
              autoComplete="email"
            />

            <div className="flex flex-col space-y-1.5">
              <label htmlFor="user-role" className="text-xs font-medium text-zinc-700">
                Role <span className="ml-1 text-rose-500">*</span>
              </label>
              <select
                id="user-role"
                value={values.role}
                onChange={(event) => updateValue('role', event.target.value as UserRole)}
                className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1"
              >
                {USER_ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <FormInput
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="At least 8 characters"
              value={values.password}
              onChange={(event) => updateValue('password', event.target.value)}
              error={errors.password}
              required
              autoComplete="new-password"
              rightElement={(
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 border-0 bg-transparent p-0 text-zinc-400 outline-none hover:text-zinc-700 focus:border-0 focus:outline-none focus:ring-0"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              )}
            />

            <FormInput
              label="Confirm password"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Re-enter the password"
              value={values.confirmPassword}
              onChange={(event) => updateValue('confirmPassword', event.target.value)}
              error={errors.confirmPassword}
              required
              autoComplete="new-password"
              rightElement={(
                <button
                  type="button"
                  aria-label={showConfirmPassword ? 'Hide confirmed password' : 'Show confirmed password'}
                  aria-pressed={showConfirmPassword}
                  onClick={() => setShowConfirmPassword((visible) => !visible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 border-0 bg-transparent p-0 text-zinc-400 outline-none hover:text-zinc-700 focus:border-0 focus:outline-none focus:ring-0"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              )}
            />

            <div className="flex justify-end gap-2 pt-2">
              <Button type="submit" disabled={createUserMutation.isPending}>
                {createUserMutation.isPending ? 'Creating...' : 'Create user'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
