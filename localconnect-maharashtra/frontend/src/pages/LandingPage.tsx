import { Link } from 'react-router-dom';
import { MapPin, Users, ShoppingBag, MessageCircle, Shield, ArrowRight } from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';

export default function LandingPage() {
  const { theme, toggle } = useThemeStore();

  return (
    <div className="min-h-screen">
      <nav className="border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="text-xl font-bold text-brand-700 dark:text-brand-400">🏘️ LocalConnect Maharashtra</span>
          <div className="flex items-center gap-3">
            <button onClick={toggle} className="btn-secondary text-sm py-1.5">
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
            <Link to="/login" className="btn-secondary text-sm py-1.5">Log in</Link>
            <Link to="/register" className="btn-primary text-sm py-1.5">Join your community</Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-50 via-white to-teal-50 dark:from-brand-950 dark:via-[hsl(var(--background))] dark:to-brand-950" />
        <div className="relative max-w-6xl mx-auto px-4 py-24 md:py-32 text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 text-sm font-medium mb-6">
            Maharashtra&apos;s Hyperlocal Network
          </span>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Connect with your<br />
            <span className="text-brand-600">neighbors in Maharashtra</span>
          </h1>
          <p className="text-lg text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto mb-8">
            Join your society, share updates, buy & sell locally, report issues, and discover events —
            all organized by State → City → Area → Society.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn-primary text-base px-8 py-3 gap-2">
              Get Started <ArrowRight className="h-5 w-5" />
            </Link>
            <Link to="/login" className="btn-secondary text-base px-8 py-3">Sign In</Link>
          </div>
          <p className="mt-4 text-sm text-[hsl(var(--muted-foreground))] flex items-center justify-center gap-1">
            <MapPin className="h-4 w-4" /> Pune · Mumbai · Nagpur · Nashik · Aurangabad · Kolhapur · Thane · Solapur
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-20 grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { icon: Users, title: 'Community Feed', desc: 'Posts from your society and nearby areas only' },
          { icon: ShoppingBag, title: 'Marketplace', desc: 'Buy and sell with trusted neighbors' },
          { icon: MessageCircle, title: 'Neighbor Chat', desc: 'Real-time messaging with your community' },
          { icon: Shield, title: 'Safe & Moderated', desc: 'Report issues, verified communities' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="card p-6 space-y-3 hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
              <Icon className="h-6 w-6 text-brand-600" />
            </div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-[hsl(var(--muted-foreground))]">{desc}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-[hsl(var(--border))] py-8 text-center text-sm text-[hsl(var(--muted-foreground))]">
        © 2026 LocalConnect Maharashtra. Built for Maharashtra communities.
      </footer>
    </div>
  );
}
