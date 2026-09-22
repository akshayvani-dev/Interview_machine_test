import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { login } from '../api/authApis.ts';
import { FormInput } from '../components/FormInput.tsx';
import { Button } from '../components/Button.tsx';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: () => navigate('/dashboard'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email: email.trim(), password });
  };

  const error = loginMutation.error?.message;

  return (
    <div id="login-page" className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-zinc-50 font-sans">
      <div className="w-full max-w-sm">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-zinc-900 text-white mb-3">
            <Building2 className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
            Sign in to your account
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Enter your credentials to access the internal panel
          </p>
        </div>

        {/* Card */}
        <div className="bg-white border border-zinc-200 rounded-lg p-6">
          <form id="login-form" onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <p role="alert" className="text-xs text-rose-600">
                {error}
              </p>
            )}

            <FormInput
              id="login-email"
              label="Email address"
              type="email"
              placeholder="you@organization.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <FormInput
              id="login-password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
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

            <div className="pt-1">
              <Button
                id="login-submit-btn"
                type="submit"
                variant="primary"
                fullWidth
                disabled={loginMutation.isPending}
              >
                <span>{loginMutation.isPending ? 'Signing in...' : 'Login'}</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </form>
        </div>

        {/* Organization registration link */}
        <div className="text-center mt-6">
          <p className="text-xs text-zinc-500">
            Need an organization workspace?{' '}
            <Link
              id="join-org-link"
              to="/register"
              className="font-medium text-zinc-900 underline hover:text-zinc-700 transition-colors ml-0.5"
            >
              Join as organization
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
