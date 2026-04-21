'use client';

import { useState } from 'react';
import { auth } from '@/lib/firebaseClient';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup,
  AuthError
} from 'firebase/auth';
import Link from 'next/link';

interface AuthFormProps {
  type: 'login' | 'register';
}

export function AuthForm({ type }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      let userCredential;
      if (type === 'register') {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }
      
      const token = await userCredential.user.getIdToken();
      
      // Always call init endpoint to ensure user exists in Postgres
      // Useful if registration failed midway previously
      const res = await fetch('/api/users/init', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        throw new Error('init_failed');
      }
      
      // onAuthStateChanged in AuthProvider will handle the redirect
    } catch (err) {
      const authError = err as AuthError | Error;
      console.error("Auth Error:", authError);
      
      if (authError.message === 'init_failed') {
        setError('Account setup failed. Please try again.');
        auth.signOut();
      } else if (authError instanceof Error && 'code' in authError) {
         const firebaseErr = authError as AuthError;
         if (firebaseErr.code === 'auth/invalid-credential' || firebaseErr.code === 'auth/wrong-password' || firebaseErr.code === 'auth/user-not-found') {
            setError('Incorrect email or password');
         } else if (firebaseErr.code === 'auth/email-already-in-use') {
            setError('An account with this email already exists. Try logging in.');
         } else if (firebaseErr.code === 'auth/network-request-failed') {
            setError('Could not connect. Please check your internet connection.');
         } else {
            setError(firebaseErr.message || 'An error occurred. Please try again.');
         }
      } else {
         setError(authError.message || 'An error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setError('');
    const provider = new GoogleAuthProvider();

    try {
      const userCredential = await signInWithPopup(auth, provider);
      
      const token = await userCredential.user.getIdToken();
      
      // We can safely call init on every Google login, our backend handles UPSERT safely if implemented correctly, 
      // or we check if it's a new user. The /api/users/init should do an UPSERT or DO NOTHING on conflict.
      const res = await fetch('/api/users/init', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
         throw new Error('init_failed');
      }
      // AuthProvider will handle redirect
    } catch (err) {
       const authError = err as AuthError | Error;
       if (authError.message === 'init_failed') {
        setError('Account setup failed. Please try again.');
        auth.signOut();
      } else if (authError instanceof Error && 'code' in authError) {
         const firebaseErr = authError as AuthError;
         if (firebaseErr.code === 'auth/account-exists-with-different-credential') {
             setError('This email is linked to a password account. Please log in with email.');
         } else if (firebaseErr.code !== 'auth/popup-closed-by-user') {
             setError('An error occurred. Please try again.');
         }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
          {type === 'login' ? 'Welcome back' : 'Create an account'}
        </h1>
        <p className="text-sm text-gray-500 mt-2">
          {type === 'login' ? 'Enter your details to sign in.' : 'Start organizing your life today.'}
        </p>
      </div>

      <button
        onClick={handleGoogleAuth}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 font-medium"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center my-6">
        <div className="flex-1 border-t border-gray-200"></div>
        <span className="px-3 text-sm text-gray-400">or</span>
        <div className="flex-1 border-t border-gray-200"></div>
      </div>

      <form onSubmit={handleEmailAuth} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
            {error}
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
            placeholder="you@example.com"
            required
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent outline-none transition-all"
            placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
            required
            minLength={6}
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gray-900 text-white font-medium px-4 py-2.5 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 mt-2"
        >
          {isLoading ? 'Please wait...' : type === 'login' ? 'Sign In' : 'Create Account'}
        </button>
      </form>

      <div className="mt-6 text-center text-sm text-gray-500">
        {type === 'login' ? (
          <p>
            Don't have an account?{' '}
            <Link href="/register" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Sign up
            </Link>
          </p>
        ) : (
          <p>
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
              Sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
