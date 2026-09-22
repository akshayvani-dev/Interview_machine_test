import React, { useId } from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
  rightElement?: React.ReactNode;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, hint, rightElement, id, className = '', ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className="flex flex-col space-y-1.5 w-full">
        <div className="flex justify-between items-center">
          <LabelPrimitive.Root
            htmlFor={inputId}
            className="text-xs font-medium text-zinc-700 select-none tracking-tight"
          >
            {label}
            {props.required && <span className="text-rose-500 ml-1">*</span>}
          </LabelPrimitive.Root>
          {hint && !error && (
            <span className="text-[11px] text-zinc-400">{hint}</span>
          )}
        </div>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            className={`w-full px-3 py-2 ${rightElement ? 'pr-10' : ''} text-sm bg-white border rounded-md text-zinc-900 placeholder:text-zinc-400 
            transition-colors duration-150 outline-none
            focus:ring-2 focus:ring-zinc-900 focus:ring-offset-1 focus:border-zinc-900
            disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500
            ${error ? 'border-rose-400 focus:ring-rose-500 focus:border-rose-500' : 'border-zinc-200'}
            ${className}`}
            {...props}
          />
          {rightElement}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="text-xs text-rose-600 font-normal">
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormInput.displayName = 'FormInput';
