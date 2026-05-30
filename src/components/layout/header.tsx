"use client";

import { Bell, Search, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";

export function Header() {
  const { data: session } = useSession();

  const userInitial = session?.user?.name
    ? session.user.name.slice(0, 2).toUpperCase()
    : "U";

  return (
    <header className="sticky top-0 z-40 flex items-center h-16 px-6 bg-white/80 backdrop-blur-md border-b border-gray-200">
      {/* Search */}
      <div className="flex items-center flex-1 gap-3">
        <div className="relative max-w-md w-full">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Buscar pacientes, profesionales..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User Info & LogOut */}
        <div className="flex items-center gap-4 pl-4 border-l border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
              {userInitial}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-gray-900">
                {session?.user?.name || "Cargando..."}
              </p>
              <p className="text-xs text-gray-500">
                {session?.user?.email || "Profesional de Salud"}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="p-2 rounded-xl hover:bg-red-50 text-red-500 transition-colors hover:text-red-700"
            title="Cerrar sesión"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
