"use client";

import { useState } from "react";
import { Bell, Search, LogOut, User } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { ProfileModal } from "./ProfileModal";

export function Header() {
  const { data: session } = useSession();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const userInitial = session?.user?.name
    ? session.user.name.slice(0, 2).toUpperCase()
    : "U";

  return (
    <>
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

          {/* User Info & Dropdown */}
          <div className="flex items-center gap-4 pl-4 border-l border-gray-200 relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 text-left hover:opacity-80 focus:outline-none transition-opacity cursor-pointer"
            >
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
            </button>

            {dropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10 cursor-default"
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Usuario</p>
                    <p className="text-sm font-semibold text-gray-900 truncate mt-0.5">{session?.user?.name}</p>
                    <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      setProfileOpen(true);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <User size={16} className="text-gray-400" />
                    <span>Mi Perfil</span>
                  </button>
                  <button
                    onClick={async () => {
                      const idToken = (session as any)?.idToken;
                      await signOut({ redirect: false });
                      const kcUrl = process.env.NEXT_PUBLIC_KEYCLOAK_URL || "http://localhost:8180";
                      let url = `${kcUrl}/realms/auren/protocol/openid-connect/logout?client_id=auren-cms&post_logout_redirect_uri=${encodeURIComponent(window.location.origin)}`;
                      if (idToken) {
                        url += `&id_token_hint=${idToken}`;
                      }
                      window.location.href = url;
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-gray-100 mt-1 cursor-pointer transition-colors"
                  >
                    <LogOut size={16} className="text-red-400" />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <ProfileModal
        isOpen={profileOpen}
        onClose={() => setProfileOpen(false)}
      />
    </>
  );
}
