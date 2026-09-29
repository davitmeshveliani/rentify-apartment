'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { userService } from '@/services/userService';

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);
    setLoading(true);

    try {
      await userService.login({
        email,
        password,
      });

      // Backend stores JWT tokens in HttpOnly cookies.
      // No token should be stored in localStorage.

      router.push('/');
      router.refresh();
    } catch (err: any) {
      console.error('Login error:', err);

      setError(
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        'Invalid email or password.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-gray-200 shadow-md">

        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-emerald-600 transition bg-gray-50 border border-gray-200 px-3.5 py-1.5 rounded-xl"
          >
            ← Back
          </Link>
        </div>

        <h1 className="text-2xl font-bold mb-6 text-center text-gray-900">
          Sign In
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-xl transition cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Sign In'}
          </button>

        </form>

        <p className="text-gray-600 text-sm text-center mt-6">
          Don't have an account?{' '}
          <Link
            href="/register"
            className="text-emerald-600 hover:text-emerald-700 hover:underline"
          >
            Register
          </Link>
        </p>

      </div>
    </div>
  );
}
