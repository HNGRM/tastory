'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Compass,
  PlusSquare,
  User as UserIcon,
  LogOut,
  Edit2,
} from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

/**
 * Custom TASTORY brand logo inspired by the "Face Savoring Food / Yummy" (😋) emoji,
 * rendered in a rich dark olive color palette.
 */
function TastorySavorLogo() {
  return (
    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#526827] via-[#3d4f1c] to-[#273310] p-0.5 shadow-md shadow-[#3b4c1b]/25 ring-1 ring-[#2f3e15]/40 transition group-hover:scale-105">
      <svg
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-8 w-8"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="tastoryOliveFace" cx="35%" cy="28%" r="70%">
            <stop offset="0%" stopColor="#657f33" />
            <stop offset="55%" stopColor="#435620" />
            <stop offset="100%" stopColor="#2a3712" />
          </radialGradient>
        </defs>

        {/* Deep Olive Circular Face */}
        <circle
          cx="18"
          cy="18"
          r="15"
          fill="url(#tastoryOliveFace)"
          stroke="#dce7c6"
          strokeOpacity="0.35"
          strokeWidth="1.2"
        />

        {/* Happy Arched Left Eye (^ ) */}
        <path
          d="M10.2 15.2C11.2 12.1 14.8 12.1 15.8 15.2"
          stroke="#f4f8eb"
          strokeWidth="2.4"
          strokeLinecap="round"
        />

        {/* Happy Arched Right Eye ( ^) */}
        <path
          d="M20.2 15.2C21.2 12.1 24.8 12.1 25.8 15.2"
          stroke="#f4f8eb"
          strokeWidth="2.4"
          strokeLinecap="round"
        />

        {/* Savoring Side Tongue (bottom-right of smile, licking lip) */}
        <path
          d="M20.3 23.3L24.8 19.6C27.5 21.5 28.3 25.2 26.0 27.3C23.7 29.3 20.5 27.5 20.3 23.3Z"
          fill="#b8d17a"
          stroke="#25310f"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Tongue Center Crease */}
        <path
          d="M22.6 21.5L25.0 25.0"
          stroke="#25310f"
          strokeWidth="1.3"
          strokeLinecap="round"
        />

        {/* Wide Happy Curved Smile */}
        <path
          d="M9.8 19.6C12.2 26.0 23.8 26.0 26.2 19.6"
          stroke="#f4f8eb"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, openSignInModal, signOut } = useAuth();

  const handleProtectedNav = (e: React.MouseEvent, targetPath: string) => {
    if (!user) {
      e.preventDefault();
      openSignInModal(targetPath);
    }
  };

  const navItems = [
    { href: '/', label: 'Feed', icon: Compass, protected: false },
    { href: '/archive', label: 'Studio', icon: PlusSquare, protected: true },
    { href: '/profile', label: 'Profile', icon: UserIcon, protected: true },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="group flex items-center gap-2.5">
            <TastorySavorLogo />
            <div>
              <span className="block text-sm font-extrabold tracking-wider text-zinc-100 sm:text-base">
                TASTORY
              </span>
              <span className="hidden text-[11px] font-semibold text-amber-300 sm:block">
                Where Taste Meets Story
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={(e) =>
                    item.protected ? handleProtectedNav(e, item.href) : undefined
                  }
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
                    active
                      ? 'bg-amber-400 text-[#f7f9f2] shadow-sm'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Guest Profile & Auth Controls */}
          <div className="flex items-center gap-2">
            {loading ? (
              <div className="h-9 w-28 animate-pulse rounded-xl bg-zinc-800" />
            ) : user ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => openSignInModal()}
                  title="Click to edit display name"
                  className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:border-amber-400/60 hover:text-zinc-100"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[11px] font-bold text-[#f7f9f2]">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="max-w-[110px] truncate">{user.name}</span>
                  <Edit2 className="h-3 w-3 text-zinc-500 hover:text-amber-400" />
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await signOut();
                    if (pathname !== '/') router.push('/');
                  }}
                  title="Sign out"
                  className="rounded-xl border border-zinc-800 bg-zinc-900 p-2 text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => openSignInModal()}
                className="flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-xs font-extrabold text-[#f7f9f2] shadow-sm transition hover:bg-amber-500 sm:text-sm"
              >
                <UserIcon className="h-4 w-4" />
                Start as Guest
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-md md:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            item.href === '/'
              ? pathname === '/'
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={(e) =>
                item.protected ? handleProtectedNav(e, item.href) : undefined
              }
              className={`flex flex-col items-center gap-1 px-4 py-1 text-[11px] font-bold transition ${
                active ? 'text-amber-400' : 'text-zinc-400 hover:text-zinc-100'
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
