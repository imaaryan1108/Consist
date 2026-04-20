import Link from 'next/link'

export const metadata = {
  title: 'Consist — Consistency is a team sport',
  description: 'Accountability app for small circles. Punch in daily, track your macros, push your crew.',
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-charcoal text-white overflow-x-hidden">
      {/* Background glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-primary/5 blur-[150px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[50%] h-[50%] bg-primary/3 blur-[120px] rounded-full" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-5xl mx-auto">
        <span className="text-2xl font-black tracking-tighter">
          CONSIST<span className="text-primary italic">.</span>
        </span>
        <Link
          href="/login"
          className="px-5 py-2.5 rounded-xl border border-white/10 text-sm font-bold text-slate-300 hover:text-white hover:border-white/20 transition-all"
        >
          Sign In
        </Link>
      </nav>

      {/* Hero */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-20 pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-black uppercase tracking-widest mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Early Access
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-8xl font-black tracking-tighter leading-none mb-6">
          CONSISTENCY<br />
          <span className="text-primary italic">IS A TEAM SPORT.</span>
        </h1>

        <p className="text-xl text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed">
          Small circles. Daily accountability. Real results.{' '}
          <span className="text-white">No excuses, just reps.</span>
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/login"
            className="px-8 py-4 bg-primary text-charcoal font-black text-lg uppercase tracking-wider rounded-2xl shadow-neon hover:shadow-neon-strong hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Get Access →
          </Link>
          <span className="text-slate-500 text-sm font-medium">Free. No credit card.</span>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="relative z-10 border-y border-white/5 py-5">
        <div className="max-w-5xl mx-auto px-6 flex flex-wrap justify-center gap-8 md:gap-16 text-center">
          {[
            { val: '100%', label: 'Free during beta' },
            { val: '< 5', label: 'People per circle' },
            { val: '1', label: 'Daily commitment' },
          ].map(({ val, label }) => (
            <div key={label}>
              <div className="text-2xl font-black text-primary">{val}</div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 py-24">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 text-center mb-3">How it works</p>
        <h2 className="text-4xl font-black tracking-tighter text-center mb-16">Three steps. Zero excuses.</h2>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              step: '01',
              icon: '👥',
              title: 'Form your circle',
              desc: 'Invite 2–5 people you actually know. Teammates, gym partners, roommates. No randos.',
            },
            {
              step: '02',
              icon: '💪',
              title: 'Punch in daily',
              desc: 'One tap to mark your day done. Log your workout. Track your macros. Keep the streak alive.',
            },
            {
              step: '03',
              icon: '👊',
              title: 'Push each other',
              desc: 'Someone slacking? Send a push. Get a push notification. Show up or get called out.',
            },
          ].map(({ step, icon, title, desc }) => (
            <div key={step} className="glass-card rounded-[2rem] p-8 border border-white/5 relative overflow-hidden">
              <div className="absolute top-4 right-6 text-6xl font-black text-white/5 select-none">{step}</div>
              <div className="text-4xl mb-5">{icon}</div>
              <h3 className="text-xl font-black tracking-tight mb-3">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 text-center mb-3">Features</p>
        <h2 className="text-4xl font-black tracking-tighter text-center mb-16">Everything you need to not quit.</h2>

        <div className="grid sm:grid-cols-2 gap-5">
          {[
            {
              icon: '🔥',
              title: 'Streak Tracking',
              desc: 'See your streak grow every day you punch in. Break it and feel it. The number doesn\'t lie.',
              highlight: true,
            },
            {
              icon: '🔔',
              title: 'Push Notifications',
              desc: 'Real-time alerts when someone in your circle moves. Your crew punching in is your best alarm clock.',
              highlight: false,
            },
            {
              icon: '🥗',
              title: 'Macro Tracking',
              desc: 'Log meals in seconds. AI fills in the nutrition data — just type the food name.',
              highlight: false,
            },
            {
              icon: '📊',
              title: 'Weekly Check-ins',
              desc: 'Reflect every Sunday. Weight, energy, what worked. Progress lives in the data.',
              highlight: false,
            },
          ].map(({ icon, title, desc, highlight }) => (
            <div
              key={title}
              className={`rounded-[2rem] p-8 border transition-all ${
                highlight
                  ? 'bg-primary/5 border-primary/20'
                  : 'glass-card border-white/5'
              }`}
            >
              <div className="text-4xl mb-5">{icon}</div>
              <h3 className={`text-xl font-black tracking-tight mb-3 ${highlight ? 'text-primary' : 'text-white'}`}>
                {title}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pb-24">
        <div className="glass-card rounded-[2.5rem] border border-primary/10 p-12 md:p-20 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-primary/3 pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-5xl md:text-6xl font-black tracking-tighter mb-6">
              Ready to stop<br />
              <span className="text-primary italic">making excuses?</span>
            </h2>
            <p className="text-slate-400 mb-10 text-lg max-w-md mx-auto">
              Get your circle together. Start building the habit. The first punch-in is the hardest.
            </p>
            <Link
              href="/login"
              className="inline-block px-10 py-5 bg-primary text-charcoal font-black text-xl uppercase tracking-wider rounded-2xl shadow-neon hover:shadow-neon-strong hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Start for Free →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-8 text-center">
        <p className="text-slate-600 text-sm font-medium">
          CONSIST<span className="text-primary italic">.</span> — Built for the serious ones.
        </p>
      </footer>
    </main>
  )
}
