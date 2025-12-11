import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect('/sign-in');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-lg dark:border-gray-800 dark:bg-gray-900/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600">
              <span className="text-lg font-bold text-white">F</span>
            </div>
            <span className="text-xl font-semibold text-gray-900 dark:text-white">
              Filmtech OS
            </span>
          </div>

          {/* Navigation */}
          <nav className="hidden items-center gap-6 md:flex">
            <NavLink href="/dashboard" label="Dashboard" />
            <NavLink href="/dashboard/orders" label="Ordens de Serviço" />
            <NavLink href="/dashboard/scheduling" label="Agendamentos" />
            <NavLink href="/dashboard/customers" label="Clientes" />
            <NavLink href="/dashboard/services" label="Serviços" />
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: 'h-9 w-9',
                },
              }}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
    >
      {label}
    </a>
  );
}
