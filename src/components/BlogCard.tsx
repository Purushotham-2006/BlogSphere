import React from "react";
import { Blog, User } from "../types";
import { Eye, Heart, MessageSquare, Clock, ArrowUpRight, Bookmark, Share2 } from "lucide-react";

interface BlogCardProps {
  key?: string | number;
  blog: Blog;
  currentUser: User | null;
  onSelect: (blog: Blog) => void;
  onLikeToggle?: (blogId: string, e?: React.MouseEvent) => void | Promise<void>;
  onBookmarkToggle?: (blogId: string, e?: React.MouseEvent) => void | Promise<void>;
}

export default function BlogCard({
  blog,
  currentUser,
  onSelect,
  onLikeToggle,
  onBookmarkToggle,
}: BlogCardProps) {
  const isLiked = currentUser ? blog.likes.includes(currentUser.id) : false;
  const isBookmarked = currentUser ? currentUser.bookmarks.includes(blog.id) : false;

  // Strips markdown headers and code blocks for a clean text summary preview
  const getExcerpt = (text: string) => {
    const clean = text
      .replace(/#+\s+/g, "") // remove headers
      .replace(/```[\s\S]*?```/g, "") // remove code blocks
      .replace(/`([^`]+)`/g, "$1") // remove inline code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // remove links
      .replace(/[*_]/g, ""); // remove bold/italic
    return clean.length > 180 ? clean.substring(0, 180) + "..." : clean;
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getCategoryStyles = (cat: string) => {
    const c = cat.toLowerCase();
    if (c === "ai") return "bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300";
    if (c === "programming" || c === "technology") return "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300";
    if (c === "finance") return "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-300";
    if (c === "travel") return "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300";
    return "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300";
  };

  return (
    <div
      onClick={() => onSelect(blog)}
      className="group relative flex flex-col md:flex-row items-stretch gap-6 border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-5 md:p-6 bg-white dark:bg-neutral-900/90 hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5"
    >
      {/* Blog Image */}
      {blog.coverImage && (
        <div className="w-full md:w-48 lg:w-56 h-44 md:h-auto shrink-0 overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800 relative">
          <img
            src={blog.coverImage}
            alt={blog.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <span className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full ${getCategoryStyles(blog.category)}`}>
            {blog.category}
          </span>
        </div>
      )}

      {/* Blog Details */}
      <div className="flex flex-col flex-1 justify-between min-w-0">
        <div className="space-y-3">
          {/* Author info */}
          <div className="flex items-center space-x-2.5">
            {blog.author?.profileImage ? (
              <img
                src={blog.author.profileImage}
                alt={blog.author.name}
                className="w-7 h-7 rounded-full object-cover ring-1 ring-neutral-200 dark:ring-neutral-800"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-xs font-bold text-neutral-600 dark:text-neutral-300">
                {blog.author?.name?.[0] || "W"}
              </div>
            )}
            <div className="text-xs">
              <span className="font-semibold text-neutral-700 dark:text-neutral-300 hover:underline">
                {blog.author?.name}
              </span>
              <span className="text-neutral-400 dark:text-neutral-500 mx-1.5">•</span>
              <span className="text-neutral-500 dark:text-neutral-400">
                {formatDate(blog.createdAt)}
              </span>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-lg md:text-xl font-bold text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-900 dark:group-hover:text-white line-clamp-2 leading-snug">
            {blog.title}
          </h3>

          {/* Excerpt */}
          <p className="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2 md:line-clamp-3 leading-relaxed">
            {getExcerpt(blog.content)}
          </p>
        </div>

        {/* Footer Metrics */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800/80 text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5">
              <Eye className="w-4 h-4 text-neutral-400" />
              <span>{blog.views}</span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onLikeToggle) onLikeToggle(blog.id, e);
              }}
              className={`flex items-center space-x-1.5 hover:text-red-500 dark:hover:text-red-400 transition-colors group/btn ${isLiked ? "text-red-500 dark:text-red-400 font-medium" : ""}`}
            >
              <Heart className={`w-4 h-4 transition-transform duration-200 active:scale-125 ${isLiked ? "fill-red-500 dark:fill-red-400 text-red-500" : "text-neutral-400 group-hover/btn:text-red-500"}`} />
              <span>{blog.likes.length}</span>
            </button>

            <div className="flex items-center space-x-1.5">
              <MessageSquare className="w-4 h-4 text-neutral-400" />
              <span>{blog.commentsCount}</span>
            </div>

            <div className="hidden sm:flex items-center space-x-1">
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              <span>{blog.readingTime} min read</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Quick Bookmark Toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onBookmarkToggle) onBookmarkToggle(blog.id, e);
              }}
              className={`p-1.5 rounded-lg border border-neutral-200/50 dark:border-neutral-800/60 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 transition-all ${isBookmarked ? "text-amber-500 dark:text-amber-400 bg-amber-500/10 border-amber-500/20" : ""}`}
              title="Read Later"
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? "fill-amber-500 dark:fill-amber-400 text-amber-500" : ""}`} />
            </button>

            <span className="p-1.5 text-neutral-400 dark:text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 font-medium rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800">
              <ArrowUpRight className="w-4 h-4 text-neutral-400" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
