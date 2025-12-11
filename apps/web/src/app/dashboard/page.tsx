import { currentUser } from '@clerk/nextjs/server';

export default async function DashboardPage() {
  const user = await currentUser();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Welcome Section */}
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900">
            Olá, {user?.firstName || 'Usuário'} 👋
          </h1>
          <p className="mt-2 text-gray-600">
            Bem-vindo ao Filmtech OS. O sistema está funcionando!
          </p>
          <p className="mt-4 text-sm text-gray-500">
            Email: {user?.emailAddresses?.[0]?.emailAddress || 'N/A'}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard title="Agendamentos Hoje" value="0" />
          <StatCard title="OS em Andamento" value="0" />
          <StatCard title="Clientes" value="0" />
        </div>

        {/* Coming Soon */}
        <div className="mt-8 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <p className="text-gray-500">
            🚧 Dashboard em construção - Em breve mais funcionalidades!
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{title}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
