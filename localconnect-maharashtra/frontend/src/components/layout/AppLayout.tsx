import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  ShoppingBag,
  MessageCircle,
  Bell,
  User,
  Settings,
  Moon,
  Sun,
  Search,
  Map,
  Shield,
  LogOut,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { useThemeStore } from '@/stores/themeStore';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/feed', icon: Home, label: 'Feed' },
  { to: '/map', icon: Map, label: 'Map' },
  { to: '/marketplace', icon: ShoppingBag, label: 'Marketplace' },
  { to: '/messages', icon: MessageCircle, label: 'Messages' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { theme, toggle } = useThemeStore();
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'MODERATOR';

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <header className="sticky top-0 z-40 border-b border-[hsl(var(--border))] bg-[hsl(var(--card))]/80 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link to="/feed" className="flex items-center gap-2 font-bold text-brand-700 dark:text-brand-400">
            <span className="text-xl">🏘️</span>
            <span className="hidden sm:inline">LocalConnect</span>
          </Link>

          <Link
            to="/search"
            className="flex-1 max-w-md hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-[hsl(var(--muted))] text-sm text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--border))] transition-colors"
          >
            <Search className="h-4 w-4" />
            Search your neighborhood...
          </Link>
          <button
            type="button"
            onClick={() => navigate('/search')}
            className="md:hidden p-2 rounded-lg hover:bg-[hsl(var(--muted))]"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2">
            <button onClick={toggle} className="p-2 rounded-lg hover:bg-[hsl(var(--muted))]" aria-label="Toggle theme">
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>
            {isAdmin && (
              <Link to="/admin" className="p-2 rounded-lg hover:bg-[hsl(var(--muted))]" title="Admin">
                <Shield className="h-5 w-5" />
              </Link>
            )}
            <Link to="/profile" className="p-2 rounded-lg hover:bg-[hsl(var(--muted))]">
              <User className="h-5 w-5" />
            </Link>
            <Link to="/settings" className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] hidden sm:block">
              <Settings className="h-5 w-5" />
            </Link>
            <button onClick={logout} className="p-2 rounded-lg hover:bg-[hsl(var(--muted))] text-red-500" title="Logout">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-6">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[hsl(var(--border))] bg-[hsl(var(--card))]/95 backdrop-blur-lg md:hidden">
        <div className="flex justify-around py-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-1 text-xs',
                location.pathname.startsWith(to)
                  ? 'text-brand-600'
                  : 'text-[hsl(var(--muted-foreground))]',
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
