"use client";

import { useAuthStore } from "@/store/authStore";
import { auth } from "@/lib/firebaseClient";
import { signOut } from "firebase/auth";
import { LogOut, Home, CheckSquare, Calendar, PieChart, Settings, WifiOff, RefreshCw, Clock, Tags, Target, Layers, Plus, Sparkles } from "lucide-react";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import Link from "next/link";
import { usePathname } from "next/navigation";
import dynamic from 'next/dynamic';

const QuickAdd = dynamic(() => import('@/components/dashboard/QuickAdd').then(mod => mod.QuickAdd), { ssr: false });
import { subscribeToPush } from "@/lib/pushSubscription";
import { useEffect, useState } from "react";
import { Menu, X, User as UserIcon } from "lucide-react";
import { useDesignStore } from "@/store/designStore";
import { useUIStore } from "@/store/uiStore";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, clearUser } = useAuthStore();
  const pathname = usePathname();
  const { isOnline, isSyncing } = useOfflineSync();
  const { designMode } = useDesignStore();
  const { setQuickAddOpen } = useUIStore();

  const handleSignOut = async () => {
    await signOut(auth);
    clearUser();
  };

  useEffect(() => {
    if (user && isOnline) {
      subscribeToPush().catch(console.error);
    }
  }, [user, isOnline]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when pathname changes
  useEffect(() => {
    setIsMobileMenuOpen((open) => (open ? false : open));
  }, [pathname]);

  const coreNavItems = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Tasks", href: "/tasks", icon: CheckSquare },
    { name: "Habits", href: "/habits", icon: Calendar },
  ];

  const moreNavItems = [
    { name: "Focus", href: "/focus", icon: Target },
    { name: "Templates", href: "/templates", icon: Layers },
    { name: "Categories", href: "/categories", icon: Tags },
    { name: "Analytics", href: "/analytics", icon: PieChart },
  ];

  const allNavItems = [...coreNavItems, ...moreNavItems];

  return (
    <div data-design={designMode} className="min-h-screen bg-gray-50 dark:bg-gray-950 glass:bg-gradient-to-br glass:from-indigo-50 glass:via-white glass:to-purple-50 dark:glass:bg-none flex flex-col md:flex-row transition-colors">
      {/* Sidebar for Desktop / Bottom Nav for Mobile */}
      <aside className="w-full md:w-64 bg-white dark:bg-gray-900 glass:bg-white/40 dark:glass:bg-gray-900/30 glass:backdrop-blur-2xl border-t md:border-t-0 md:border-r border-gray-200 dark:border-gray-800 glass:border-white/20 dark:glass:border-white/10 flex flex-col justify-between fixed bottom-0 md:relative z-20 md:h-screen shadow-[0_-8px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_-8px_30px_rgba(0,0,0,0.2)] md:shadow-none transition-colors">
        <div className="p-4 hidden md:flex items-center justify-between">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white tracking-tight">HabitToDo</h1>
        </div>
        
        <nav className="flex-1 flex md:flex-col justify-around md:justify-start px-2 py-2 md:py-4 md:gap-2">
          {/* Desktop: Show all items */}
          <div className="hidden md:flex flex-col gap-2 w-full">
            {allNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex flex-col md:flex-row items-center gap-1 md:gap-3 px-3 py-1.5 md:py-2.5 rounded-lg text-sm font-medium transition-all active:scale-95 ${
                    isActive 
                      ? "text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]" 
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <Icon className="w-6 h-6 md:w-5 md:h-5" />
                  <span className="text-[10px] md:text-sm">{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile: Center FAB Layout */}
          <div className="flex md:hidden w-full justify-around items-center relative">
            {/* Left Items */}
            <div className="flex w-[40%] justify-around">
              {coreNavItems.slice(0, 2).map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl text-sm font-medium transition-all active:scale-95 ${
                      isActive 
                        ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]" 
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-[10px]">{item.name}</span>
                  </Link>
                );
              })}
            </div>
            
            {/* Center FAB */}
            {pathname !== '/settings' && (
              <div className="relative -top-5 flex justify-center w-[20%]">
                <button
                  onClick={() => setQuickAddOpen(true)}
                  disabled={!isOnline}
                  className={`p-4 rounded-full shadow-2xl transition-all flex items-center justify-center border-2 border-white/20 ${
                    isOnline 
                      ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white hover:scale-110 active:scale-95 shadow-indigo-500/30' 
                      : 'bg-gray-400 text-white cursor-not-allowed opacity-75'
                  }`}
                >
                  <Sparkles className="w-7 h-7 fill-white/20" />
                </button>
              </div>
            )}
            {/* If Settings, just put a spacer */}
            {pathname === '/settings' && <div className="w-[20%]" />}

            {/* Right Items */}
            <div className="flex w-[40%] justify-around">
              {coreNavItems.slice(2, 3).map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl text-sm font-medium transition-all active:scale-95 ${
                      isActive 
                        ? "text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/20 shadow-[0_0_15px_rgba(99,102,241,0.2)]" 
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                    <span className="text-[10px]">{item.name}</span>
                  </Link>
                );
              })}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 transition-all active:scale-95"
              >
                <Menu className="w-6 h-6" />
                <span className="text-[10px]">Menu</span>
              </button>
            </div>
          </div>
        </nav>

        {/* User Profile - Desktop Only */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-800 hidden md:flex flex-col gap-4">
          <Link 
            href="/settings"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === "/settings" 
                ? "text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/30" 
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </Link>

          <div className="flex items-center justify-between px-3">
            <div className="flex flex-col">
               <span className="text-sm font-medium text-gray-900 dark:text-white truncate w-32">{user?.displayName || "User"}</span>
               <span className="text-xs text-gray-500 dark:text-gray-400 truncate w-32">{user?.email}</span>
            </div>
            <button
              onClick={handleSignOut}
              className="p-1.5 text-gray-400 hover:text-red-600 rounded-md transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile "More" Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Drawer Content */}
          <div className="absolute right-0 top-0 bottom-16 w-64 bg-white dark:bg-gray-900 glass:bg-white/70 dark:glass:bg-gray-900/70 glass:backdrop-blur-2xl border-l border-gray-200 dark:border-gray-800 glass:border-white/20 dark:glass:border-gray-700/30 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 glass:border-white/20 dark:glass:border-gray-700/30 flex justify-between items-center">
              <span className="font-semibold text-gray-900 dark:text-white">Menu</span>
              <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
              {moreNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                      isActive 
                        ? "text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/30" 
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                );
              })}
              
              <div className="my-2 border-t border-gray-100 dark:border-gray-800" />
              
              <Link 
                href="/settings"
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  pathname === "/settings" 
                    ? "text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-900/30" 
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                }`}
              >
                <Settings className="w-5 h-5" />
                Settings
              </Link>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex items-center gap-3 mb-4 px-2">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center font-bold">
                  {user?.displayName ? user.displayName.charAt(0).toUpperCase() : <UserIcon className="w-5 h-5" />}
                </div>
                <div className="flex flex-col min-w-0">
                   <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{user?.displayName || "User"}</span>
                   <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</span>
                </div>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-red-600 font-medium bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-xl transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 pb-20 md:pb-0 h-screen overflow-y-auto overflow-x-hidden relative w-full">
        {!isOnline && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center justify-center gap-2 text-amber-700 text-sm font-medium z-50 sticky top-0">
            <WifiOff className="w-4 h-4" />
            <span>You're offline. Some features are unavailable.</span>
          </div>
        )}
        {isOnline && isSyncing && (
          <div className="bg-indigo-50 border-b border-indigo-200 px-4 py-2 flex items-center justify-center gap-2 text-indigo-700 text-sm font-medium z-50 sticky top-0">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Syncing offline changes...</span>
          </div>
        )}
        <div className="max-w-5xl mx-auto w-full relative h-full">
           {children}
        </div>
        <QuickAdd />
      </main>
    </div>
  );
}
