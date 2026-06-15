"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { superbase } from '@/utils/supabase_client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await superbase.auth.getSession();
      if (session) router.replace('/dashboard');
    };
    checkAuth();
  }, [router]);


  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await superbase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
    } else {
      router.replace('/dashboard');
    }

    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    const { error } = await superbase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
    if (error) setError(error.message);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#000000] font-sans text-[#09090B] dark:text-[#FAFAFA] transition-colors duration-150">
      <div className="w-full max-w-[360px] bg-[#FFFFFF] dark:bg-[#0A0A0A] rounded-[8px] border border-[#E4E4E7] dark:border-[#27272A] p-[24px] transition-colors duration-150">
        {/* Header */}
        <div className="text-center mb-[24px]">
          <h1 className="text-[20px] font-semibold text-[#09090B] dark:text-[#FAFAFA] leading-[1.3] mb-[4px]">
            Welcome back
          </h1>
          <p className="text-[13px] text-[#52525B] dark:text-[#A1A1AA]">
            Log in to your account
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-[16px] px-[12px] py-[10px] rounded-[6px] bg-[#FEF2F2] dark:bg-[rgba(239,68,68,0.1)] border border-[#FECACA] dark:border-[rgba(239,68,68,0.3)] text-[12px] text-[#991B1B] dark:text-[#F87171]">
            {error}
          </div>
        )}

        {/* Email Form */}
        <form className="flex flex-col gap-[16px]" onSubmit={handleEmailLogin}>
          <div className="flex flex-col">
            <label htmlFor="email" className="text-[12px] font-medium text-[#52525B] dark:text-[#A1A1AA] mb-[6px]">Email address</label>
            <input
              type="email"
              id="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-[#FAFAFA] dark:bg-[#000000] border border-[#E4E4E7] dark:border-[#27272A] rounded-[6px] px-[12px] py-[8px] text-[13px] text-[#09090B] dark:text-[#FAFAFA] placeholder-[#A1A1AA] dark:placeholder-[#52525B] focus:outline-none focus:border-[#09090B] dark:focus:border-[#FAFAFA] focus:ring-1 focus:ring-[#09090B] dark:focus:ring-[#FAFAFA] transition-all duration-100 h-[36px]"
            />
          </div>

          <div className="flex flex-col">
            <div className="flex justify-between items-center mb-[6px]">
              <label htmlFor="password" className="text-[12px] font-medium text-[#52525B] dark:text-[#A1A1AA]">Password</label>
              <a href="#" className="text-[11px] text-[#52525B] dark:text-[#A1A1AA] hover:text-[#09090B] dark:hover:text-[#FAFAFA] transition-colors duration-100">Forgot password?</a>
            </div>
            <input
              type="password"
              id="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-[#FAFAFA] dark:bg-[#000000] border border-[#E4E4E7] dark:border-[#27272A] rounded-[6px] px-[12px] py-[8px] text-[13px] text-[#09090B] dark:text-[#FAFAFA] placeholder-[#A1A1AA] dark:placeholder-[#52525B] focus:outline-none focus:border-[#09090B] dark:focus:border-[#FAFAFA] focus:ring-1 focus:ring-[#09090B] dark:focus:ring-[#FAFAFA] transition-all duration-100 h-[36px]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#09090B] dark:bg-[#FAFAFA] hover:opacity-90 disabled:opacity-50 text-white dark:text-[#09090B] text-[13px] font-medium h-[32px] px-[14px] rounded-[6px] transition-all duration-75 active:scale-[0.98] mt-[4px] cursor-pointer"
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center my-[20px]">
          <div className="flex-grow border-t border-[#E4E4E7] dark:border-[#27272A]"></div>
          <span className="mx-[12px] text-[11px] text-[#A1A1AA] uppercase tracking-wider font-medium">Or continue with</span>
          <div className="flex-grow border-t border-[#E4E4E7] dark:border-[#27272A]"></div>
        </div>

        {/* Social Logins */}
        <div className="flex flex-col gap-[12px]">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-[8px] bg-transparent hover:bg-[#F4F4F5] dark:hover:bg-[#18181B] border border-[#E4E4E7] dark:border-[#27272A] text-[#09090B] dark:text-[#FAFAFA] text-[13px] font-medium h-[32px] px-[14px] rounded-[6px] transition-colors duration-100 cursor-pointer"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>
        </div>

        <div className="mt-[24px] text-center">
          <p className="text-[13px] text-[#52525B] dark:text-[#A1A1AA]">
            Don't have an account?{' '}
            <Link href="/signup" className="text-[#09090B] dark:text-[#FAFAFA] font-medium hover:underline cursor-pointer">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
