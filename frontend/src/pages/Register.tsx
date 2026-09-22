import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, CheckCircle2 } from 'lucide-react';
import { FormInput } from '../components/FormInput.tsx';
import { Button } from '../components/Button.tsx';

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export const Register: React.FC = () => {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSuccess, setIsSuccess] = useState(false);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name.trim()) {
      newErrors.name = 'Organization name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Please provide a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Confirming your password is required';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validate()) {
      setIsSuccess(true);
      // Wait a moment or navigate immediately to /login as requested
      setTimeout(() => {
        navigate('/login');
      }, 700);
    }
  };

  return (
    <div id="register-page" className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-zinc-50 font-sans">
      <div className="w-full max-w-sm">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-zinc-900 text-white mb-3">
            <Building2 className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
            Register your organization
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Create an organization workspace to manage operations
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-zinc-200 rounded-lg p-6">
          {isSuccess ? (
            <div className="text-center py-6 space-y-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mb-1">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-base font-semibold text-zinc-900">Registration Successful</h2>
              <p className="text-xs text-zinc-500">
                Redirecting you to the login screen...
              </p>
            </div>
          ) : (
            <form id="register-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
              <FormInput
                id="register-name"
                label="Organization name"
                type="text"
                placeholder="Acme Industries"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
                }}
                error={errors.name}
                required
                autoComplete="organization"
              />

              <FormInput
                id="register-email"
                label="Work email"
                type="email"
                placeholder="admin@acme.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
                }}
                error={errors.email}
                required
                autoComplete="email"
              />

              <FormInput
                id="register-password"
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                }}
                error={errors.password}
                required
                autoComplete="new-password"
              />

              <FormInput
                id="register-confirm-password"
                label="Confirm password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                }}
                error={errors.confirmPassword}
                required
                autoComplete="new-password"
              />

              <div className="pt-2">
                <Button
                  id="register-submit-btn"
                  type="submit"
                  variant="primary"
                  fullWidth
                >
                  Register
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Login link */}
        <div className="text-center mt-6">
          <p className="text-xs text-zinc-500">
            Already have an account?{' '}
            <Link
              id="back-to-login-link"
              to="/login"
              className="font-medium text-zinc-900 underline hover:text-zinc-700 transition-colors ml-0.5"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
