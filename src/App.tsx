import React, { useState, useEffect } from "react";
import { User, Blog, Comment, Notification, Report, PlatformStats } from "./types";
import Navbar from "./components/Navbar";
import BlogCard from "./components/BlogCard";
import { BlogCardSkeleton, ProfileHeaderSkeleton, SidebarSkeleton } from "./components/SkeletonLoader";
import RichTextEditor from "./components/RichTextEditor";
import AIControlPanel from "./components/AIControlPanel";
import { 
  motion, 
  AnimatePresence 
} from "motion/react";
import { 
  Compass, 
  PenTool, 
  Heart, 
  Bookmark, 
  Bell, 
  User as UserIcon, 
  Settings as SettingsIcon, 
  Shield, 
  Search, 
  ChevronRight, 
  AlertTriangle, 
  ArrowLeft, 
  Share2, 
  MessageSquare, 
  Clock, 
  Check, 
  Send, 
  UserPlus, 
  UserMinus, 
  Sparkles,
  BarChart,
  Trash2,
  Users,
  Eye,
  Flag,
  Mail,
  Info,
  Calendar,
  AlertCircle
} from "lucide-react";

export default function App() {
  // Navigation / Routing State
  const [currentPage, setCurrentPage] = useState<string>("home");
  const [currentParams, setCurrentParams] = useState<Record<string, any>>({});
  
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Theme State
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("theme") === "dark";
  });

  // Global Content / Feed State
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [trendingBlogs, setTrendingBlogs] = useState<Blog[]>([]);
  const [categories, setCategories] = useState<string[]>([
    "Technology", "Programming", "AI", "Finance", "Travel", "Health"
  ]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortFilter, setSortFilter] = useState<string>("newest");
  const [loadingBlogs, setLoadingBlogs] = useState<boolean>(true);

  // Active Selected Blog View State
  const [activeBlog, setActiveBlog] = useState<Blog | null>(null);
  const [activeComments, setActiveComments] = useState<Comment[]>([]);
  const [newCommentText, setNewCommentText] = useState<string>("");
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);
  const [loadingActiveBlog, setLoadingActiveBlog] = useState<boolean>(false);
  const [reportModalOpen, setReportModalOpen] = useState<boolean>(false);
  const [reportReason, setReportReason] = useState<string>("Spam");
  const [reportDetails, setReportDetails] = useState<string>("");

  // Editor State
  const [editorTitle, setEditorTitle] = useState<string>("");
  const [editorContent, setEditorContent] = useState<string>("");
  const [editorCategory, setEditorCategory] = useState<string>("Technology");
  const [editorTagsText, setEditorTagsText] = useState<string>("");
  const [editorCoverImage, setEditorCoverImage] = useState<string>("");
  const [editorError, setEditorError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<boolean>(false);
  const [aiSuggestLoading, setAiSuggestLoading] = useState<boolean>(false);

  // Public Profile View State
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [profileBlogs, setProfileBlogs] = useState<Blog[]>([]);
  const [loadingProfile, setLoadingProfile] = useState<boolean>(false);

  // Notifications State
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Bookmarks State
  const [bookmarkedBlogs, setBookmarkedBlogs] = useState<Blog[]>([]);
  const [loadingBookmarks, setLoadingBookmarks] = useState<boolean>(false);

  // Settings Forms State
  const [settingsName, setSettingsName] = useState<string>("");
  const [settingsBio, setSettingsBio] = useState<string>("");
  const [settingsProfileImg, setSettingsProfileImg] = useState<string>("");
  const [settingsCoverImg, setSettingsCoverImg] = useState<string>("");
  const [settingsSaved, setSettingsSaved] = useState<boolean>(false);

  // Admin Control Panel State
  const [adminStats, setAdminStats] = useState<PlatformStats | null>(null);
  const [adminReports, setAdminReports] = useState<Report[]>([]);
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [adminLoading, setAdminLoading] = useState<boolean>(false);

  // Auth Forms State
  const [authEmail, setAuthEmail] = useState<string>("");
  const [authPassword, setAuthPassword] = useState<string>("");
  const [authName, setAuthName] = useState<string>("");
  const [authUsername, setAuthUsername] = useState<string>("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(false);

  // Interactive share notifications
  const [showShareNotification, setShowShareNotification] = useState<boolean>(false);

  // Dynamic feedback notices
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);


  // --- INITIAL LAUNCH CONFIGURATION ---

  useEffect(() => {
    // Auth restore from LocalStorage
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (savedToken && savedUser) {
      setToken(savedToken);
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        // clear corrupted
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
  }, []);

  // Sync dark theme class on document element
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  // Toast feedback timeout helper
  const showToast = (text: string, type: "success" | "error" = "success") => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Central Axios/Fetch api wrapper
  const apiCall = async (url: string, method: string = "GET", body: any = null) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const options: RequestInit = {
      method,
      headers,
    };
    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Something went wrong calling the server");
    }
    return data;
  };

  // Search Debouncer
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);


  // --- API DATA-FETCHING ROUTINES ---

  // Fetch blogs feed
  const fetchBlogsList = async () => {
    setLoadingBlogs(true);
    try {
      let url = `/api/blogs?filter=${sortFilter}`;
      if (selectedCategory && selectedCategory !== "All") {
        url += `&category=${encodeURIComponent(selectedCategory)}`;
      }
      if (selectedTag) {
        url += `&tag=${encodeURIComponent(selectedTag)}`;
      }
      if (debouncedSearch) {
        url += `&search=${encodeURIComponent(debouncedSearch)}`;
      }

      const blogsData = await apiCall(url);
      setBlogs(blogsData);
    } catch (e: any) {
      showToast(e.message, "error");
    } finally {
      setLoadingBlogs(false);
    }
  };

  // Fetch trending posts for sidebar
  const fetchTrendingList = async () => {
    try {
      const trendingData = await apiCall("/api/blogs?filter=trending");
      setTrendingBlogs(trendingData.slice(0, 5));
    } catch (e) {}
  };

  useEffect(() => {
    fetchBlogsList();
  }, [selectedCategory, selectedTag, debouncedSearch, sortFilter]);

  useEffect(() => {
    fetchTrendingList();
  }, []);

  // Fetch notifications if logged in
  useEffect(() => {
    if (token && currentUser) {
      const fetchNotifs = async () => {
        try {
          const res = await apiCall("/api/notifications");
          setNotifications(res);
        } catch (e) {}
      };
      fetchNotifs();
      // Poll notifications every 15 seconds to keep dashboard fresh
      const interval = setInterval(fetchNotifs, 15000);
      return () => clearInterval(interval);
    }
  }, [token, currentUser]);


  // --- CORE CUSTOM ROTATING SYSTEM CONTROLLER ---

  const navigate = async (page: string, params: Record<string, any> = {}) => {
    setCurrentPage(page);
    setCurrentParams(params);
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Page-specific initializers
    if (page === "home") {
      setSelectedTag(null);
      fetchBlogsList();
    } else if (page === "blog" && params.idOrSlug) {
      setLoadingActiveBlog(true);
      try {
        const fullBlog = await apiCall(`/api/blogs/${params.idOrSlug}`);
        setActiveBlog(fullBlog);
        
        // Fetch comment thread list
        const commentsData = await apiCall(`/api/blogs/${fullBlog.id}/comments`);
        setActiveComments(commentsData);
      } catch (err: any) {
        showToast(err.message, "error");
        setCurrentPage("home");
      } finally {
        setLoadingActiveBlog(false);
      }
    } else if (page === "profile" && params.username) {
      setLoadingProfile(true);
      try {
        const profileData = await apiCall(`/api/profile/${params.username}`);
        setProfileUser(profileData.profile);
        setProfileBlogs(profileData.blogs);
      } catch (err: any) {
        showToast(err.message, "error");
        setCurrentPage("home");
      } finally {
        setLoadingProfile(false);
      }
    } else if (page === "bookmarks") {
      setLoadingBookmarks(true);
      try {
        const bookmarked = await apiCall("/api/bookmarks");
        setBookmarkedBlogs(bookmarked);
      } catch (err: any) {
        showToast(err.message, "error");
      } finally {
        setLoadingBookmarks(false);
      }
    } else if (page === "settings" && currentUser) {
      setSettingsName(currentUser.name);
      setSettingsBio(currentUser.bio);
      setSettingsProfileImg(currentUser.profileImage);
      setSettingsCoverImg(currentUser.coverImage);
      setSettingsSaved(false);
    } else if (page === "editor") {
      if (params.blogToEdit) {
        const b = params.blogToEdit as Blog;
        setEditorTitle(b.title);
        setEditorContent(b.content);
        setEditorCategory(b.category);
        setEditorTagsText(b.tags.join(", "));
        setEditorCoverImage(b.coverImage);
      } else {
        // clear editor draft
        setEditorTitle("");
        setEditorContent("");
        setEditorCategory("Technology");
        setEditorTagsText("");
        setEditorCoverImage("");
      }
      setEditorError(null);
    } else if (page === "admin") {
      setAdminLoading(true);
      try {
        const statsRes = await apiCall("/api/admin/stats");
        setAdminStats(statsRes.stats);
        
        const reportsRes = await apiCall("/api/admin/reports");
        setAdminReports(reportsRes);

        const usersRes = await apiCall("/api/admin/users");
        setAdminUsers(usersRes);
      } catch (err: any) {
        showToast(err.message, "error");
        setCurrentPage("home");
      } finally {
        setAdminLoading(false);
      }
    }
  };


  // --- USER ACCOUNT / AUTH FLOW handlers ---

  const handleAuthSubmit = async (e: React.FormEvent, mode: "login" | "register") => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);

    try {
      if (mode === "login") {
        if (!authEmail || !authPassword) {
          throw new Error("Please complete both email and password");
        }
        const res = await apiCall("/api/auth/login", "POST", {
          email: authEmail,
          password: authPassword,
        });

        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(res.user));
        setToken(res.token);
        setCurrentUser(res.user);

        showToast("Welcome back to BlogSphere AI!", "success");
        navigate("home");
      } else {
        if (!authEmail || !authPassword || !authName || !authUsername) {
          throw new Error("Please complete all registration fields");
        }
        const res = await apiCall("/api/auth/register", "POST", {
          name: authName,
          username: authUsername,
          email: authEmail,
          password: authPassword,
        });

        localStorage.setItem("token", res.token);
        localStorage.setItem("user", JSON.stringify(res.user));
        setToken(res.token);
        setCurrentUser(res.user);

        showToast("Account created successfully! Welcome aboard.", "success");
        navigate("home");
      }

      // reset inputs
      setAuthEmail("");
      setAuthPassword("");
      setAuthName("");
      setAuthUsername("");
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setCurrentUser(null);
    showToast("Signed out successfully. See you soon!", "success");
    navigate("home");
  };


  // --- PROFILE UPDATE HANDLER ---

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsName.trim()) return showToast("Name is required", "error");

    try {
      const res = await apiCall("/api/profile/update", "PUT", {
        name: settingsName,
        bio: settingsBio,
        profileImage: settingsProfileImg,
        coverImage: settingsCoverImg,
      });

      localStorage.setItem("user", JSON.stringify(res.user));
      setCurrentUser(res.user);
      setSettingsSaved(true);
      showToast("Profile personalized details saved successfully!", "success");
      navigate("profile", { username: res.user.username });
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };


  // --- BLOG LIKE & BOOKMARK TOGGLES ---

  const toggleBlogLike = async (blogId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentUser) return navigate("login");

    try {
      const res = await apiCall(`/api/blogs/${blogId}/like`, "POST");
      
      // Update local feed states
      const updateList = (list: Blog[]) => 
        list.map(b => b.id === blogId ? { ...b, likes: res.isLiked ? [...b.likes, currentUser.id] : b.likes.filter(id => id !== currentUser.id) } : b);
      
      setBlogs(updateList(blogs));
      setTrendingBlogs(updateList(trendingBlogs));
      setBookmarkedBlogs(updateList(bookmarkedBlogs));
      if (profileBlogs) setProfileBlogs(updateList(profileBlogs));

      if (activeBlog && activeBlog.id === blogId) {
        setActiveBlog({
          ...activeBlog,
          likes: res.isLiked ? [...activeBlog.likes, currentUser.id] : activeBlog.likes.filter(id => id !== currentUser.id),
          isLiked: res.isLiked,
        });
      }

      showToast(res.message);
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const toggleBlogBookmark = async (blogId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!currentUser) return navigate("login");

    try {
      const res = await apiCall(`/api/blogs/${blogId}/bookmark`, "POST");
      
      // Update local user bookmarks
      const updatedBookmarks = res.isBookmarked 
        ? [...currentUser.bookmarks, blogId] 
        : currentUser.bookmarks.filter(id => id !== blogId);

      const updatedUser = { ...currentUser, bookmarks: updatedBookmarks };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);

      if (activeBlog && activeBlog.id === blogId) {
        setActiveBlog({ ...activeBlog, isBookmarked: res.isBookmarked });
      }

      showToast(res.message);
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };


  // --- WRITER STUDIO / BLOG PUBLISHING HANDLERS ---

  const handlePublishBlog = async () => {
    if (!editorTitle.trim() || !editorContent.trim()) {
      return setEditorError("Please specify a title and complete writing content");
    }
    setEditorError(null);
    setPublishing(true);

    const tags = editorTagsText
      .split(",")
      .map(t => t.trim().replace(/#/g, ""))
      .filter(t => t.length > 0);

    try {
      if (currentParams.blogToEdit) {
        // Updating existing post
        const b = currentParams.blogToEdit as Blog;
        await apiCall(`/api/blogs/${b.id}`, "PUT", {
          title: editorTitle,
          content: editorContent,
          category: editorCategory,
          coverImage: editorCoverImage,
          tags,
        });
        showToast("Blog post updated and saved!", "success");
      } else {
        // Creating new post
        await apiCall("/api/blogs", "POST", {
          title: editorTitle,
          content: editorContent,
          category: editorCategory,
          coverImage: editorCoverImage,
          tags,
        });
        showToast("New blog post published successfully to BlogSphere!", "success");
      }
      navigate("home");
    } catch (err: any) {
      setEditorError(err.message);
    } finally {
      setPublishing(false);
    }
  };


  // --- AI TOOLBAR SERVER ACTION PROXIES ---

  const handleAiAutoContinuation = async (content: string, beforeCursor: string): Promise<string> => {
    setAiSuggestLoading(true);
    try {
      const res = await apiCall("/api/ai/suggest", "POST", {
        content,
        cursorContext: beforeCursor,
      });
      return res.suggestion;
    } catch (err: any) {
      showToast(err.message || "Failed to fetch AI continuation", "error");
      return "";
    } finally {
      setAiSuggestLoading(false);
    }
  };


  // --- COMMENTS SUBMIT & LIKE ROUTINES ---

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return navigate("login");
    if (!newCommentText.trim() || !activeBlog) return;

    try {
      const res = await apiCall(`/api/blogs/${activeBlog.id}/comments`, "POST", {
        comment: newCommentText,
        parentCommentId: replyToCommentId,
      });

      // Update comments list
      setActiveComments([res.comment, ...activeComments]);
      setNewCommentText("");
      setReplyToCommentId(null);
      
      // Update count on active post
      setActiveBlog({
        ...activeBlog,
        commentsCount: activeBlog.commentsCount + 1,
      });

      showToast("Comment published successfully!");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleLikeComment = async (commentId: string) => {
    if (!currentUser) return navigate("login");
    if (!activeBlog) return;

    try {
      const res = await apiCall(`/api/blogs/${activeBlog.id}/comments/${commentId}/like`, "POST");
      setActiveComments(
        activeComments.map(c => c.id === commentId ? { ...c, likes: res.likes } : c)
      );
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!currentUser || !activeBlog) return;

    try {
      await apiCall(`/api/blogs/${activeBlog.id}/comments/${commentId}`, "DELETE");
      setActiveComments(activeComments.filter(c => c.id !== commentId && c.parentCommentId !== commentId));
      setActiveBlog({
        ...activeBlog,
        commentsCount: Math.max(0, activeBlog.commentsCount - 1),
      });
      showToast("Comment deleted.");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };


  // --- WRITER FOLLOWER METRIC TOGGLERS ---

  const toggleUserFollow = async (userId: string) => {
    if (!currentUser) return navigate("login");

    try {
      const res = await apiCall(`/api/profile/${userId}/follow`, "POST");
      
      if (profileUser && profileUser.id === userId) {
        setProfileUser({
          ...profileUser,
          followers: res.isFollowing 
            ? [...profileUser.followers, currentUser.id] 
            : profileUser.followers.filter(id => id !== currentUser.id),
          isFollowing: res.isFollowing,
        });
      }

      if (activeBlog && activeBlog.authorId === userId) {
        // Redraw active profile follow indicators
        fetchBlogsList();
      }

      showToast(res.message);
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };


  // --- MODERATION & REPORT MODAL TRIGGERS ---

  const handlePublishReport = async () => {
    if (!activeBlog) return;
    try {
      await apiCall("/api/reports", "POST", {
        blogId: activeBlog.id,
        reason: reportReason,
        details: reportDetails,
      });
      setReportModalOpen(false);
      setReportDetails("");
      showToast("Post reported successfully. Our moderation queue will audit this.", "success");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };


  // --- ADMIN RESOLUTION TRIGGERS ---

  const handleAdminResolveReport = async (reportId: string) => {
    try {
      await apiCall(`/api/admin/reports/${reportId}/resolve`, "POST");
      setAdminReports(adminReports.map(r => r.id === reportId ? { ...r, isResolved: true } : r));
      if (adminStats) {
        setAdminStats({
          ...adminStats,
          activeReports: Math.max(0, adminStats.activeReports - 1),
        });
      }
      showToast("Report resolved.", "success");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleAdminDeletePost = async (blogId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this blog post from the platform?")) return;

    try {
      await apiCall(`/api/blogs/${blogId}`, "DELETE");
      setAdminReports(adminReports.filter(r => r.blogId !== blogId));
      showToast("Blog post deleted from platform.", "success");
      // refresh stats
      const statsRes = await apiCall("/api/admin/stats");
      setAdminStats(statsRes.stats);
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleAdminUserBan = async (userId: string, isBanned: boolean) => {
    try {
      const res = await apiCall(`/api/admin/users/${userId}/role`, "PUT", { isBanned });
      setAdminUsers(adminUsers.map(u => u.id === userId ? { ...u, isBanned: res.user.isBanned } : u));
      showToast(isBanned ? "User account suspended" : "User account unsuspended", "success");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const handleAdminUserRole = async (userId: string, role: "user" | "admin") => {
    try {
      const res = await apiCall(`/api/admin/users/${userId}/role`, "PUT", { role });
      setAdminUsers(adminUsers.map(u => u.id === userId ? { ...u, role: res.user.role } : u));
      showToast(`User role updated to ${role}`, "success");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };


  // --- SHARE DIALOG TRIGGERS ---

  const handleShareClick = (platform: string) => {
    const postUrl = activeBlog ? `${window.location.origin}/blog/${activeBlog.slug}` : window.location.href;
    const title = activeBlog ? activeBlog.title : "Check this out";

    if (platform === "copy") {
      navigator.clipboard.writeText(postUrl);
      showToast("Link copied to clipboard!", "success");
    } else {
      let shareUrl = "";
      if (platform === "twitter") {
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(postUrl)}`;
      } else if (platform === "linkedin") {
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`;
      } else if (platform === "whatsapp") {
        shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(title + " " + postUrl)}`;
      }
      window.open(shareUrl, "_blank");
    }
    setShowShareNotification(false);
  };


  // --- VIEW RENDERING HELPERS ---

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200 flex flex-col font-sans transition-colors duration-300">
      
      {/* Dynamic Toast Alerts */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center space-x-2.5 px-4.5 py-3 rounded-2xl shadow-xl border text-sm font-semibold tracking-wide ${
              toastMessage.type === "success"
                ? "bg-emerald-600 border-emerald-500 text-white shadow-emerald-500/10"
                : "bg-red-600 border-red-500 text-white shadow-red-500/10"
            }`}
          >
            {toastMessage.type === "success" ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Navbar */}
      <Navbar
        currentUser={currentUser}
        notifications={notifications}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onNavigate={navigate}
        onLogout={handleLogout}
        activePage={currentPage}
      />

      {/* Content Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          
          {/* ========================================================= */}
          {/* 1. DISCOVERY TIMELINE / EXPLORE ROUTE                     */}
          {/* ========================================================= */}
          {currentPage === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              {/* Premium Hero greeting card */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-neutral-900 via-neutral-950 to-indigo-950 text-white p-8 sm:p-12 border border-neutral-800 shadow-xl">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent pointer-events-none" />
                <div className="relative z-10 max-w-2xl space-y-4">
                  <span className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-bold rounded-full tracking-wider uppercase">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse text-blue-400" />
                    <span>Next-Gen Co-Writing</span>
                  </span>
                  <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
                    Publish your stories, fueled by advanced AI.
                  </h1>
                  <p className="text-sm sm:text-base text-neutral-400 font-medium leading-relaxed">
                    BlogSphere AI unites beautiful layout storytelling with writing helpers like SEO auditing, paragraph continuation, spelling correction, and reading metrics.
                  </p>
                  <div className="pt-2 flex items-center space-x-3">
                    <button
                      onClick={() => navigate(currentUser ? "editor" : "register")}
                      className="px-5 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/20 active:scale-95 transition-all text-xs sm:text-sm cursor-pointer"
                    >
                      Start Writing Free
                    </button>
                    <button
                      onClick={() => {
                        const target = document.getElementById("posts-section");
                        if (target) target.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="px-5 py-2.5 rounded-xl font-bold bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 transition-all text-xs sm:text-sm cursor-pointer"
                    >
                      Browse Articles
                    </button>
                  </div>
                </div>
              </div>

              {/* Feed Filters + Content Layout */}
              <div id="posts-section" className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
                
                {/* Left Feed Posts Column */}
                <div className="lg:col-span-8 space-y-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-neutral-200/50 dark:border-neutral-800/80 pb-4">
                    <div>
                      <h2 className="text-xl font-extrabold tracking-tight">Recent Articles</h2>
                      <p className="text-xs text-neutral-400 dark:text-neutral-500 font-medium">
                        {selectedCategory !== "All" ? `Category: ${selectedCategory}` : selectedTag ? `Tag: #${selectedTag}` : "Curated articles from around the network"}
                      </p>
                    </div>

                    {/* Filter Sort Menu */}
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      {["newest", "trending", "views", "likes", "oldest"].map(f => (
                        <button
                          key={f}
                          onClick={() => setSortFilter(f)}
                          className={`px-3 py-1.5 rounded-lg font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                            sortFilter === f
                              ? "bg-blue-600 text-white shadow-sm"
                              : "bg-neutral-100 dark:bg-neutral-900 text-neutral-500 hover:bg-neutral-200 dark:hover:bg-neutral-800"
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Blogs Feed */}
                  {loadingBlogs ? (
                    <div className="space-y-4">
                      <BlogCardSkeleton />
                      <BlogCardSkeleton />
                    </div>
                  ) : blogs.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-neutral-900/40 rounded-3xl border border-neutral-200/50 dark:border-neutral-800/60 p-6">
                      <Compass className="w-10 h-10 mx-auto text-neutral-400" />
                      <h3 className="text-base font-bold mt-3 text-neutral-900 dark:text-white">No articles matched</h3>
                      <p className="text-xs text-neutral-500 mt-1">Try resetting your category selections or searching for different topics.</p>
                      <button
                        onClick={() => {
                          setSelectedCategory("All");
                          setSelectedTag(null);
                          setSearchQuery("");
                        }}
                        className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {blogs.map(blog => (
                        <BlogCard
                          key={blog.id}
                          blog={blog}
                          currentUser={currentUser}
                          onSelect={() => navigate("blog", { idOrSlug: blog.slug })}
                          onLikeToggle={toggleBlogLike}
                          onBookmarkToggle={toggleBlogBookmark}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Sidebar Widgets Column */}
                <div className="lg:col-span-4 space-y-6">
                  
                  {/* Custom Search Widget */}
                  <div className="border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-5 bg-white dark:bg-neutral-900/90 shadow-sm space-y-3.5">
                    <h4 className="text-sm font-bold">Search Articles</h4>
                    <div className="relative">
                      <Search className="absolute top-3 left-3 w-4 h-4 text-neutral-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search title, tags, text..."
                        className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-800/60 pl-9 pr-4 py-2 rounded-xl text-sm outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Categories List Widget */}
                  <div className="border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-5 bg-white dark:bg-neutral-900/90 shadow-sm space-y-3">
                    <h4 className="text-sm font-bold">Explore Categories</h4>
                    <div className="flex flex-col space-y-1">
                      <button
                        onClick={() => {
                          setSelectedCategory("All");
                          setSelectedTag(null);
                        }}
                        className={`text-left text-sm px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-between font-semibold ${
                          selectedCategory === "All" && !selectedTag
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                        }`}
                      >
                        <span>All Categories</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                      {categories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => {
                            setSelectedCategory(cat);
                            setSelectedTag(null);
                          }}
                          className={`text-left text-sm px-3 py-2 rounded-xl transition-all cursor-pointer flex items-center justify-between font-semibold ${
                            selectedCategory === cat && !selectedTag
                              ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                              : "text-neutral-500 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                          }`}
                        >
                          <span>{cat}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Trending Posts Sidebar */}
                  <div className="border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-5 bg-white dark:bg-neutral-900/90 shadow-sm space-y-4">
                    <h4 className="text-sm font-bold flex items-center space-x-1.5 text-neutral-900 dark:text-white">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Trending on BlogSphere</span>
                    </h4>
                    <div className="space-y-3.5">
                      {trendingBlogs.length === 0 ? (
                        [1, 2, 3].map(i => <div key={i} className="h-10 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />)
                      ) : (
                        trendingBlogs.map((b, idx) => (
                          <div 
                            key={b.id} 
                            onClick={() => navigate("blog", { idOrSlug: b.slug })}
                            className="flex items-start space-x-3 cursor-pointer group"
                          >
                            <span className="text-2xl font-extrabold text-neutral-200 dark:text-neutral-800 select-none">
                              {String(idx + 1).padStart(2, "0")}
                            </span>
                            <div className="min-w-0">
                              <h5 className="text-xs font-bold text-neutral-800 dark:text-neutral-200 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 leading-tight">
                                {b.title}
                              </h5>
                              <p className="text-[10px] text-neutral-400 mt-1">
                                By {b.author?.name} in <span className="font-semibold">{b.category}</span>
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* static links */}
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-400 justify-center">
                    <button onClick={() => navigate("about")} className="hover:underline">About</button>
                    <button onClick={() => navigate("contact")} className="hover:underline">Contact</button>
                    <span>© 2026 BlogSphere AI</span>
                  </div>

                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* 2. AUTHENTICATION (LOGIN & REGISTER) ROUTES                */}
          {/* ========================================================= */}
          {(currentPage === "login" || currentPage === "register") && (
            <motion.div
              key="auth"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-md mx-auto py-12"
            >
              <div className="border border-neutral-200/80 dark:border-neutral-800/80 rounded-3xl p-6 sm:p-8 bg-white dark:bg-neutral-900 shadow-xl space-y-6">
                
                {/* Header info */}
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/10 mx-auto">
                    <PenTool className="w-5 h-5" />
                  </div>
                  <h2 className="text-2xl font-extrabold tracking-tight mt-3">
                    {currentPage === "login" ? "Welcome back" : "Create your account"}
                  </h2>
                  <p className="text-xs text-neutral-400">
                    {currentPage === "login" 
                      ? "Sign in to unlock AI editors, comments, and dashboard metrics." 
                      : "Join our community of creative writers and developers."}
                  </p>
                </div>

                {authError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 rounded-xl flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{authError}</span>
                  </div>
                )}

                {/* Form fields */}
                <form onSubmit={(e) => handleAuthSubmit(e, currentPage as "login" | "register")} className="space-y-4">
                  {currentPage === "register" && (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Full Name</label>
                        <input
                          type="text"
                          required
                          value={authName}
                          onChange={(e) => setAuthName(e.target.value)}
                          placeholder="Sarah Jenkins"
                          className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-800/60 px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Username</label>
                        <input
                          type="text"
                          required
                          value={authUsername}
                          onChange={(e) => setAuthUsername(e.target.value)}
                          placeholder="sarah_j"
                          className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-800/60 px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Email Address</label>
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-800/60 px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Password</label>
                      {currentPage === "login" && (
                        <button
                          type="button"
                          onClick={() => showToast("Password reset link dispatched via simulated email to your inbox!", "success")}
                          className="text-[10px] text-blue-500 hover:underline font-bold"
                        >
                          Forgot Password?
                        </button>
                      )}
                    </div>
                    <input
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-800/60 px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-center flex items-center justify-center transition-all cursor-pointer shadow-lg shadow-blue-500/10 active:scale-95"
                  >
                    {authLoading ? "Please wait..." : currentPage === "login" ? "Sign In" : "Register & Start Writing"}
                  </button>
                </form>

                {/* Footer Switch */}
                <div className="text-center pt-4 border-t border-neutral-100 dark:border-neutral-900 text-xs text-neutral-400">
                  <span>
                    {currentPage === "login" ? "Don't have an account yet?" : "Already registered?"}
                  </span>
                  <button
                    onClick={() => {
                      setAuthError(null);
                      navigate(currentPage === "login" ? "register" : "login");
                    }}
                    className="ml-1.5 text-blue-500 hover:underline font-bold cursor-pointer"
                  >
                    {currentPage === "login" ? "Sign Up Free" : "Sign In Here"}
                  </button>
                </div>

              </div>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* 3. WRITER STUDIO / EDITOR ROUTE                            */}
          {/* ========================================================= */}
          {currentPage === "editor" && (
            <motion.div
              key="editor"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              {/* Toolbar header */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-200/50 dark:border-neutral-800/80">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => navigate("home")}
                    className="p-2 rounded-xl border border-neutral-200/50 dark:border-neutral-800/60 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <h1 className="text-xl font-extrabold tracking-tight">
                      {currentParams.blogToEdit ? "Edit Blog Post" : "Writer Studio"}
                    </h1>
                    <p className="text-xs text-neutral-400">Compose and publish posts with deep AI assistance</p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigate("home")}
                    className="px-4 py-2 rounded-xl text-xs font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-950 transition-colors cursor-pointer border border-transparent hover:border-neutral-200 dark:hover:border-neutral-800"
                  >
                    Cancel Draft
                  </button>
                  <button
                    onClick={handlePublishBlog}
                    disabled={publishing}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all cursor-pointer shadow-lg shadow-blue-500/10 active:scale-95"
                  >
                    {publishing ? "Publishing..." : currentParams.blogToEdit ? "Save Changes" : "Publish Post"}
                  </button>
                </div>
              </div>

              {editorError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400 rounded-xl flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{editorError}</span>
                </div>
              )}

              {/* Composition Workspace */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Markdown Editor Input Panel */}
                <div className="lg:col-span-8 space-y-4">
                  {/* Title & Cover Input card */}
                  <div className="border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-5 bg-white dark:bg-neutral-900/40 shadow-sm space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Article Title</label>
                      <input
                        type="text"
                        value={editorTitle}
                        onChange={(e) => setEditorTitle(e.target.value)}
                        placeholder="e.g. Master the Future of AI Models"
                        className="w-full bg-transparent border-b border-neutral-200 dark:border-neutral-800 py-2.5 text-lg sm:text-2xl font-extrabold outline-none focus:border-blue-500 tracking-tight"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Category Section</label>
                        <select
                          value={editorCategory}
                          onChange={(e) => setEditorCategory(e.target.value)}
                          className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-800/60 px-3 py-2 rounded-xl text-xs outline-none font-semibold focus:ring-1 focus:ring-blue-500 cursor-pointer"
                        >
                          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Tags (comma separated)</label>
                        <input
                          type="text"
                          value={editorTagsText}
                          onChange={(e) => setEditorTagsText(e.target.value)}
                          placeholder="e.g. React, Coding, AI"
                          className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-800/60 px-3 py-2 rounded-xl text-xs outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="pt-1">
                      <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Cover Image URL (Optional)</label>
                      <input
                        type="url"
                        value={editorCoverImage}
                        onChange={(e) => setEditorCoverImage(e.target.value)}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-800/60 px-3.5 py-2.5 rounded-xl text-xs outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Primary Rich text markdown editor area */}
                  <RichTextEditor
                    value={editorContent}
                    onChange={setEditorContent}
                    onAiSuggest={handleAiAutoContinuation}
                    aiLoading={aiSuggestLoading}
                  />
                </div>

                {/* AI Assistant Sidebar Panel */}
                <div className="lg:col-span-4">
                  <AIControlPanel
                    title={editorTitle}
                    content={editorContent}
                    tags={editorTagsText.split(",").map(t => t.trim()).filter(t => t.length > 0)}
                    token={token || ""}
                    onApplyTitle={setEditorTitle}
                    onApplyTags={(suggested) => setEditorTagsText(suggested.join(", "))}
                    onApplyContent={setEditorContent}
                  />
                </div>

              </div>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* 4. BLOG POST DETAILS VIEW ROUTE                            */}
          {/* ========================================================= */}
          {currentPage === "blog" && activeBlog && (
            <motion.div
              key="blog"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              {/* Left Column: Post Content, Likes, Comments */}
              <div className="lg:col-span-8 space-y-8">
                
                {/* Back button */}
                <button
                  onClick={() => navigate("home")}
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors group"
                >
                  <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
                  <span>Back to Explore</span>
                </button>

                {/* Post Cover image */}
                {activeBlog.coverImage && (
                  <div className="w-full h-56 sm:h-96 rounded-3xl overflow-hidden shadow-sm relative bg-neutral-100 dark:bg-neutral-800">
                    <img
                      src={activeBlog.coverImage}
                      alt={activeBlog.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-4 left-4 bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                      {activeBlog.category}
                    </span>
                  </div>
                )}

                {/* Post Metadata, Title & Author */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 text-xs text-neutral-400">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{activeBlog.readingTime} min read</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Eye className="w-3.5 h-3.5" />
                      <span>{activeBlog.views} views</span>
                    </span>
                    <span>•</span>
                    <span>Published {new Date(activeBlog.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
                  </div>

                  <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white leading-tight">
                    {activeBlog.title}
                  </h1>

                  {/* Tags List */}
                  {activeBlog.tags && activeBlog.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {activeBlog.tags.map((t, idx) => (
                        <span
                          key={idx}
                          onClick={() => {
                            setSelectedTag(t);
                            setSelectedCategory("All");
                            navigate("home");
                          }}
                          className="px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200/30 dark:border-neutral-800/40 text-neutral-600 dark:text-neutral-400 text-xs font-bold cursor-pointer hover:border-blue-500 hover:text-blue-600 transition-colors"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Divider */}
                <div className="h-px bg-neutral-200/60 dark:bg-neutral-800/60" />

                {/* Rendered post article text */}
                <article className="prose dark:prose-invert max-w-none text-neutral-800 dark:text-neutral-200 leading-relaxed font-sans text-sm sm:text-base md:text-lg whitespace-pre-wrap">
                  {/* Simplistic Markdown renderer in article text */}
                  {activeBlog.content}
                </article>

                {/* Divider */}
                <div className="h-px bg-neutral-200/60 dark:bg-neutral-800/60" />

                {/* Quick actions row */}
                <div className="flex items-center justify-between gap-4 py-1 text-sm text-neutral-500 dark:text-neutral-400">
                  <div className="flex items-center space-x-6">
                    <button
                      onClick={() => toggleBlogLike(activeBlog.id)}
                      className={`flex items-center space-x-2.5 hover:text-red-500 dark:hover:text-red-400 font-bold transition-all ${
                        activeBlog.isLiked ? "text-red-500 dark:text-red-400" : ""
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${activeBlog.isLiked ? "fill-red-500 text-red-500" : ""}`} />
                      <span>{activeBlog.likes.length} Likes</span>
                    </button>
                    <button
                      onClick={() => {
                        const target = document.getElementById("comments-section");
                        if (target) target.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="flex items-center space-x-2.5 hover:text-blue-500 transition-colors font-bold"
                    >
                      <MessageSquare className="w-5 h-5" />
                      <span>{activeBlog.commentsCount} Comments</span>
                    </button>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleBlogBookmark(activeBlog.id)}
                      className={`p-2 rounded-xl border border-neutral-200/60 dark:border-neutral-800/60 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors cursor-pointer ${
                        activeBlog.isBookmarked ? "text-amber-500 bg-amber-500/10 border-amber-500/20" : ""
                      }`}
                      title="Bookmark Article"
                    >
                      <Bookmark className={`w-4.5 h-4.5 ${activeBlog.isBookmarked ? "fill-amber-500 text-amber-500" : ""}`} />
                    </button>

                    <div className="relative">
                      <button
                        onClick={() => setShowShareNotification(!showShareNotification)}
                        className="p-2 rounded-xl border border-neutral-200/50 dark:border-neutral-800/60 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
                        title="Share Post"
                      >
                        <Share2 className="w-4.5 h-4.5" />
                      </button>

                      {showShareNotification && (
                        <div className="absolute right-0 mt-2 w-48 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 p-1.5 shadow-xl ring-1 ring-black/5 text-xs space-y-0.5">
                          <button onClick={() => handleShareClick("copy")} className="flex w-full items-center space-x-2 px-3 py-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900 font-semibold">
                            <span>🔗 Copy Link</span>
                          </button>
                          <button onClick={() => handleShareClick("twitter")} className="flex w-full items-center space-x-2 px-3 py-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900 font-semibold">
                            <span>🐦 Share on Twitter</span>
                          </button>
                          <button onClick={() => handleShareClick("linkedin")} className="flex w-full items-center space-x-2 px-3 py-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900 font-semibold">
                            <span>💼 Share on LinkedIn</span>
                          </button>
                          <button onClick={() => handleShareClick("whatsapp")} className="flex w-full items-center space-x-2 px-3 py-2 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900 font-semibold">
                            <span>💬 Share on WhatsApp</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setReportModalOpen(true)}
                      className="p-2 rounded-xl border border-neutral-200/50 dark:border-neutral-800/60 text-neutral-400 hover:text-red-500 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
                      title="Report Article"
                    >
                      <Flag className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>

                {/* ==================== COMMENTS MODULE ==================== */}
                <div id="comments-section" className="space-y-6 pt-6 border-t border-neutral-200/50 dark:border-neutral-800/80">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-extrabold tracking-tight flex items-center space-x-2">
                      <MessageSquare className="w-5 h-5 text-blue-500" />
                      <span>Discussion ({activeComments.length})</span>
                    </h3>
                  </div>

                  {/* Post Comment Input */}
                  <form onSubmit={handlePostComment} className="flex gap-3">
                    <img
                      src={currentUser?.profileImage || "https://api.dicebear.com/7.x/adventurer/svg?seed=guest"}
                      alt="avatar"
                      className="w-9 h-9 rounded-xl object-cover shrink-0 mt-1"
                    />
                    <div className="flex-1 space-y-2">
                      {replyToCommentId && (
                        <div className="flex items-center justify-between bg-neutral-100 dark:bg-neutral-900 px-3 py-1.5 rounded-lg text-xs text-neutral-500">
                          <span>Replying to comment...</span>
                          <button
                            type="button"
                            onClick={() => setReplyToCommentId(null)}
                            className="text-red-500 font-bold hover:underline"
                          >
                            Cancel Reply
                          </button>
                        </div>
                      )}
                      <textarea
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        placeholder={currentUser ? "Participate in discussion..." : "Please log in to participate in the comments discussion."}
                        disabled={!currentUser}
                        rows={3}
                        className="w-full bg-neutral-100/50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-800/60 p-3.5 rounded-2xl text-sm outline-none focus:ring-1 focus:ring-blue-500 placeholder-neutral-400 resize-none disabled:opacity-50"
                      />
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={!currentUser || !newCommentText.trim()}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-colors flex items-center space-x-1.5 shadow-md shadow-blue-500/5 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit Comment</span>
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* List comments */}
                  <div className="space-y-4 pt-4">
                    {activeComments.length === 0 ? (
                      <p className="text-center py-6 text-xs text-neutral-400 font-medium">No comments posted yet. Spark the discussion!</p>
                    ) : (
                      activeComments.map(c => (
                        <div
                          key={c.id}
                          className={`p-4 rounded-2xl border bg-white dark:bg-neutral-900/40 space-y-3 transition-colors ${
                            c.parentCommentId 
                              ? "ml-8 border-neutral-100 dark:border-neutral-900" 
                              : "border-neutral-200/60 dark:border-neutral-800/60"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2.5">
                              <img
                                src={c.user?.profileImage}
                                alt="avatar"
                                referrerPolicy="no-referrer"
                                className="w-7.5 h-7.5 rounded-xl object-cover ring-1 ring-neutral-200 dark:ring-neutral-800"
                              />
                              <div>
                                <span className="text-xs font-bold text-neutral-900 dark:text-white">
                                  {c.user?.name}
                                </span>
                                <span className="text-[10px] text-neutral-400 dark:text-neutral-500 block">
                                  @{c.user?.username} • {new Date(c.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>

                            {/* Comment like or delete action */}
                            <div className="flex items-center space-x-1.5 text-[10px] font-bold">
                              <button
                                onClick={() => handleLikeComment(c.id)}
                                className={`flex items-center space-x-1 px-2 py-1 rounded-md border border-neutral-200/50 dark:border-neutral-800/60 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors ${
                                  currentUser && c.likes.includes(currentUser.id) ? "text-red-500 dark:text-red-400 bg-red-500/10" : "text-neutral-400"
                                }`}
                              >
                                <Heart className={`w-3 h-3 ${currentUser && c.likes.includes(currentUser.id) ? "fill-red-500" : ""}`} />
                                <span>{c.likes.length}</span>
                              </button>

                              {!c.parentCommentId && currentUser && (
                                <button
                                  onClick={() => {
                                    setReplyToCommentId(c.id);
                                    const target = document.getElementById("comments-section");
                                    if (target) target.scrollIntoView({ behavior: "smooth" });
                                  }}
                                  className="px-2 py-1 text-neutral-500 dark:text-neutral-400 hover:text-blue-500 bg-neutral-100 dark:bg-neutral-900 rounded-md"
                                >
                                  Reply
                                </button>
                              )}

                              {currentUser && (c.userId === currentUser.id || activeBlog.authorId === currentUser.id || currentUser.role === "admin") && (
                                <button
                                  onClick={() => handleDeleteComment(c.id)}
                                  className="p-1 text-neutral-400 hover:text-red-500 transition-colors"
                                  title="Delete Comment"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <p className="text-sm text-neutral-700 dark:text-neutral-300 font-sans leading-relaxed whitespace-pre-wrap pl-10">
                            {c.comment}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

              {/* Right Column: Author Bio Card */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Author card details */}
                <div className="border border-neutral-200/60 dark:border-neutral-800/60 rounded-3xl p-6 bg-white dark:bg-neutral-900/95 shadow-sm space-y-4">
                  <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-widest pb-2 border-b border-neutral-100 dark:border-neutral-800">
                    About the Writer
                  </h4>
                  
                  <div className="flex items-center space-x-3.5">
                    <img
                      src={activeBlog.author?.profileImage}
                      alt={activeBlog.author?.name}
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-neutral-200 dark:ring-neutral-800"
                      referrerPolicy="no-referrer"
                    />
                    <div className="min-w-0">
                      <h3 className="font-extrabold text-base text-neutral-900 dark:text-white hover:underline cursor-pointer truncate" onClick={() => navigate("profile", { username: activeBlog.author?.username })}>
                        {activeBlog.author?.name}
                      </h3>
                      <p className="text-xs text-neutral-400">@{activeBlog.author?.username}</p>
                    </div>
                  </div>

                  {activeBlog.author?.bio && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed font-sans">
                      {activeBlog.author.bio}
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-4 pt-2">
                    {/* Follow button */}
                    {currentUser && currentUser.id !== activeBlog.authorId ? (
                      <button
                        onClick={() => toggleUserFollow(activeBlog.authorId)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold text-center flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                          profileUser && profileUser.isFollowing 
                            ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700" 
                            : "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/10"
                        }`}
                      >
                        {profileUser && profileUser.isFollowing ? (
                          <>
                            <UserMinus className="w-3.5 h-3.5" />
                            <span>Unfollow Writer</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-3.5 h-3.5" />
                            <span>Follow Writer</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate("profile", { username: activeBlog.author?.username })}
                        className="flex-1 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 text-xs font-bold text-center hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                      >
                        Visit Profile
                      </button>
                    )}
                  </div>
                </div>

                {/* Simple platform stats banner */}
                <div className="border border-neutral-200/60 dark:border-neutral-800/60 rounded-3xl p-6 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-sm space-y-3 relative overflow-hidden">
                  <div className="absolute inset-0 bg-radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.1),transparent) pointer-events-none" />
                  <h4 className="font-extrabold text-sm flex items-center space-x-1.5">
                    <Sparkles className="w-4 h-4 animate-pulse text-yellow-300" />
                    <span>Enriched with AI Helpers</span>
                  </h4>
                  <p className="text-[11px] text-blue-100 leading-relaxed font-sans">
                    Every article written on BlogSphere is powered by Gemini AI algorithms, performing syntax checks, continuations, SEO improvements, and instant summarizations.
                  </p>
                </div>

              </div>

              {/* REPORTING DIALOG MODAL */}
              {reportModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                  <div className="border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 bg-white dark:bg-neutral-900 max-w-sm w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
                    <div className="flex items-center space-x-2 text-red-500">
                      <Flag className="w-5 h-5" />
                      <h3 className="font-extrabold text-base">Report Blog Post</h3>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Reason for reporting</label>
                        <select
                          value={reportReason}
                          onChange={(e) => setReportReason(e.target.value)}
                          className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 px-3 py-2 rounded-xl text-xs outline-none cursor-pointer"
                        >
                          <option value="Spam">Spam Content / Advertisement</option>
                          <option value="Abuse">Harassment or Abuse</option>
                          <option value="Fake">Fake News or Misinformation</option>
                          <option value="Copyright">Copyright Infringement</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Additional Details</label>
                        <textarea
                          value={reportDetails}
                          onChange={(e) => setReportDetails(e.target.value)}
                          placeholder="Provide context for our moderators..."
                          rows={3}
                          className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 p-3 rounded-xl text-xs outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 text-xs">
                      <button
                        onClick={() => setReportModalOpen(false)}
                        className="flex-1 py-2 border border-neutral-200 dark:border-neutral-800 rounded-xl font-bold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handlePublishReport}
                        className="flex-1 py-2 rounded-xl font-bold text-white bg-red-600 hover:bg-red-500 transition-colors"
                      >
                        Submit Report
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          )}

          {/* ========================================================= */}
          {/* 5. USER WRITER PROFILE VIEW ROUTE                          */}
          {/* ========================================================= */}
          {currentPage === "profile" && profileUser && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              {loadingProfile ? (
                <ProfileHeaderSkeleton />
              ) : (
                <div className="space-y-6">
                  {/* Banner & Bio header card */}
                  <div className="relative border border-neutral-200/60 dark:border-neutral-800/60 rounded-3xl overflow-hidden bg-white dark:bg-neutral-900 shadow-sm">
                    {/* Cover illustration */}
                    <div className="w-full h-48 bg-neutral-100 dark:bg-neutral-800 relative">
                      <img
                        src={profileUser.coverImage}
                        alt="cover"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    
                    {/* User profile details row */}
                    <div className="p-6 pt-0 flex flex-col md:flex-row items-start md:items-end -mt-14 md:space-x-6 gap-4">
                      <img
                        src={profileUser.profileImage}
                        alt={profileUser.name}
                        className="w-24 h-24 rounded-2xl object-cover ring-4 ring-white dark:ring-neutral-900 relative z-10 shrink-0 shadow-md"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center space-x-2.5">
                          <h1 className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white leading-tight truncate">
                            {profileUser.name}
                          </h1>
                          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-md uppercase tracking-wider select-none">
                            {profileUser.role}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400 dark:text-neutral-500">@{profileUser.username}</p>
                      </div>

                      {/* Follow or Edit layout actions */}
                      <div className="shrink-0 pt-2 md:pt-0">
                        {currentUser && currentUser.id === profileUser.id ? (
                          <button
                            onClick={() => navigate("settings")}
                            className="px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs font-bold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors flex items-center space-x-1.5"
                          >
                            <SettingsIcon className="w-3.5 h-3.5" />
                            <span>Edit Profile</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => toggleUserFollow(profileUser.id)}
                            className={`px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-sm active:scale-95 transition-all cursor-pointer ${
                              profileUser.isFollowing
                                ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700"
                                : "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/10"
                            }`}
                          >
                            {profileUser.isFollowing ? "Unfollow" : "Follow Writer"}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="px-6 pb-6 space-y-4">
                      {profileUser.bio && (
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed font-sans max-w-2xl">
                          {profileUser.bio}
                        </p>
                      )}

                      {/* Author social metrics counters */}
                      <div className="flex items-center space-x-6 text-xs text-neutral-500">
                        <span className="flex items-center space-x-1">
                          <Users className="w-4 h-4 text-neutral-400" />
                          <strong className="text-neutral-950 dark:text-white font-extrabold">{profileUser.followers.length}</strong>
                          <span>Followers</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center space-x-1">
                          <Users className="w-4 h-4 text-neutral-400" />
                          <strong className="text-neutral-950 dark:text-white font-extrabold">{profileUser.following.length}</strong>
                          <span>Following</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4 text-neutral-400" />
                          <span>Joined {new Date(profileUser.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Profile Blogs Feed Title */}
                  <div className="space-y-4 pt-4">
                    <h2 className="text-lg font-extrabold tracking-tight">Articles Published</h2>
                    {profileBlogs.length === 0 ? (
                      <div className="text-center py-12 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl p-6">
                        <Compass className="w-8 h-8 mx-auto text-neutral-400 animate-pulse" />
                        <h4 className="text-sm font-bold mt-2">No articles written yet</h4>
                        <p className="text-xs text-neutral-400">Stay tuned for subsequent pieces published by @{profileUser.username}!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {profileBlogs.map(blog => (
                          <BlogCard
                            key={blog.id}
                            blog={blog}
                            currentUser={currentUser}
                            onSelect={() => navigate("blog", { idOrSlug: blog.slug })}
                            onLikeToggle={toggleBlogLike}
                            onBookmarkToggle={toggleBlogBookmark}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* 6. BOOKMARKS (READ LATER) ROUTE                           */}
          {/* ========================================================= */}
          {currentPage === "bookmarks" && (
            <motion.div
              key="bookmarks"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="pb-4 border-b border-neutral-200/50 dark:border-neutral-800/80">
                <h1 className="text-xl font-extrabold tracking-tight">Reading List Bookmarks</h1>
                <p className="text-xs text-neutral-400">Your personal selection of saved posts to read later</p>
              </div>

              {loadingBookmarks ? (
                <div className="space-y-4">
                  <BlogCardSkeleton />
                </div>
              ) : bookmarkedBlogs.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-neutral-900/40 rounded-3xl border border-neutral-200/50 dark:border-neutral-800/60 p-6">
                  <Bookmark className="w-10 h-10 mx-auto text-neutral-400" />
                  <h3 className="text-base font-bold mt-3 text-neutral-900 dark:text-white">Bookmarks is empty</h3>
                  <p className="text-xs text-neutral-500 mt-1">Bookmark posts in discovery timeline to save them here.</p>
                  <button
                    onClick={() => navigate("home")}
                    className="mt-4 px-4 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors cursor-pointer"
                  >
                    Explore Posts
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookmarkedBlogs.map(blog => (
                    <BlogCard
                      key={blog.id}
                      blog={blog}
                      currentUser={currentUser}
                      onSelect={() => navigate("blog", { idOrSlug: blog.slug })}
                      onLikeToggle={toggleBlogLike}
                      onBookmarkToggle={toggleBlogBookmark}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* 7. NOTIFICATIONS PANEL ROUTE                              */}
          {/* ========================================================= */}
          {currentPage === "notifications" && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-2xl mx-auto space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-neutral-200/50 dark:border-neutral-800/80">
                <div>
                  <h1 className="text-xl font-extrabold tracking-tight">Activity Notifications</h1>
                  <p className="text-xs text-neutral-400">Track likes, comments, replies and followers</p>
                </div>
                {notifications.some(n => !n.isRead) && (
                  <button
                    onClick={async () => {
                      try {
                        await apiCall("/api/notifications/read", "POST");
                        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
                        showToast("All notifications marked as read.", "success");
                      } catch (e) {}
                    }}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-3xl p-6">
                    <Bell className="w-8 h-8 mx-auto text-neutral-400" />
                    <h4 className="text-sm font-bold mt-2">All quiet for now</h4>
                    <p className="text-xs text-neutral-400">We'll alert you when other users interact with your writing.</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (n.blogId) {
                          navigate("blog", { idOrSlug: n.blogId });
                        } else if (n.sender?.username) {
                          navigate("profile", { username: n.sender.username });
                        }
                      }}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start space-x-3.5 hover:bg-neutral-50 dark:hover:bg-neutral-900/40 ${
                        n.isRead 
                          ? "bg-white/60 dark:bg-neutral-950/20 border-neutral-150 dark:border-neutral-850" 
                          : "bg-white dark:bg-neutral-900/60 border-blue-500/20 shadow-sm relative overflow-hidden"
                      }`}
                    >
                      {!n.isRead && <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />}
                      <img
                        src={n.sender?.profileImage}
                        alt="avatar"
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-xl object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-neutral-700 dark:text-neutral-300 font-medium leading-relaxed">
                          <strong className="text-neutral-900 dark:text-white font-extrabold">@{n.sender?.username}</strong> {n.message}
                        </p>
                        <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium block mt-1">
                          {new Date(n.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* 8. SETTINGS / PROFILE PERSONALIZATION                      */}
          {/* ========================================================= */}
          {currentPage === "settings" && currentUser && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-xl mx-auto space-y-6"
            >
              <div className="pb-4 border-b border-neutral-200/50 dark:border-neutral-800/80">
                <h1 className="text-xl font-extrabold tracking-tight">Personalize Profile</h1>
                <p className="text-xs text-neutral-400">Customize your public presence on BlogSphere AI</p>
              </div>

              <form onSubmit={handleSaveSettings} className="border border-neutral-200/60 dark:border-neutral-800/60 rounded-3xl p-6 bg-white dark:bg-neutral-900 shadow-sm space-y-5">
                <div>
                  <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Full Writer Name</label>
                  <input
                    type="text"
                    required
                    value={settingsName}
                    onChange={(e) => setSettingsName(e.target.value)}
                    placeholder="Sarah Jenkins"
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-800/60 px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Profile Avatar URL</label>
                  <input
                    type="url"
                    value={settingsProfileImg}
                    onChange={(e) => setSettingsProfileImg(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-800/60 px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Cover Header Image URL</label>
                  <input
                    type="url"
                    value={settingsCoverImg}
                    onChange={(e) => setSettingsCoverImg(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-800/60 px-4 py-2.5 rounded-xl text-sm outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1.5">Biographical Summary</label>
                  <textarea
                    value={settingsBio}
                    onChange={(e) => setSettingsBio(e.target.value)}
                    placeholder="Tell our community about your tech experiences and writing focus..."
                    rows={4}
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200/60 dark:border-neutral-800/60 p-4 rounded-xl text-sm outline-none focus:ring-1 focus:ring-blue-500 resize-none font-sans leading-relaxed"
                  />
                </div>

                <div className="flex gap-2 pt-2 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => navigate("profile", { username: currentUser.username })}
                    className="flex-1 py-2.5 border border-neutral-200 dark:border-neutral-800 rounded-xl text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl text-white bg-blue-600 hover:bg-blue-500 transition-colors cursor-pointer text-center"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* 9. PERSONAL METRICS DASHBOARD ROUTE                        */}
          {/* ========================================================= */}
          {currentPage === "dashboard" && currentUser && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              <div className="pb-4 border-b border-neutral-200/50 dark:border-neutral-800/80">
                <h1 className="text-xl font-extrabold tracking-tight">Personal Dashboard</h1>
                <p className="text-xs text-neutral-400">Track and manage your publication stats and content metrics</p>
              </div>

              {/* Stats Counters Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-5 bg-white dark:bg-neutral-900/90 text-center space-y-1">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Articles</span>
                  <strong className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white block">
                    {blogs.filter(b => b.authorId === currentUser.id).length}
                  </strong>
                </div>
                <div className="border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-5 bg-white dark:bg-neutral-900/90 text-center space-y-1">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Total Views</span>
                  <strong className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white block">
                    {blogs.filter(b => b.authorId === currentUser.id).reduce((acc, b) => acc + b.views, 0)}
                  </strong>
                </div>
                <div className="border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-5 bg-white dark:bg-neutral-900/90 text-center space-y-1">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Followers</span>
                  <strong className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white block">
                    {currentUser.followers.length}
                  </strong>
                </div>
                <div className="border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-5 bg-white dark:bg-neutral-900/90 text-center space-y-1">
                  <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Bookmarks</span>
                  <strong className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white block">
                    {currentUser.bookmarks.length}
                  </strong>
                </div>
              </div>

              {/* Writer posts management list */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-extrabold tracking-tight">My Publications</h3>
                  <button
                    onClick={() => navigate("editor")}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/5 cursor-pointer"
                  >
                    Write New Post
                  </button>
                </div>

                <div className="border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl overflow-hidden bg-white dark:bg-neutral-900 text-sm">
                  {blogs.filter(b => b.authorId === currentUser.id).length === 0 ? (
                    <div className="text-center py-12 p-6">
                      <PenTool className="w-8 h-8 mx-auto text-neutral-400 mb-2" />
                      <h4 className="font-bold">You haven't written any articles yet</h4>
                      <p className="text-xs text-neutral-400 mt-1">Start drafting your first post in the Writer Studio!</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                      {blogs.filter(b => b.authorId === currentUser.id).map(b => (
                        <div key={b.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-neutral-50 dark:hover:bg-neutral-900/20 transition-colors">
                          <div className="min-w-0">
                            <h4 onClick={() => navigate("blog", { idOrSlug: b.slug })} className="font-bold text-neutral-900 dark:text-white hover:underline cursor-pointer truncate">
                              {b.title}
                            </h4>
                            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 block mt-1">
                              Published {new Date(b.createdAt).toLocaleDateString()} in <strong className="font-semibold">{b.category}</strong> • {b.views} views • {b.likes.length} likes
                            </span>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            <button
                              onClick={() => navigate("editor", { blogToEdit: b })}
                              className="px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-850 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm("Are you sure you want to delete this blog post?")) {
                                  try {
                                    await apiCall(`/api/blogs/${b.id}`, "DELETE");
                                    setBlogs(blogs.filter(blog => blog.id !== b.id));
                                    showToast("Post deleted.", "success");
                                  } catch (e) {}
                                }
                              }}
                              className="p-1.5 text-neutral-400 hover:text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
                              title="Delete Post"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* 10. ADMIN MODERATION CONTROL PANEL ROUTE                    */}
          {/* ========================================================= */}
          {currentPage === "admin" && currentUser?.role === "admin" && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              <div className="pb-4 border-b border-neutral-200/50 dark:border-neutral-800/80">
                <h1 className="text-xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400 flex items-center space-x-1.5">
                  <Shield className="w-5.5 h-5.5" />
                  <span>Administrative Moderation Hub</span>
                </h1>
                <p className="text-xs text-neutral-400">Manage platform users, investigate blog reports, and review statistics</p>
              </div>

              {adminLoading ? (
                <div className="h-40 flex items-center justify-center font-bold text-neutral-500">Loading admin ledger...</div>
              ) : (
                <>
                  {/* Platform Stats */}
                  {adminStats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-5 bg-white dark:bg-neutral-900/90 text-center">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Total Users</span>
                        <strong className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white block mt-1">{adminStats.totalUsers}</strong>
                      </div>
                      <div className="border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-5 bg-white dark:bg-neutral-900/90 text-center">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Total Blogs</span>
                        <strong className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white block mt-1">{adminStats.totalBlogs}</strong>
                      </div>
                      <div className="border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-5 bg-white dark:bg-neutral-900/90 text-center">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">Platform Views</span>
                        <strong className="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white block mt-1">{adminStats.totalViews}</strong>
                      </div>
                      <div className="border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl p-5 bg-white dark:bg-neutral-900/90 text-center border-red-500/20 bg-red-500/5">
                        <span className="text-[10px] font-bold text-red-500 dark:text-red-400 uppercase tracking-widest block">Active Reports</span>
                        <strong className="text-2xl sm:text-3xl font-extrabold text-red-600 dark:text-red-400 block mt-1">{adminStats.activeReports}</strong>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    
                    {/* Reported Blogs Queue */}
                    <div className="space-y-4">
                      <h2 className="text-base font-extrabold text-neutral-900 dark:text-white flex items-center space-x-1.5">
                        <Flag className="w-4.5 h-4.5 text-red-500" />
                        <span>Moderation Reports Queue</span>
                      </h2>

                      <div className="border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl overflow-hidden bg-white dark:bg-neutral-900 divide-y divide-neutral-100 dark:divide-neutral-800 text-xs">
                        {adminReports.length === 0 ? (
                          <p className="text-center py-12 text-neutral-400">All reports resolved! Moderation queue is pristine.</p>
                        ) : (
                          adminReports.map(r => (
                            <div key={r.id} className={`p-4 space-y-2.5 transition-colors ${r.isResolved ? "opacity-50 bg-neutral-50/50" : ""}`}>
                              <div className="flex items-center justify-between">
                                <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                                  r.isResolved ? "bg-neutral-200 text-neutral-500" : "bg-red-500/10 text-red-500 border border-red-500/20"
                                }`}>
                                  {r.isResolved ? "Resolved" : `Reported: ${r.reason}`}
                                </span>
                                <span className="text-[10px] text-neutral-400">{new Date(r.createdAt).toLocaleDateString()}</span>
                              </div>

                              <div className="min-w-0">
                                <h4 className="font-bold text-neutral-900 dark:text-white truncate">
                                  Post: {r.blog?.title || "Deleted blog post"}
                                </h4>
                                <p className="text-neutral-400 mt-0.5">Reporter: @{r.reporter?.username} • Writer: @{r.blog?.author?.username}</p>
                              </div>

                              {r.details && (
                                <p className="p-2.5 bg-neutral-50 dark:bg-neutral-950 rounded-lg italic text-neutral-600 dark:text-neutral-400">
                                  "{r.details}"
                                </p>
                              )}

                              {!r.isResolved && (
                                <div className="flex items-center space-x-2 pt-1 font-bold">
                                  <button
                                    onClick={() => handleAdminResolveReport(r.id)}
                                    className="flex-1 py-1.5 rounded-lg bg-emerald-600 text-white text-center hover:bg-emerald-500 transition-colors cursor-pointer"
                                  >
                                    Mark Resolved
                                  </button>
                                  {r.blog && (
                                    <button
                                      onClick={() => handleAdminDeletePost(r.blog!.id)}
                                      className="flex-1 py-1.5 rounded-lg bg-red-600 text-white text-center hover:bg-red-500 transition-colors cursor-pointer"
                                    >
                                      Delete Post
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Platform Users Management */}
                    <div className="space-y-4">
                      <h2 className="text-base font-extrabold text-neutral-900 dark:text-white flex items-center space-x-1.5">
                        <Users className="w-4.5 h-4.5 text-blue-500" />
                        <span>Platform Users Management</span>
                      </h2>

                      <div className="border border-neutral-200/60 dark:border-neutral-800/60 rounded-2xl overflow-hidden bg-white dark:bg-neutral-900 divide-y divide-neutral-100 dark:divide-neutral-800 text-xs">
                        {adminUsers.map(u => (
                          <div key={u.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-neutral-50/20 transition-colors">
                            <div className="flex items-center space-x-2.5">
                              <img
                                src={u.profileImage}
                                alt="avatar"
                                referrerPolicy="no-referrer"
                                className="w-8.5 h-8.5 rounded-xl object-cover ring-1 ring-neutral-200 dark:ring-neutral-850"
                              />
                              <div>
                                <h4 className="font-bold text-neutral-900 dark:text-white flex items-center space-x-1.5">
                                  <span>{u.name}</span>
                                  {u.isBanned && (
                                    <span className="text-[9px] bg-red-500/10 text-red-500 border border-red-500/20 px-1 py-0.2 rounded font-extrabold select-none uppercase">BANNED</span>
                                  )}
                                </h4>
                                <p className="text-neutral-400">@{u.username} • {u.role.toUpperCase()} • {(u as any).blogsCount} posts</p>
                              </div>
                            </div>

                            <div className="flex items-center space-x-1.5 font-bold shrink-0">
                              <button
                                onClick={() => handleAdminUserBan(u.id, !u.isBanned)}
                                className={`px-2.5 py-1.5 rounded-lg border text-[11px] transition-colors cursor-pointer ${
                                  u.isBanned 
                                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white" 
                                    : "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500 hover:text-white"
                                }`}
                              >
                                {u.isBanned ? "Unban" : "Ban"}
                              </button>

                              <button
                                onClick={() => handleAdminUserRole(u.id, u.role === "admin" ? "user" : "admin")}
                                className="px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-[11px] cursor-pointer"
                              >
                                Make {u.role === "admin" ? "User" : "Admin"}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* 11. STATIC ABOUT ROUTE                                    */}
          {/* ========================================================= */}
          {currentPage === "about" && (
            <motion.div
              key="about"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-2xl mx-auto space-y-6 text-center py-12"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg mx-auto">
                <Info className="w-5 h-5" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">About BlogSphere AI</h1>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed font-sans text-left">
                BlogSphere AI is a premium, full-featured blogging application designed for writers and technical developers. By merging beautiful typesetting, nested comment frameworks, and social connection tools with writing assistants, our platform elevates digital expression.
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed font-sans text-left">
                Every drafts written is scrutinized by Gemini LLM agents securely server-side to provide titles recommendations, grammar and syntax proofing, summarization models, readability scoring, and continuous writing flow assistance.
              </p>
              <div className="pt-4">
                <button
                  onClick={() => navigate("home")}
                  className="px-5 py-2.5 rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white text-xs cursor-pointer"
                >
                  Return to Explore
                </button>
              </div>
            </motion.div>
          )}

          {/* ========================================================= */}
          {/* 12. STATIC CONTACT ROUTE                                  */}
          {/* ========================================================= */}
          {currentPage === "contact" && (
            <motion.div
              key="contact"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-md mx-auto space-y-6 py-12"
            >
              <div className="border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 bg-white dark:bg-neutral-900 shadow-xl space-y-5 text-center">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg mx-auto">
                  <Mail className="w-5 h-5" />
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight">Contact Moderator Team</h1>
                <p className="text-xs text-neutral-400">Have questions or feedback? Drop us a line.</p>
                
                <form onSubmit={(e) => {
                  e.preventDefault();
                  showToast("Message dispatched successfully to our feedback moderators!", "success");
                  navigate("home");
                }} className="space-y-4 text-left">
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-1.5">Subject Topic</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Question on AI limits"
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 px-4 py-2.5 rounded-xl text-sm outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-widest mb-1.5">Message Details</label>
                    <textarea
                      required
                      placeholder="Type details of your message here..."
                      rows={4}
                      className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 p-4 rounded-xl text-sm outline-none resize-none font-sans leading-relaxed"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                  >
                    Send Message
                  </button>
                </form>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}
