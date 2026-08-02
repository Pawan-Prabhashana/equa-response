"use client";

import { 
  LayoutDashboard, 
  Radio, 
  Truck, 
  Home,
  Layers,
  Plane,
  Settings,
  Target,
  MessageSquare,
  Package,
  BookOpen
} from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
}

const navItems: NavItem[] = [
  {
    id: "dashboard",
    label: "God-View",
    icon: <LayoutDashboard size={20} />,
    href: "/",
  },
  {
    id: "mission-control",
    label: "Mission Control",
    icon: <Target size={20} />,
    href: "/mission-control",
  },
  {
    id: "truth-engine",
    label: "Truth Engine",
    icon: <Radio size={20} />,
    href: "/truth-engine",
  },
  {
    id: "comms",
    label: "Comms Console",
    icon: <MessageSquare size={20} />,
    href: "/comms",
  },
  {
    id: "logistics",
    label: "Logistics Control",
    icon: <Truck size={20} />,
    href: "/logistics",
  },
  {
    id: "assets",
    label: "Assets & Readiness",
    icon: <Package size={20} />,
    href: "/assets",
  },
  {
    id: "shelters",
    label: "SHELTR-SAT",
    icon: <Home size={20} />,
    href: "/shelters",
  },
  {
    id: "digital-twin",
    label: "Digital Twin",
    icon: <Layers size={20} />,
    href: "/digital-twin",
  },
  {
    id: "playbook-studio",
    label: "Playbook Studio",
    icon: <BookOpen size={20} />,
    href: "/playbook-studio",
  },
  {
    id: "travel-guard",
    label: "Travel Guard",
    icon: <Plane size={20} />,
    href: "/travel-guard",
  },
  {
    id: "settings",
    label: "Settings",
    icon: <Settings size={20} />,
    href: "/settings",
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="h-screen w-64 glass-panel border-r border-primary flex flex-col">
      {/* Logo Section - Fixed */}
      <div className="flex h-20 items-center justify-center border-b border-primary px-6 shrink-0">
        <h1 className="text-xl font-bold tracking-widest text-accent uppercase">
          EQUA-RESPONSE
        </h1>
      </div>

      {/* Navigation - Scrollable */}
      <nav className="flex-1 min-h-0 overflow-y-auto overscroll-contain flex flex-col gap-1 p-4 scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`
                group relative flex items-center gap-3 rounded-lg px-4 py-3
                transition-all duration-200
                ${
                  isActive
                    ? "bg-cyan-500/10 text-accent"
                    : "text-muted hover:bg-[var(--panel)] hover:text-primary"
                }
              `}
            >
              {/* Neon Border (Active State) */}
              {isActive && (
                <div className="absolute left-0 top-0 h-full w-1 rounded-r-full bg-[var(--accent)] neon-glow" />
              )}

              {/* Icon */}
              <span className={`${isActive ? "text-accent" : "text-muted group-hover:text-primary"}`}>
                {item.icon}
              </span>

              {/* Label */}
              <span className="text-sm font-medium tracking-wide">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Footer Status - Fixed */}
      <div className="border-t border-primary p-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          <span className="text-xs font-mono-data text-emerald-400">
            SYSTEM OPERATIONAL
          </span>
        </div>
        <div className="mt-2 text-xs font-mono-data text-muted">
          v1.0.0-ALPHA
        </div>
      </div>
    </aside>
  );
}
