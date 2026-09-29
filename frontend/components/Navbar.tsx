'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token =
      localStorage.getItem('access_token') ||
      localStorage.getItem('token');

    setIsAuthenticated(!!token);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    setIsAuthenticated(false);
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">

      {/* მარცხენა მხარე: ცარიელია (Rentify ამოღებულია) */}
      <div className="flex items-center"></div>

      {/* შუა ნაწილი: დიდი მწვანე RENTIFY APARTMENT */}
      <div className="flex items-center">
        <Link
          href="/"
          className="text-emerald-600 font-black tracking-widest text-4xl md:text-6xl uppercase hover:opacity-90 transition drop-shadow-sm"
        >
          KOMFORT APARTMENT
        </Link>
      </div>

      {/* მარჯვენა მხარე: მხოლოდ Add Listing და Sign Out (Sign In / Register ამოღებულია) */}
      <div className="flex gap-4 items-center">
        {isAuthenticated ? (
          <>
            <Link
              href="/"
              className="bg-emerald-600 text-white px-4 py-2 rounded-xl hover:bg-emerald-500 text-sm font-medium transition"
            >
              Home
            </Link>  


            <Link
              href="/listings/create"
              className="text-gray-700 hover:text-emerald-600 text-sm font-medium transition"
            >
              Add Listing
            </Link>

            <button
              onClick={handleLogout}
              className="bg-red-50 border border-red-200 px-3.5 py-1.5 rounded-xl hover:bg-red-100 text-red-700 text-sm font-medium transition cursor-pointer"
            >
              Sign Out
            </button>
          </>
        ) : null}
      </div>

    </header>
  );
}
