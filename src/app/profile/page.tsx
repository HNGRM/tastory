'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { PlusSquare, Heart, Layers, Lock, Loader2 } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';
import { PostCard } from '@/components/PostCard';
import type { PostData } from '@/types/archive';

export default function ProfilePage() {
  const { user, loading: authLoading, openSignInModal } = useAuth();
  const [tab, setTab] = useState<'mine' | 'liked'>('mine');
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const query =
      tab === 'mine'
        ? `/api/posts?userId=${encodeURIComponent(user.id)}`
        : `/api/posts?likedByMe=true`;

    fetch(query, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : { posts: [] }))
      .then((data) => {
        if (!cancelled) setPosts(data.posts || []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, tab]);

  if (authLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-zinc-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-amber-400" />
        Loading Profile...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-4 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-400">
          <Lock className="h-7 w-7" />
        </div>
        <h1 className="text-xl font-extrabold text-zinc-100">
          Start as Guest to view your stories
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Manage your published 5-year taste stories and revisit stories you
          liked across the feed.
        </p>
        <button
          type="button"
          onClick={() => openSignInModal('/profile')}
          className="mt-6 rounded-xl bg-amber-400 px-6 py-3 text-sm font-extrabold text-[#f7f9f2] transition hover:bg-amber-500"
        >
          Start as Guest
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      {/* User Banner */}
      <section className="mb-6 flex flex-col justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-900/65 p-5 shadow-sm sm:flex-row sm:items-center sm:p-6">
        <div className="flex items-center gap-4">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt={user.name}
              className="h-14 w-14 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-xl font-extrabold text-[#f7f9f2]">
              {user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-xl font-extrabold text-zinc-100">{user.name}</h1>
            <p className="text-xs text-zinc-400">
              {user.email} ·{' '}
              <button
                type="button"
                onClick={() => openSignInModal('/profile')}
                className="font-semibold text-amber-300 hover:underline"
              >
                Edit Name
              </button>
            </p>
          </div>
        </div>

        <Link
          href="/archive"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-extrabold text-[#f7f9f2] transition hover:bg-amber-500 sm:text-sm"
        >
          <PlusSquare className="h-4 w-4" />
          New Story
        </Link>
      </section>

      {/* Tabs */}
      <div className="mb-6 flex gap-2">
        <button
          type="button"
          onClick={() => {
            if (tab !== 'mine') {
              setLoading(true);
              setTab('mine');
            }
          }}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition sm:text-sm ${
            tab === 'mine'
              ? 'bg-amber-400 text-[#f7f9f2] shadow-sm'
              : 'border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-100'
          }`}
        >
          <Layers className="h-4 w-4" />
          My Published Stories
        </button>
        <button
          type="button"
          onClick={() => {
            if (tab !== 'liked') {
              setLoading(true);
              setTab('liked');
            }
          }}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition sm:text-sm ${
            tab === 'liked'
              ? 'bg-amber-400 text-[#f7f9f2] shadow-sm'
              : 'border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-100'
          }`}
        >
          <Heart className="h-4 w-4" />
          Liked Stories
        </button>
      </div>

      {/* Posts */}
      {loading ? (
        <div className="flex h-48 items-center justify-center text-zinc-400">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-amber-400" />
          Loading posts...
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 py-16 text-center text-zinc-400">
          <p className="text-sm">
            {tab === 'mine'
              ? "You haven't published any 5-year taste stories yet."
              : "You haven't liked any stories yet."}
          </p>
          {tab === 'mine' && (
            <Link
              href="/archive"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-[#f7f9f2]"
            >
              <PlusSquare className="h-4 w-4" />
              Create Your First Story
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onDeleted={(deletedId) =>
                setPosts((prev) => prev.filter((p) => p.id !== deletedId))
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
