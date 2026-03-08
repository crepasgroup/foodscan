"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "홈", icon: "🏠" },
  { href: "/history", label: "기록", icon: "📋" },
  { href: "/mypage", label: "마이", icon: "👤" },
  { href: "/settings", label: "설정", icon: "⚙️" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="max-w-2xl mx-auto flex">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors
                ${isActive ? "text-orange-500" : "text-gray-400 hover:text-gray-600"}`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className={`text-[10px] font-medium ${isActive ? "text-orange-500" : ""}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
