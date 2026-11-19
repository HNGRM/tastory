'use client';

import React, { Suspense, use, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Download,
  Heart,
  MapPin,
  Repeat2,
  Send,
  Loader2,
  Trash2,
} from 'lucide-react';
import { ArchiveBoard } from '@/components/ArchiveBoard';
import { useAuth } from '@/components/AuthProvider';
import { exportArchiveToPng } from '@/lib/canvasExport';
import {
  slotKey,
  type PostCommentData,
  type PostData,
  type SlotMap,
} from '@/types/archive';

function PostDetailContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user, openSignInModal } = useAuth();
  const boardRef = useRef<HTMLDivElement | null>(null);

  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [comments, setComments] = useState<PostCommentData[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetch(`/api/posts/${id}`, { cache: 'no-store' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { post?: PostData } | null) => {
        if (data?.post) {
          setPost(data.post);
          setLiked(data.post.isLikedByMe);
          setLikeCount(data.post.likeCount);
          setComments(data.post.comments || []);
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-zinc-400">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-amber-400" />
        Loading post...
      </div>
    );
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-xl font-bold text-zinc-100">Story not found</h1>
        <Link
          href="/"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2 text-xs font-bold text-[#f7f9f2]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Feed
        </Link>
      </div>
    );
  }

  const slotMap: SlotMap = {};
  for (const it of post.items) {
    slotMap[slotKey(it.year, it.slot)] = it;
  }

  const handleLike = async () => {
    if (!user) {
      openSignInModal(`/post/${post.id}`);
      return;
    }
    const res = await fetch(`/api/posts/${post.id}/like`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setLiked(data.liked);
      setLikeCount(data.likeCount);
    }
  };

  const handleRemix = () => {
    if (!user) {
      openSignInModal(`/archive?remix=${post.id}`);
      return;
    }
    router.push(`/archive?remix=${post.id}`);
  };

  const handleDownload = async () => {
    setExporting(true);
    try {
      await exportArchiveToPng({
        title: post.title,
        items: slotMap,
        bgColor: post.bgColor,
        textColor: post.textColor,
        fontStyle: post.fontStyle,
        aspectRatio: post.aspectRatio,
        showLabels: post.showLabels,
        locationText: post.locationText,
        boardElement: boardRef.current,
      });
    } finally {
      setExporting(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openSignInModal(`/post/${post.id}`);
      return;
    }
    if (!commentInput.trim()) return;
    setPostingComment(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentInput.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments((prev) => [...prev, data.comment]);
        setCommentInput('');
      }
    } finally {
      setPostingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    const res = await fetch(
      `/api/posts/${post.id}/comments?commentId=${encodeURIComponent(commentId)}`,
      { method: 'DELETE' },
    );
    if (res.ok) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <Link
        href="/"
        className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-zinc-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Feed
      </Link>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="mx-auto max-w-[440px]">
            <ArchiveBoard
              boardRef={boardRef}
              title={post.title}
              items={slotMap}
              bgColor={post.bgColor}
              textColor={post.textColor}
              fontStyle={post.fontStyle}
              aspectRatio={post.aspectRatio}
              showLabels={post.showLabels}
              locationText={post.locationText}
              compact
            />
          </div>
        </div>

        <div className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/65 p-5 shadow-sm lg:col-span-5">
          <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-sm font-extrabold text-[#f7f9f2]">
              {post.user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-bold text-zinc-100">{post.user.name}</p>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-300">
                <MapPin className="h-3 w-3" />
                {post.locationText}
              </span>
            </div>
          </div>

          {post.caption && (
            <p className="mt-4 text-sm leading-relaxed text-zinc-200">
              {post.caption}
            </p>
          )}

          <div className="mt-5 grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={handleLike}
              className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-bold transition ${
                liked
                  ? 'border-rose-500/40 bg-rose-500/15 text-rose-600'
                  : 'border-zinc-800 bg-zinc-950 text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              <Heart className={`h-4 w-4 ${liked ? 'fill-rose-600' : ''}`} />
              {likeCount}
            </button>
            <button
              type="button"
              onClick={handleRemix}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-xs font-bold text-zinc-200 hover:bg-zinc-800 hover:text-amber-300"
            >
              <Repeat2 className="h-4 w-4" />
              Remix
            </button>
            <button
              type="button"
              disabled={exporting}
              onClick={handleDownload}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-400 px-3 py-2.5 text-xs font-extrabold text-[#f7f9f2] hover:bg-amber-500 disabled:opacity-50"
            >
              {exporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              PNG
            </button>
          </div>

          <div className="mt-6 flex flex-1 flex-col border-t border-zinc-800 pt-4">
            <h2 className="text-xs font-bold tracking-wider text-zinc-400 uppercase">
              Comments ({comments.length})
            </h2>

            <div className="mt-3 flex-1 space-y-3 overflow-y-auto pr-1">
              {comments.length === 0 ? (
                <p className="text-xs text-zinc-500">
                  No comments yet. Share your thoughts!
                </p>
              ) : (
                comments.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-start justify-between gap-2 rounded-xl bg-zinc-950/80 p-3 text-xs"
                  >
                    <div>
                      <span className="font-bold text-zinc-100">{c.user.name}</span>
                      <p className="mt-0.5 text-zinc-300">{c.content}</p>
                    </div>
                    {user?.id === c.user.id && (
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(c.id)}
                        className="text-zinc-500 hover:text-red-600"
                        aria-label="Delete comment"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment} className="mt-4 flex gap-2">
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder={
                  user ? 'Write a comment...' : 'Sign in to comment...'
                }
                className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-xs text-zinc-100 placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={postingComment}
                className="flex items-center gap-1 rounded-xl bg-amber-400 px-3.5 py-2.5 text-xs font-bold text-[#f7f9f2] hover:bg-amber-500 disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70vh] items-center justify-center text-zinc-400">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-amber-400" />
          Loading post...
        </div>
      }
    >
      <PostDetailContent params={params} />
    </Suspense>
  );
}
