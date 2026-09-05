import Link from 'next/link';
import {
  ArrowRight,
  Binary,
  BookOpenText,
  Database,
  Orbit,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles
} from 'lucide-react';

import Pricing from '@/components/ui/Pricing/Pricing';
import { createClient } from '@/utils/supabase/server';
import {
  getProducts,
  getSubscription,
  getUser
} from '@/utils/supabase/queries';

const sampleResults = [
  { cipher: 'English Ordinal', value: 110, accent: 'text-pink-300' },
  { cipher: 'Full Reduction', value: 74, accent: 'text-violet-300' },
  { cipher: 'Reverse Ordinal', value: 187, accent: 'text-sky-300' },
  { cipher: 'Reverse Reduction', value: 52, accent: 'text-emerald-300' }
];

const features = [
  {
    icon: Binary,
    title: 'Parallel calculation',
    description:
      'Compare a phrase across 15 carefully defined ciphers with letter-by-letter breakdowns.'
  },
  {
    icon: Database,
    title: 'Corpus matching',
    description:
      'Surface phrases that share a value, then filter the signal by cipher and relevance.'
  },
  {
    icon: BookOpenText,
    title: 'Research tables',
    description:
      'Turn interesting results into organized studies with notes, tags, sharing, and CSV export.'
  },
  {
    icon: SlidersHorizontal,
    title: 'Custom ciphers',
    description:
      'Build and preview your own letter maps without changing the trusted built-in catalog.'
  },
  {
    icon: Orbit,
    title: 'AstroNumeric context',
    description:
      'Place numeric findings beside planetary positions and saved event charts.'
  },
  {
    icon: ShieldCheck,
    title: 'Private by design',
    description:
      'Your saved history and workspaces are protected by account-scoped database policies.'
  }
];

export default async function HomePage() {
  const supabase = await createClient();
  const [user, products, subscription] = await Promise.all([
    getUser(supabase),
    getProducts(supabase),
    getSubscription(supabase)
  ]);

  return (
    <div className="overflow-hidden bg-zinc-950 text-white">
      <section className="relative isolate border-b border-white/10">
        <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_18%_12%,rgba(236,72,153,0.18),transparent_30%),radial-gradient(circle_at_82%_20%,rgba(139,92,246,0.18),transparent_32%),linear-gradient(to_bottom,#09090b,#09090b)]" />
        <div className="absolute inset-0 -z-10 opacity-30 [background-image:linear-gradient(rgba(255,255,255,.045)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.045)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />

        <div className="mx-auto grid max-w-6xl gap-14 px-6 py-20 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:py-28">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-pink-400/25 bg-pink-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-pink-200">
              <Sparkles className="h-3.5 w-3.5" />
              Research-grade gematria workspace
            </div>
            <h1 className="mt-7 max-w-3xl text-5xl font-semibold tracking-[-0.045em] text-white sm:text-6xl lg:text-7xl">
              Numbers have patterns.
              <span className="block bg-gradient-to-r from-pink-300 via-fuchsia-300 to-violet-300 bg-clip-text text-transparent">
                Forge them into evidence.
              </span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg leading-8 text-zinc-300 sm:text-xl">
              Calculate across multiple ciphers, find matching phrases, build
              research tables, and explore AstroNumeric context in one focused
              workspace.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/calculator"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-zinc-950 transition hover:bg-pink-100"
              >
                Open the calculator
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/signin/signup"
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/10"
              >
                Create a free workspace
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-zinc-400">
              <span>15 built-in ciphers</span>
              <span>Instant local calculations</span>
              <span>Saved research history</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl">
            <div className="absolute -inset-8 -z-10 rounded-[3rem] bg-gradient-to-br from-pink-500/20 to-violet-500/10 blur-3xl" />
            <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-900/85 shadow-2xl shadow-black/50 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                    Live comparison
                  </p>
                  <p className="mt-1 font-medium text-zinc-200">Cipher Forge</p>
                </div>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-xs text-emerald-300">
                  4 ciphers
                </span>
              </div>
              <div className="divide-y divide-white/10">
                {sampleResults.map((result) => (
                  <div
                    key={result.cipher}
                    className="flex items-center justify-between px-5 py-4"
                  >
                    <div>
                      <p className="text-sm font-medium text-zinc-200">
                        {result.cipher}
                      </p>
                      <p className="mt-1 font-mono text-xs tracking-wide text-zinc-500">
                        C · I · P · H · E · R
                      </p>
                    </div>
                    <span
                      className={`font-mono text-3xl font-semibold ${result.accent}`}
                    >
                      {result.value}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/10 bg-black/25 px-5 py-4 text-xs text-zinc-500">
                Every total includes a transparent character breakdown.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-20 sm:py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-pink-300">
            From calculation to conclusion
          </p>
          <h2 className="mt-4 text-3xl font-semibold tracking-tight sm:text-5xl">
            Keep the whole research trail in view.
          </h2>
          <p className="mt-5 text-lg leading-8 text-zinc-400">
            Cipher Forge connects the quick answer to the deeper work that
            follows it—without turning your browser into a wall of tabs.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <article
                key={feature.title}
                className="group rounded-2xl border border-white/10 bg-white/[0.025] p-6 transition hover:-translate-y-0.5 hover:border-pink-300/30 hover:bg-white/[0.045]"
              >
                <div className="inline-flex rounded-xl border border-white/10 bg-zinc-900 p-2.5 text-pink-300">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">
                  {feature.description}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-y border-white/10 bg-zinc-900/35">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 md:grid-cols-3">
          {[
            [
              '01',
              'Calculate',
              'Enter a phrase and compare the ciphers that matter to your question.'
            ],
            [
              '02',
              'Connect',
              'Find shared values in the corpus and capture the relationships worth keeping.'
            ],
            [
              '03',
              'Build',
              'Organize evidence into reusable tables, exports, and shareable studies.'
            ]
          ].map(([number, title, description]) => (
            <div key={number}>
              <span className="font-mono text-sm text-pink-300">{number}</span>
              <h3 className="mt-3 text-2xl font-semibold">{title}</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div id="pricing">
        <Pricing
          user={user}
          products={products ?? []}
          subscription={subscription}
        />
      </div>
    </div>
  );
}
