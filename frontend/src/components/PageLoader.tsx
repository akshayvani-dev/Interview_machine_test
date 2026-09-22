import React from 'react';
import { LoaderCircle } from 'lucide-react';

interface PageLoaderProps {
  message?: string;
}

export const PageLoader: React.FC<PageLoaderProps> = ({ message = 'Loading your workspace' }) => {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-50 px-6">
      <div className="absolute inset-x-0 top-0 h-px bg-zinc-200" />
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-lg shadow-zinc-900/10">
          <div className="absolute inset-1 rounded-xl border border-white/15" />
          <LoaderCircle className="h-6 w-6 animate-spin text-white" aria-hidden="true" />
        </div>
        <p className="text-sm font-semibold tracking-tight text-zinc-900">{message}</p>
        <p className="mt-1.5 text-xs text-zinc-500">Preparing your workspace</p>
        <div className="mt-5 h-1 w-32 overflow-hidden rounded-full bg-zinc-200" aria-hidden="true">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-zinc-900" />
        </div>
      </div>
    </div>
  );
};
