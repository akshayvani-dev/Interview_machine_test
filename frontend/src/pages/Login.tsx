import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, ArrowRight } from 'lucide-react';
import { FormInput } from '../components/FormInput.tsx';
import { Button } from '../components/Button.tsx';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login navigation to /dashboard as specified in prompt
    navigate('/dashboard');
  };

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
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            <div className="pt-1">
              <Button
                id="login-submit-btn"
                type="submit"
                variant="primary"
                fullWidth
              >
                <span>Login</span>
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
