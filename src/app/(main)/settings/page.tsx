'use client';

import { useAuthStore } from '@/store/authStore';
import { useDesignStore } from '@/store/designStore';
import { LogOut, User, Bell, Clock, Monitor, Moon, Sun, MonitorSmartphone, Sparkles, LayoutTemplate } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebaseClient';
import { signOut } from 'firebase/auth';
import { useSearchParams } from 'next/navigation';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { designMode, setDesignMode } = useDesignStore();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const searchParams = useSearchParams();
  const [googleSyncStatus, setGoogleSyncStatus] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (searchParams.get('google_calendar') === 'success') {
      setGoogleSyncStatus('Google Calendar connected successfully!');
      // Remove query param without reloading
      window.history.replaceState(null, '', '/settings');
    } else if (searchParams.get('error')) {
      setGoogleSyncStatus(`Failed: ${searchParams.get('error')}`);
      window.history.replaceState(null, '', '/settings');
    }
  }, [searchParams]);

  const handleSignOut = () => {
    signOut(auth);
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl mx-auto space-y-8">
      <header>
        <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white tracking-tight">Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account and application preferences.</p>
      </header>

      <div className="bg-white dark:bg-gray-900 glass:bg-white/60 dark:glass:bg-gray-900/60 glass:backdrop-blur-xl border border-gray-200 dark:border-gray-800 glass:border-white/20 dark:glass:border-gray-700/30 rounded-2xl overflow-hidden shadow-sm glass:shadow-xl glass:shadow-indigo-500/5">
        {/* Profile Section */}
        <div className="p-6 sm:p-8 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <User className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            Profile Information
          </h2>
          
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center text-2xl font-bold">
              {user?.displayName ? user.displayName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white text-lg">{user?.displayName || 'User'}</p>
              <p className="text-gray-500 dark:text-gray-400">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="p-6 sm:p-8 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Monitor className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            Preferences
          </h2>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  <Moon className="w-4 h-4 text-gray-400 dark:text-gray-500" /> Appearance
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Select your preferred theme.</p>
              </div>
              {mounted && (
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
                  <button onClick={() => setTheme('light')} className={`p-2 rounded-md ${theme === 'light' ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`} title="Light Mode"><Sun className="w-4 h-4" /></button>
                  <button onClick={() => setTheme('dark')} className={`p-2 rounded-md ${theme === 'dark' ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`} title="Dark Mode"><Moon className="w-4 h-4" /></button>
                  <button onClick={() => setTheme('system')} className={`p-2 rounded-md ${theme === 'system' ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`} title="System Theme"><MonitorSmartphone className="w-4 h-4" /></button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400" /> App Design
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Switch between Classic and Premium Glass theme.</p>
              </div>
              {mounted && (
                <div className="flex bg-gray-100 dark:bg-gray-800 glass:bg-white/40 dark:glass:bg-gray-800/40 p-1 rounded-lg border border-gray-200 dark:border-gray-700 glass:border-white/20 dark:glass:border-gray-700/30">
                  <button onClick={() => setDesignMode('classic')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${designMode === 'classic' ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}>Classic</button>
                  <button onClick={() => setDesignMode('glass')} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${designMode === 'glass' ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-600 dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'}`}>Premium</button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500" /> Timezone
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Your current timezone for reminders and streaks.</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300">
                {Intl.DateTimeFormat().resolvedOptions().timeZone}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-gray-400 dark:text-gray-500" /> Push Notifications
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Receive alerts for habits and tasks.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Integrations Section */}
        <div className="p-6 sm:p-8 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 14H7v-2h10v2zm0-4H7v-2h10v2zm0-4H7V7h10v2z"/>
            </svg>
            Integrations
          </h2>
          
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  Google Calendar
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm">Automatically sync your tasks and reminders to a dedicated Google Calendar.</p>
                {googleSyncStatus && (
                  <p className={`text-sm mt-2 font-medium ${googleSyncStatus.includes('success') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {googleSyncStatus}
                  </p>
                )}
              </div>
              <button 
                onClick={async () => {
                  try {
                    const token = await auth.currentUser?.getIdToken();
                    const res = await fetch('/api/auth/google/login', {
                      headers: { Authorization: `Bearer ${token}` }
                    });
                    const data = await res.json();
                    if (data.url) window.location.href = data.url;
                  } catch (err) {
                    setGoogleSyncStatus('Could not initiate connection');
                  }
                }}
                className="flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium whitespace-nowrap"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Connect Account
              </button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="p-6 sm:p-8 bg-gray-50 dark:bg-[#1a1f2e]">
          <button 
            onClick={handleSignOut}
            className="flex items-center gap-2 text-red-600 font-medium hover:bg-red-50 dark:hover:bg-red-900/30 px-4 py-2 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
