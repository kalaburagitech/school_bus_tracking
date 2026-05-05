'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { BusFront, KeyRound, LockKeyhole, MapPinned, Phone, Radio, Route } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSession } from '@/lib/session-context';

export default function LoginPage() {
  const router = useRouter();
  const { api, login } = useSession();
  const [phone, setPhone] = useState('9880020224');
  const [otp, setOtp] = useState('123456');
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const requestOtp = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.requestOtp(phone);
      setStep('verify');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.verifyOtp(phone, otp);
      const data = res.data as {
        accessToken: string;
        refreshToken: string;
        user: {
          id: string;
          role: 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'DRIVER' | 'PARENT' | 'STUDENT' | 'STAFF';
          tenantId: string | null;
        };
      };
      login({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
        tenantId: data.user.tenantId || '',
      });
      router.replace('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(34,211,238,0.18),transparent_28%),radial-gradient(circle_at_82%_78%,rgba(16,185,129,0.14),transparent_30%)]" />
      <div className="absolute inset-x-0 top-28 h-px bg-gradient-to-r from-transparent via-cyan-300/30 to-transparent" />
      <motion.div
        aria-hidden
        initial={{ x: '-10%' }}
        animate={{ x: '110%' }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        className="absolute top-28 hidden h-20 w-64 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/5 text-cyan-200 blur-[0.2px] lg:flex"
      >
        <BusFront size={42} />
      </motion.div>

      <section className="relative z-10 grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
        <div className="flex min-h-[45vh] flex-col justify-between px-6 py-8 md:px-12 lg:min-h-screen">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-lg border border-cyan-300/30 bg-cyan-300/10 text-cyan-200">
              <Route size={24} />
            </div>
            <div>
              <div className="text-lg font-bold tracking-[0.18em]">KLB TRANSPORT</div>
              <div className="text-xs uppercase tracking-[0.22em] text-zinc-500">Command Console</div>
            </div>
          </div>

          <div className="max-w-3xl py-14">
            <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-sm font-medium text-emerald-200">
                <Radio size={15} />
                Live school mobility platform
              </div>
              <h1 className="max-w-2xl text-5xl font-semibold leading-tight md:text-6xl">
                Secure transport operations, mapped in real time.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-zinc-400">
                Manage schools, fleet, drivers, students, routes, attendance, and live bus visibility from one polished operations surface.
              </p>
            </motion.div>

            <div className="mt-10 grid gap-3 md:grid-cols-3">
              {[
                ['Fleet', 'Live buses', BusFront],
                ['Routes', 'Geo stops', MapPinned],
                ['Access', 'OTP secured', LockKeyhole],
              ].map(([label, value, Icon]) => (
                <div key={label as string} className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-4">
                  <Icon className="text-cyan-300" size={22} />
                  <div className="mt-4 text-sm font-semibold">{label as string}</div>
                  <div className="mt-1 text-xs text-zinc-500">{value as string}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs text-zinc-600">Backend API: {process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000'}</div>
        </div>

        <div className="flex items-center justify-center border-l border-zinc-800 bg-zinc-950/70 px-6 py-10 backdrop-blur">
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900/90 p-6 shadow-2xl shadow-black/50"
          >
            <div className="mb-6">
              <div className="flex size-11 items-center justify-center rounded-lg bg-cyan-400 text-zinc-950">
                <KeyRound size={22} />
              </div>
              <h2 className="mt-5 text-2xl font-semibold">Admin Login</h2>
              <p className="mt-2 text-sm text-zinc-500">
                {step === 'request' ? 'Enter your registered mobile number.' : 'Enter the OTP sent to this mobile number.'}
              </p>
            </div>

            {error ? (
              <div className="mb-4 rounded-lg border border-red-400/20 bg-red-400/10 px-3 py-2 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <form className="space-y-4" onSubmit={step === 'request' ? requestOtp : verifyOtp}>
              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Mobile number</span>
                <div className="flex h-12 items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950 px-3 transition focus-within:border-cyan-400">
                  <Phone size={17} className="text-zinc-500" />
                  <input
                    className="h-full flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9880020224"
                  />
                </div>
              </label>

              {step === 'verify' ? (
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">OTP code</span>
                  <div className="flex h-12 items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-950 px-3 transition focus-within:border-cyan-400">
                    <LockKeyhole size={17} className="text-zinc-500" />
                    <input
                      className="h-full flex-1 bg-transparent text-sm text-zinc-100 outline-none placeholder:text-zinc-600"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="123456"
                    />
                  </div>
                </label>
              ) : null}

              <Button className="h-12 w-full" disabled={loading}>
                {loading ? 'Please wait...' : step === 'request' ? 'Request OTP' : 'Verify and Enter'}
              </Button>
            </form>
          </motion.div>
        </div>
      </section>
    </main>
  );
}
