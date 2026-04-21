'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebaseClient';
import { useAuthStore } from '@/store/authStore';
import { usePathname, useRouter } from 'next/navigation';

const publicRoutes = ['/login', '/register'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading, isLoading, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName,
          avatarUrl: firebaseUser.photoURL,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [setUser, setLoading]);

  useEffect(() => {
    if (isLoading) return;

    const isPublicRoute = publicRoutes.includes(pathname);

    if (!user && !isPublicRoute) {
      router.push('/login');
    } else if (user && isPublicRoute) {
      router.push('/dashboard'); // or whatever the main route is
    } else if (user && pathname === '/') {
       router.push('/dashboard');
    }
  }, [user, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        {/* Simple skeleton loader */}
        <div className="w-8 h-8 border-4 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return <>{children}</>;
}
