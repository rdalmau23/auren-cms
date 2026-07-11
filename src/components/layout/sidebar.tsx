"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  UserCog,
  Calendar,
  Pill,
  ClipboardList,
  MessageCircle,
  Settings,
  LogOut,
  Activity,
  Menu,
  X,
  Building2,
} from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { signOut, useSession } from "next-auth/react";

const navigation = [
  { translationKey: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { translationKey: "alerts", href: "/dashboard/alerts", icon: Activity },
  { translationKey: "patients", href: "/dashboard/patients", icon: Users },
  { translationKey: "professionals", href: "/dashboard/professionals", icon: UserCog },
  { translationKey: "centers", href: "/dashboard/centers", icon: Building2 },
  { translationKey: "appointments", href: "/dashboard/appointments", icon: Calendar },
  { translationKey: "medications", href: "/dashboard/medications", icon: Pill },
  { translationKey: "surveys", href: "/dashboard/surveys", icon: ClipboardList },
  { translationKey: "chat", href: "/dashboard/chat", icon: MessageCircle },
];

const bottomNav = [
  { translationKey: "settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [collapsed, setCollapsed] = useState(false);
  const tNav = useTranslations("nav");
  const tAuth = useTranslations("auth");

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-gray-200 transition-all duration-300",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-600 text-white font-bold text-lg">
            A
          </div>
          {!collapsed && (
            <span className="text-xl font-semibold text-gray-900 tracking-tight">
              Auren
            </span>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors",
            collapsed ? "ml-auto" : "ml-auto"
          )}
        >
          {collapsed ? <Menu size={18} /> : <X size={18} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          const label = tNav(item.translationKey);
          return (
            <Link
              key={item.translationKey}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-blue-50 text-blue-700 shadow-sm"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
              title={collapsed ? label : undefined}
            >
              <item.icon size={20} className={cn(isActive && "text-blue-600")} />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-gray-200 space-y-1">
        {bottomNav.map((item) => {
          const label = tNav(item.translationKey);
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/");
          return (
            <Link
              key={item.translationKey}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-blue-50 text-blue-700 shadow-sm"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
              title={collapsed ? label : undefined}
            >
              <item.icon size={20} className={cn(isActive && "text-blue-600")} />
              {!collapsed && <span>{label}</span>}
            </Link>
          );
        })}

        <button
          onClick={async () => {
            const idToken = (session as any)?.idToken;
            await signOut({ redirect: false });
            let url = `http://localhost:8180/realms/auren/protocol/openid-connect/logout?client_id=auren-cms&post_logout_redirect_uri=${encodeURIComponent(window.location.origin)}`;
            if (idToken) {
              url += `&id_token_hint=${idToken}`;
            }
            window.location.href = url;
          }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all w-full"
        >
          <LogOut size={20} />
          {!collapsed && <span>{tAuth("logout")}</span>}
        </button>
      </div>
    </aside>
  );
}
