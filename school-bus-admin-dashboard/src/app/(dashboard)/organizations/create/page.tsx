'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { ArrowLeft, Building2, Mail, Phone, Sparkles, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/session-context';

export default function CreateOrganizationPage() {
  const { orgApi, user } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setLoading(true);
    try {
      await orgApi.createOrganization({
        name: form.get('name'),
        slug: form.get('slug'),
        adminPhone: form.get('adminPhone'),
        adminEmail: form.get('adminEmail'),
      });
      router.push('/organizations');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'SUPER_ADMIN') {
    return (
      <Card className="max-w-xl border-amber-400/20">
        <h2 className="text-xl font-semibold text-white">Super Admin access only</h2>
        <p className="mt-2 text-sm text-zinc-400">Only platform admins can create new school tenants.</p>
      </Card>
    );
  }

  const fields: Array<{
    name: string;
    placeholder: string;
    Icon: LucideIcon;
    required: boolean;
  }> = [
    { name: 'name', placeholder: 'Organization name', Icon: Building2, required: true },
    { name: 'slug', placeholder: 'tenant-slug', Icon: Building2, required: true },
    { name: 'adminPhone', placeholder: 'School admin phone', Icon: Phone, required: true },
    { name: 'adminEmail', placeholder: 'School admin email', Icon: Mail, required: false },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link href="/organizations" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white">
        <ArrowLeft size={16} />
        Back to organizations
      </Link>

      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.3fr]">
        <Card className="bg-zinc-950/80 p-6">
          <div className="flex size-12 items-center justify-center rounded-lg bg-cyan-400/10 text-cyan-200">
            <Sparkles size={24} />
          </div>
          <h2 className="mt-5 text-3xl font-semibold text-white">Launch a new tenant workspace</h2>
          <p className="mt-3 text-sm leading-6 text-zinc-400">
            This creates the school organization, links its admin identity, and prepares tenant scoped data access
            across dashboard, driver, and parent workflows.
          </p>
          <div className="mt-6 grid gap-3 text-sm">
            {['Tenant isolation', 'School admin bootstrap', 'Fleet-ready workspace'].map((item) => (
              <div key={item} className="rounded-lg border border-zinc-800 bg-black/20 px-3 py-2 text-zinc-300">
                {item}
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <h3 className="text-xl font-semibold text-white">Organization details</h3>
              <p className="mt-1 text-sm text-zinc-500">Use a clean slug because it becomes the tenant handle.</p>
            </div>
            {fields.map(({ name, placeholder, Icon, required }) => (
              <label key={name} className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                  {placeholder}
                </span>
                <div className="flex h-12 items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950 px-3 transition focus-within:border-cyan-400">
                  <Icon size={17} className="text-zinc-500" />
                  <input
                    name={name}
                    required={required}
                    placeholder={placeholder}
                    className="h-full flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
                  />
                </div>
              </label>
            ))}
            <Button disabled={loading} className="w-full">
              {loading ? 'Creating workspace...' : 'Create Organization'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
