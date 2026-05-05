'use client';

import type React from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function shortId(id: string) {
  return id ? id.slice(-8).toUpperCase() : 'UNSET';
}

export function AdminInput({
  label,
  className,
  inputClassName,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; inputClassName?: string }) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </span>
      <input
        {...props}
        className={cn(
          'h-11 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-cyan-400',
          inputClassName,
        )}
      />
    </label>
  );
}

export function AdminSelect({
  label,
  children,
  className,
  selectClassName,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; selectClassName?: string }) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </span>
      <select
        {...props}
        className={cn(
          'h-11 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 text-sm text-zinc-100 outline-none transition focus:border-cyan-400',
          selectClassName,
        )}
      >
        {children}
      </select>
    </label>
  );
}

export function AdminTextarea({
  label,
  className,
  textareaClassName,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; textareaClassName?: string }) {
  return (
    <label className={cn('block', className)}>
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
        {label}
      </span>
      <textarea
        {...props}
        className={cn(
          'min-h-24 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-3 text-sm text-zinc-100 outline-none transition placeholder:text-zinc-600 focus:border-cyan-400',
          textareaClassName,
        )}
      />
    </label>
  );
}

export function SearchBar({
  value,
  onChange,
  onSearch,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  onSearch: () => void;
  placeholder: string;
}) {
  return (
    <Card className="flex flex-col gap-3 p-3 md:flex-row">
      <div className="flex h-11 flex-1 items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-950 px-3">
        <Search size={16} className="text-zinc-500" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') onSearch();
          }}
          placeholder={placeholder}
          className="h-full flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
        />
      </div>
      <Button onClick={onSearch}>Search</Button>
    </Card>
  );
}

export function FormModal({
  open,
  title,
  description,
  children,
  footer,
  onClose,
}: {
  open: boolean;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-lg border border-zinc-800 bg-zinc-950 shadow-2xl shadow-black">
        <div className="flex items-start justify-between gap-4 border-b border-zinc-800 px-5 py-4">
          <div>
            <h3 className="text-xl font-semibold text-white">{title}</h3>
            {description ? <p className="mt-1 text-sm text-zinc-500">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-900 hover:text-white"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="max-h-[calc(92vh-138px)] overflow-y-auto px-5 py-5">{children}</div>
        <div className="flex justify-end gap-2 border-t border-zinc-800 px-5 py-4">{footer}</div>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="px-5 py-12 text-center">
      <p className="font-medium text-zinc-200">{title}</p>
      <p className="mt-1 text-sm text-zinc-500">{description}</p>
    </div>
  );
}
