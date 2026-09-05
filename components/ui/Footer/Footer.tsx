import Link from 'next/link';

import Logo from '@/components/icons/Logo';

const productLinks = [
  { href: '/calculator', label: 'Calculator' },
  { href: '/research', label: 'Research workspace' },
  { href: '/ciphers', label: 'Cipher studio' },
  { href: '/astronumeric', label: 'AstroNumeric lab' }
];

export default function Footer() {
  return (
    <footer className="border-t border-white/10 bg-zinc-950">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-12 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Link
            href="/"
            className="inline-flex items-center rounded-lg font-semibold text-white"
          >
            <Logo />
            <span className="ml-3 text-lg tracking-tight">Cipher Forge</span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-6 text-zinc-400">
            A focused workspace for calculating, comparing, and organizing
            gematria research without losing the trail behind a finding.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Workspace
          </p>
          <ul className="mt-4 space-y-3">
            {productLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-zinc-300 transition hover:text-white"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">
            Start here
          </p>
          <ul className="mt-4 space-y-3">
            <li>
              <Link
                href="/signin/signup"
                className="text-sm text-zinc-300 transition hover:text-white"
              >
                Create an account
              </Link>
            </li>
            <li>
              <Link
                href="/#pricing"
                className="text-sm text-zinc-300 transition hover:text-white"
              >
                Compare plans
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-2 border-t border-white/10 px-6 py-6 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
        <span>
          &copy; {new Date().getFullYear()} Cipher Forge. All rights reserved.
        </span>
        <span>Built for curious, evidence-minded researchers.</span>
      </div>
    </footer>
  );
}
