'use client';

import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Heart,
  MessageCircle,
  Repeat2,
  Download,
  MapPin,
  Share2,
  Trash2,
  Edit3,
  Send,
  Loader2,
  Check,
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

interface PostCardProps {
  post: PostData;
  onSelectLocation?: (locationText: string) => void;
  onDeleted?: (postId: string) => void;
}

function itemsToMap(items: PostData['items']): SlotMap {
  const map: SlotMap = {};
  for (const it of items) {
    map[slotKey(it.year, it.slot)] = it;
  }
  return map;
}

function formatRelativeTime(iso: string): string {
  const diffSec = Math.max(
    1,
    Math.floor((Date.now() - new Date(iso).getTime()) / 1000),
  );
  if (diffSec < 60) return `${diffSec}s ago`;
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

export function PostCard({
  post,
  onSelectLocation,
  onDeleted,
}: PostCardProps) {
  const router = useRouter();
  const { user, openSignInModal } = useAuth();
  const commentInputRef = useRef<HTMLInputElement | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);

  const [liked, setLiked] = useState(post.isLikedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const remixCount = post.remixCount;
  const [showAllComments, setShowAllComments] = useState(false);
  const [comments, setComments] = useState<PostCommentData[]>(
    post.comments || [],
  );
  const [commentCount, setCommentCount] = useState(
    post.commentCount || (post.comments ? post.comments.length : 0),
  );
  const [commentInput, setCommentInput] = useState('');
  const [postingComment, setPostingComment] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  const isOwner = user?.id === post.userId;
  const slotMap = itemsToMap(post.items);

  const handleLike = async () => {
    if (!user) {
      openSignInModal();
      return;
    }
    const prevLiked = liked;
    const prevCount = likeCount;
    setLiked(!prevLiked);
    setLikeCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);

    try {
      const res = await fetch(`/api/posts/${post.id}/like`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setLiked(data.liked);
        setLikeCount(data.likeCount);
      } else {
        setLiked(prevLiked);
        setLikeCount(prevCount);
      }
    } catch {
      setLiked(prevLiked);
      setLikeCount(prevCount);
    }
  };

  const handleCommentButtonClick = async () => {
    setShowAllComments(true);
    commentInputRef.current?.focus();
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
        setCommentCount((data.comments || []).length);
      }
    } catch {
      // Keep existing preview comments
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      openSignInModal();
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
        setCommentCount((c) => c + 1);
        setCommentInput('');
        setShowAllComments(true);
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
      setCommentCount((c) => Math.max(0, c - 1));
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
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to generate PNG image.');
    } finally {
      setExporting(false);
    }
  };

  const handleShareLink = async () => {
    const shareUrl = `${window.location.origin}/post/${post.id}`;
    await navigator.clipboard?.writeText(shareUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleDeletePost = async () => {
    if (!confirm('Delete this archive post from the feed?')) return;
    const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' });
    if (res.ok) {
      onDeleted?.(post.id);
    }
  };

  const visibleComments = showAllComments ? comments : comments.slice(-2);

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-zinc-800/90 bg-zinc-900/65 shadow-md">
      {/* Author & Location Header */}
      <div className="flex items-start justify-between gap-3 px-4 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          {post.user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.user.image}
              alt={post.user.name}
              className="h-9 w-9 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-sm font-extrabold text-[#f7f9f2]">
              {post.user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-sm font-bold text-zinc-100">
                {post.user.name}
              </span>
              <span className="text-[11px] text-zinc-500">
                · {formatRelativeTime(post.createdAt)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onSelectLocation?.(post.locationText)}
              className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-amber-400/12 px-2 py-0.5 text-[11px] font-semibold text-amber-300 transition hover:bg-amber-400/20"
              title="Filter feed by this location"
            >
              <MapPin className="h-3 w-3" />
              {post.locationText}
            </button>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {isOwner && (
            <>
              <Link
                href={`/archive?edit=${post.id}`}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                title="Edit post"
              >
                <Edit3 className="h-4 w-4" />
              </Link>
              <button
                type="button"
                onClick={handleDeletePost}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-500/15 hover:text-red-600"
                title="Delete post"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={handleShareLink}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
            title="Copy post link"
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-700" />
            ) : (
              <Share2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Caption */}
      {post.caption && (
        <p className="px-4 pb-3 text-sm leading-relaxed text-zinc-200">
          {post.caption}
        </p>
      )}

      {/* Visual Archive Board */}
      <div className="px-3 sm:px-4">
        <Link href={`/post/${post.id}`} className="block">
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
        </Link>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pt-3 pb-2">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            type="button"
            onClick={handleLike}
            className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition ${
              liked
                ? 'bg-rose-500/15 text-rose-600'
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
            }`}
          >
            <Heart className={`h-4 w-4 ${liked ? 'fill-rose-600' : ''}`} />
            {likeCount}
          </button>

          <button
            type="button"
            onClick={handleCommentButtonClick}
            className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-100"
          >
            <MessageCircle className="h-4 w-4" />
            {commentCount}
          </button>

          <button
            type="button"
            onClick={handleRemix}
            className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-zinc-400 transition hover:bg-zinc-800 hover:text-amber-300"
            title="Remix this archive into your studio"
          >
            <Repeat2 className="h-4 w-4" />
            Remix {remixCount > 0 ? `(${remixCount})` : ''}
          </button>
        </div>

        <button
          type="button"
          disabled={exporting}
          onClick={handleDownload}
          className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-xs font-semibold text-zinc-200 transition hover:bg-zinc-800 disabled:opacity-50"
        >
          {exporting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          PNG
        </button>
      </div>

      {/* Always-Visible Comments Section & Input */}
      <div className="border-t border-zinc-800/70 bg-zinc-950/60 px-4 py-3">
        {commentCount > 2 && !showAllComments && (
          <button
            type="button"
            onClick={handleCommentButtonClick}
            className="mb-2 text-xs font-semibold text-zinc-400 hover:text-zinc-100"
          >
            View all {commentCount} comments
          </button>
        )}

        {visibleComments.length > 0 && (
          <ul className="mb-3 max-h-48 space-y-1.5 overflow-y-auto pr-1">
            {visibleComments.map((c) => (
              <li
                key={c.id}
                className="flex items-start justify-between gap-2 text-xs leading-relaxed"
              >
                <div>
                  <span className="font-bold text-zinc-100">{c.user.name}</span>{' '}
                  <span className="text-zinc-300">{c.content}</span>
                </div>
                {user?.id === c.user.id && (
                  <button
                    type="button"
                    onClick={() => handleDeleteComment(c.id)}
                    className="shrink-0 text-[11px] text-zinc-500 hover:text-red-600"
                  >
                    Delete
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleAddComment} className="flex gap-2">
          <input
            ref={commentInputRef}
            type="text"
            value={commentInput}
            onChange={(e) => setCommentInput(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:border-amber-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={postingComment || !commentInput.trim()}
            className="flex items-center gap-1 rounded-xl bg-amber-400 px-3 py-2 text-xs font-bold text-[#f7f9f2] hover:bg-amber-500 disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </article>
  );
}
