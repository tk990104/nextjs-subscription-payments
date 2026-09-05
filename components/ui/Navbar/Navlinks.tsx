'use client';

import Link from 'next/link';
import { SignOut } from '@/utils/auth-helpers/server';
import { handleRequest } from '@/utils/auth-helpers/client';
import Logo from '@/components/icons/Logo';
import { usePathname, useRouter } from 'next/navigation';
import s from './Navbar.module.css';
import type { User } from '@supabase/supabase-js';

interface NavlinksProps {
  user?: User | null;
}

export default function Navlinks({ user }: NavlinksProps) {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { href: '/calculator', label: 'Calculator' },
    { href: '/research', label: 'Research' },
    { href: '/ciphers', label: 'Ciphers' },
    { href: '/astronumeric', label: 'AstroNumeric', optional: true }
  ];

  return (
    <div className="relative flex flex-row justify-between py-4 align-center md:py-6">
      <div className="flex min-w-0 flex-1 items-center">
        <Link href="/" className={s.logo} aria-label="Cipher Forge home">
          <Logo />
          <span className="ml-2 hidden whitespace-nowrap font-semibold tracking-tight text-white sm:inline">
            Cipher Forge
          </span>
        </Link>
        <nav className="ml-3 flex items-center space-x-1 sm:ml-6 sm:space-x-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${s.link} ${
                pathname === item.href ? s.active : ''
              } ${item.optional ? 'hidden lg:inline-flex' : ''}`}
            >
              {item.label}
            </Link>
          ))}
          <Link href="/#pricing" className={`${s.link} hidden md:inline-flex`}>
            Pricing
          </Link>
          {user && (
            <Link
              href="/account"
              className={`${s.link} hidden sm:inline-flex ${
                pathname === '/account' ? s.active : ''
              }`}
            >
              Account
            </Link>
          )}
        </nav>
      </div>
      <div className="flex shrink-0 justify-end pl-2 sm:pl-6">
        {user ? (
          <form onSubmit={(e) => handleRequest(e, SignOut, router)}>
            <input type="hidden" name="pathName" value={pathname} />
            <button type="submit" className={s.link}>
              Sign out
            </button>
          </form>
        ) : (
          <Link href="/signin" className={s.signIn}>
            Sign In
          </Link>
        )}
      </div>
    </div>
  );
}
