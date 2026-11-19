'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import { X, User as UserIcon, Check, Sparkles } from 'lucide-react';
import type { UserProfile } from '@/types/archive';
import { ModalBackdrop } from '@/components/ModalBackdrop';

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  openSignInModal: (nextPath?: string) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  refreshUser: async () => {},
  openSignInModal: () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [nextPath, setNextPath] = useState<string | null>(null);
  const [guestName, setGuestName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user || null);
      }
    } catch (err) {
      console.error('Failed to load session:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/auth/me', { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data) return;
        setUser(data.user || null);
      })
      .catch((err) => {
        console.error('Failed to load session:', err);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const openSignInModal = useCallback((targetPath?: string) => {
    setNextPath(targetPath || null);
    setGuestName(user?.name || '');
    setModalOpen(true);
  }, [user]);

  const signOut = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  }, []);

  const handleStartGuest = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: guestName.trim() || undefined }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setModalOpen(false);
        if (nextPath) {
          router.push(nextPath);
          setNextPath(null);
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        refreshUser,
        openSignInModal,
        signOut,
      }}
    >
      {children}

      {modalOpen && (
        <ModalBackdrop
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClose={() => setModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-zinc-100 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  Guest Access
                </div>
                <h2 className="mt-2.5 text-xl font-extrabold tracking-tight text-zinc-100">
                  {user ? 'Edit Guest Profile' : 'Start as Guest'}
                </h2>
                <p className="mt-1 text-xs text-zinc-400">
                  {user
                    ? 'Update your display name for posts and comments.'
                    : 'Enter your name or continue directly as Guest Curator.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleStartGuest} className="mt-5 space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-zinc-300">
                  Your Display Name
                </label>
                <div className="relative">
                  <UserIcon className="absolute top-2.5 left-3 h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    maxLength={32}
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Guest Curator (or type your name)"
                    className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-2.5 pr-3 pl-9 text-xs text-zinc-100 placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-zinc-800 px-4 py-2.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-1.5 rounded-xl bg-amber-400 px-5 py-2.5 text-xs font-bold text-[#f7f9f2] transition hover:bg-amber-500 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  {submitting
                    ? 'Saving...'
                    : user
                      ? 'Save Name'
                      : 'Continue as Guest'}
                </button>
              </div>
            </form>
          </div>
        </ModalBackdrop>
      )}
    </AuthContext.Provider>
  );
}
