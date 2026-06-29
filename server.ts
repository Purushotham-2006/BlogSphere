import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { db } from "./server/db.ts";
import * as aiHelper from "./server/ai.ts";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// --- CRYPTOGRAPHIC AUTHENTICATION SESSION ---
const JWT_SECRET = process.env.JWT_SECRET || "blogsphere-secret-key-123456";

function generateToken(userId: string): string {
  const signature = crypto.createHmac("sha256", JWT_SECRET).update(userId).digest("hex");
  return `${userId}.${signature}`;
}

function verifyToken(token: string): string | null {
  try {
    const [userId, signature] = token.split(".");
    if (!userId || !signature) return null;
    const expectedSignature = crypto.createHmac("sha256", JWT_SECRET).update(userId).digest("hex");
    if (signature === expectedSignature) {
      return userId;
    }
  } catch (e) {}
  return null;
}

// Authentication Middleware
function authMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: Missing token" });
  }

  const token = authHeader.split(" ")[1];
  const userId = verifyToken(token);
  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: Invalid or expired token" });
  }

  const user = db.getUserById(userId);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized: User not found" });
  }

  if (user.isBanned) {
    return res.status(403).json({ error: "Access denied: Your account has been banned" });
  }

  (req as any).user = user;
  next();
}

// Optional Auth Middleware (Doesn't block, but populates req.user if token is present)
function optionalAuthMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    const userId = verifyToken(token);
    if (userId) {
      const user = db.getUserById(userId);
      if (user && !user.isBanned) {
        (req as any).user = user;
      }
    }
  }
  next();
}

// Admin Middleware (Requires authMiddleware to be called first)
function adminMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const user = (req as any).user;
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admin privileges required" });
  }
  next();
}


// --- 1. AUTHENTICATION ENDPOINTS ---

// Register
app.post("/api/auth/register", (req, res) => {
  try {
    const { name, username, email, password, profileImage, bio } = req.body;

    if (!name || !username || !email || !password) {
      return res.status(400).json({ error: "Please provide all required fields (name, username, email, password)" });
    }

    if (db.getUserByEmail(email)) {
      return res.status(400).json({ error: "An account with this email already exists" });
    }

    if (db.getUserByUsername(username)) {
      return res.status(400).json({ error: "This username is already taken" });
    }

    const passwordHash = crypto.createHash("sha256").update(password).digest("hex");
    
    // Default avatar if none provided
    const defaultProfile = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(username)}`;
    const defaultCover = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000";

    const newUser = db.createUser({
      name,
      username,
      email,
      passwordHash,
      profileImage: profileImage || defaultProfile,
      coverImage: defaultCover,
      bio: bio || `Hello! I'm ${name}, a new blogger on BlogSphere AI.`,
    });

    const token = generateToken(newUser.id);
    const { passwordHash: _, ...userWithoutPassword } = newUser;

    res.status(201).json({
      message: "Registration successful",
      user: userWithoutPassword,
      token,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "An error occurred during registration" });
  }
});

// Login
app.post("/api/auth/login", (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = db.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (user.isBanned) {
      return res.status(403).json({ error: "This account has been banned from the platform" });
    }

    const passwordHash = crypto.createHash("sha256").update(password).digest("hex");
    if (user.passwordHash !== passwordHash) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const token = generateToken(user.id);
    const { passwordHash: _, ...userWithoutPassword } = user;

    res.json({
      message: "Login successful",
      user: userWithoutPassword,
      token,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "An error occurred during login" });
  }
});

// Logout (Dummy endpoint for JWT, client just clears token)
app.post("/api/auth/logout", (req, res) => {
  res.json({ message: "Logged out successfully" });
});

// Get Current User
app.get("/api/auth/me", authMiddleware, (req, res) => {
  const { passwordHash: _, ...userWithoutPassword } = (req as any).user;
  res.json({ user: userWithoutPassword });
});


// --- 2. USER PROFILE ENDPOINTS ---

// Get Public Profile
app.get("/api/profile/:username", optionalAuthMiddleware, (req, res) => {
  try {
    const { username } = req.params;
    const user = db.getUserByUsername(username);

    if (!user) {
      return res.status(404).json({ error: "User profile not found" });
    }

    // Get user's blogs
    const userBlogs = db.getBlogs().filter(b => b.authorId === user.id);
    
    // Check if current user follows this user
    const currentUser = (req as any).user;
    const isFollowing = currentUser ? user.followers.includes(currentUser.id) : false;

    const { passwordHash: _, email: __, ...publicProfile } = user;

    res.json({
      profile: {
        ...publicProfile,
        blogsCount: userBlogs.length,
        isFollowing,
      },
      blogs: userBlogs,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update Profile
app.put("/api/profile/update", authMiddleware, (req, res) => {
  try {
    const user = (req as any).user;
    const { name, bio, profileImage, coverImage } = req.body;

    const updatedUser = db.updateUser(user.id, {
      name: name || user.name,
      bio: bio !== undefined ? bio : user.bio,
      profileImage: profileImage || user.profileImage,
      coverImage: coverImage || user.coverImage,
    });

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const { passwordHash: _, ...userWithoutPassword } = updatedUser;
    res.json({ message: "Profile updated successfully", user: userWithoutPassword });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Follow / Unfollow Toggle
app.post("/api/profile/:userId/follow", authMiddleware, (req, res) => {
  try {
    const currentUser = (req as any).user;
    const targetUserId = req.params.userId;

    if (currentUser.id === targetUserId) {
      return res.status(400).json({ error: "You cannot follow yourself" });
    }

    const targetUser = db.getUserById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: "Target user not found" });
    }

    let isFollowing = false;
    let updatedFollowers = [...targetUser.followers];
    let updatedFollowing = [...currentUser.following];

    if (targetUser.followers.includes(currentUser.id)) {
      // Unfollow
      updatedFollowers = updatedFollowers.filter(id => id !== currentUser.id);
      updatedFollowing = updatedFollowing.filter(id => id !== targetUserId);
    } else {
      // Follow
      updatedFollowers.push(currentUser.id);
      updatedFollowing.push(targetUserId);
      isFollowing = true;

      // Create notification for follow
      db.createNotification({
        receiverId: targetUserId,
        senderId: currentUser.id,
        type: "follow",
        message: "started following you",
        blogId: null,
      });
    }

    db.updateUser(targetUserId, { followers: updatedFollowers });
    db.updateUser(currentUser.id, { following: updatedFollowing });

    res.json({
      message: isFollowing ? "Followed successfully" : "Unfollowed successfully",
      isFollowing,
      followersCount: updatedFollowers.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// --- 3. BLOGS ENDPOINTS ---

// Fetch Blogs (Filters: search, category, tag, authorId, sorting)
app.get("/api/blogs", optionalAuthMiddleware, (req, res) => {
  try {
    const { search, category, tag, authorId, filter } = req.query;
    let blogs = [...db.getBlogs()];

    // Filtering by Author
    if (authorId) {
      blogs = blogs.filter(b => b.authorId === authorId);
    }

    // Filtering by Category
    if (category) {
      blogs = blogs.filter(b => b.category.toLowerCase() === (category as string).toLowerCase());
    }

    // Filtering by Tag
    if (tag) {
      blogs = blogs.filter(b => b.tags.map(t => t.toLowerCase()).includes((tag as string).toLowerCase()));
    }

    // Filtering by Search Query
    if (search) {
      const q = (search as string).toLowerCase();
      blogs = blogs.filter(
        b =>
          b.title.toLowerCase().includes(q) ||
          b.content.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q) ||
          b.tags.map(t => t.toLowerCase()).some(t => t.includes(q))
      );
    }

    // Sorting & Filters
    if (filter === "oldest") {
      blogs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else if (filter === "views") {
      blogs.sort((a, b) => b.views - a.views);
    } else if (filter === "likes") {
      blogs.sort((a, b) => b.likes.length - a.likes.length);
    } else if (filter === "trending") {
      // Trending Algorithm: score = views + (likes * 5) + (commentsCount * 10)
      const getScore = (b: typeof blogs[0]) => b.views + b.likes.length * 5 + b.commentsCount * 10;
      blogs.sort((a, b) => getScore(b) - getScore(a));
    } else {
      // Default: newest
      blogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    // Attach author profiles to responses
    const blogsWithAuthors = blogs.map(blog => {
      const author = db.getUserById(blog.authorId);
      return {
        ...blog,
        author: author
          ? {
              id: author.id,
              name: author.name,
              username: author.username,
              profileImage: author.profileImage,
            }
          : { id: "unknown", name: "Former Writer", username: "deleted", profileImage: "" },
      };
    });

    res.json(blogsWithAuthors);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create Blog Post
app.post("/api/blogs", authMiddleware, (req, res) => {
  try {
    const user = (req as any).user;
    const { title, content, coverImage, category, tags } = req.body;

    if (!title || !content || !category) {
      return res.status(400).json({ error: "Title, content, and category are required fields" });
    }

    // Generate slug: lowercased, replace non-alphanumeric with hyphen
    let baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 80);
    
    // Ensure slug uniqueness
    let slug = baseSlug;
    let count = 1;
    while (db.getBlogBySlug(slug)) {
      slug = `${baseSlug}-${count}`;
      count++;
    }

    // Calculate reading time (avg 200 words per minute)
    const wordCount = content.trim().split(/\s+/).length;
    const readingTime = Math.max(1, Math.round(wordCount / 200));

    const defaultCover = "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=1200&fit=crop";

    const newBlog = db.createBlog({
      title,
      slug,
      content,
      coverImage: coverImage || defaultCover,
      category,
      tags: Array.isArray(tags) ? tags : [],
      authorId: user.id,
      readingTime,
    });

    res.status(201).json({ message: "Blog published successfully", blog: newBlog });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Blog by Slug or ID
app.get("/api/blogs/:idOrSlug", optionalAuthMiddleware, (req, res) => {
  try {
    const { idOrSlug } = req.params;
    let blog = db.getBlogById(idOrSlug);
    if (!blog) {
      blog = db.getBlogBySlug(idOrSlug);
    }

    if (!blog) {
      return res.status(404).json({ error: "Blog post not found" });
    }

    // Increment view count
    db.updateBlog(blog.id, { views: blog.views + 1 });
    blog.views += 1;

    // Attach author
    const author = db.getUserById(blog.authorId);
    
    // Check if liked & bookmarked
    const currentUser = (req as any).user;
    const isLiked = currentUser ? blog.likes.includes(currentUser.id) : false;
    const isBookmarked = currentUser ? currentUser.bookmarks.includes(blog.id) : false;

    const fullBlog = {
      ...blog,
      isLiked,
      isBookmarked,
      author: author
        ? {
            id: author.id,
            name: author.name,
            username: author.username,
            bio: author.bio,
            profileImage: author.profileImage,
          }
        : { id: "unknown", name: "Former Writer", username: "deleted", profileImage: "" },
    };

    res.json(fullBlog);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update Blog
app.put("/api/blogs/:id", authMiddleware, (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { title, content, coverImage, category, tags } = req.body;

    const blog = db.getBlogById(id);
    if (!blog) {
      return res.status(404).json({ error: "Blog post not found" });
    }

    // Verify ownership
    if (blog.authorId !== user.id && user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: You are not authorized to edit this post" });
    }

    // Calculate reading time
    const wordCount = content ? content.trim().split(/\s+/).length : 1;
    const readingTime = content ? Math.max(1, Math.round(wordCount / 200)) : blog.readingTime;

    const updated = db.updateBlog(id, {
      title: title || blog.title,
      content: content || blog.content,
      coverImage: coverImage || blog.coverImage,
      category: category || blog.category,
      tags: Array.isArray(tags) ? tags : blog.tags,
      readingTime,
    });

    res.json({ message: "Blog updated successfully", blog: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Blog
app.delete("/api/blogs/:id", authMiddleware, (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const blog = db.getBlogById(id);
    if (!blog) {
      return res.status(404).json({ error: "Blog post not found" });
    }

    // Verify ownership or Admin privileges
    if (blog.authorId !== user.id && user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: You are not authorized to delete this post" });
    }

    db.deleteBlog(id);
    res.json({ message: "Blog deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Like / Unlike Blog Post
app.post("/api/blogs/:id/like", authMiddleware, (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const blog = db.getBlogById(id);
    if (!blog) {
      return res.status(404).json({ error: "Blog post not found" });
    }

    let isLiked = false;
    let updatedLikes = [...blog.likes];

    if (blog.likes.includes(user.id)) {
      // Unlike
      updatedLikes = updatedLikes.filter(uid => uid !== user.id);
    } else {
      // Like
      updatedLikes.push(user.id);
      isLiked = true;

      // Create Notification
      db.createNotification({
        receiverId: blog.authorId,
        senderId: user.id,
        type: "like",
        message: `liked your blog post '${blog.title}'`,
        blogId: blog.id,
      });
    }

    db.updateBlog(id, { likes: updatedLikes });

    res.json({
      message: isLiked ? "Post liked" : "Post unliked",
      isLiked,
      likesCount: updatedLikes.length,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Bookmark / Unbookmark Toggle
app.post("/api/blogs/:id/bookmark", authMiddleware, (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    const blog = db.getBlogById(id);
    if (!blog) {
      return res.status(404).json({ error: "Blog post not found" });
    }

    let isBookmarked = false;
    let updatedBookmarks = [...user.bookmarks];

    if (user.bookmarks.includes(id)) {
      // Remove bookmark
      updatedBookmarks = updatedBookmarks.filter(bid => bid !== id);
    } else {
      // Add bookmark
      updatedBookmarks.push(id);
      isBookmarked = true;
    }

    db.updateUser(user.id, { bookmarks: updatedBookmarks });

    res.json({
      message: isBookmarked ? "Post added to bookmarks" : "Post removed from bookmarks",
      isBookmarked,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get Bookmarked Blogs
app.get("/api/bookmarks", authMiddleware, (req, res) => {
  try {
    const user = (req as any).user;
    const bookmarkedBlogs = db.getBlogs().filter(blog => user.bookmarks.includes(blog.id));

    // Attach author summaries
    const payload = bookmarkedBlogs.map(blog => {
      const author = db.getUserById(blog.authorId);
      return {
        ...blog,
        author: author
          ? {
              id: author.id,
              name: author.name,
              username: author.username,
              profileImage: author.profileImage,
            }
          : { id: "unknown", name: "Former Writer", username: "deleted", profileImage: "" },
      };
    });

    res.json(payload);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// --- 4. COMMENTS SYSTEM ---

// Get Comments Tree for a Blog
app.get("/api/blogs/:id/comments", (req, res) => {
  try {
    const { id } = req.params;
    const flatComments = db.getCommentsForBlog(id);

    // Map profiles
    const commentsWithUser = flatComments.map(c => {
      const user = db.getUserById(c.userId);
      return {
        ...c,
        user: user
          ? {
              id: user.id,
              name: user.name,
              username: user.username,
              profileImage: user.profileImage,
            }
          : { id: "unknown", name: "Former User", username: "deleted", profileImage: "" },
      };
    });

    res.json(commentsWithUser);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Post Comment / Reply
app.post("/api/blogs/:id/comments", authMiddleware, (req, res) => {
  try {
    const user = (req as any).user;
    const blogId = req.params.id;
    const { comment, parentCommentId } = req.body;

    if (!comment || !comment.trim()) {
      return res.status(400).json({ error: "Comment text cannot be empty" });
    }

    const blog = db.getBlogById(blogId);
    if (!blog) {
      return res.status(404).json({ error: "Blog post not found" });
    }

    const newComment = db.createComment({
      blogId,
      userId: user.id,
      comment,
      parentCommentId: parentCommentId || null,
    });

    // Send notifications
    if (parentCommentId) {
      // Reply Notification
      const parentComment = db.getComments().find(c => c.id === parentCommentId);
      if (parentComment && parentComment.userId !== user.id) {
        db.createNotification({
          receiverId: parentComment.userId,
          senderId: user.id,
          type: "reply",
          message: `replied to your comment on '${blog.title}'`,
          blogId: blog.id,
        });
      }
    } else {
      // General Blog Comment Notification
      if (blog.authorId !== user.id) {
        db.createNotification({
          receiverId: blog.authorId,
          senderId: user.id,
          type: "comment",
          message: `commented on your blog post '${blog.title}'`,
          blogId: blog.id,
        });
      }
    }

    const commentResponse = {
      ...newComment,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        profileImage: user.profileImage,
      },
    };

    res.status(201).json({ message: "Comment posted", comment: commentResponse });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle Comment Like
app.post("/api/blogs/:id/comments/:commentId/like", authMiddleware, (req, res) => {
  try {
    const user = (req as any).user;
    const { commentId } = req.params;

    const updated = db.likeComment(commentId, user.id);
    if (!updated) {
      return res.status(404).json({ error: "Comment not found" });
    }

    res.json({
      message: updated.likes.includes(user.id) ? "Comment liked" : "Comment unliked",
      likes: updated.likes,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Comment
app.delete("/api/blogs/:id/comments/:commentId", authMiddleware, (req, res) => {
  try {
    const user = (req as any).user;
    const { commentId } = req.params;

    const comments = db.getComments();
    const comment = comments.find(c => c.id === commentId);

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    // Check permissions (Owner of comment, Owner of blog, or Admin)
    const blog = db.getBlogById(comment.blogId);
    const isBlogOwner = blog ? blog.authorId === user.id : false;

    if (comment.userId !== user.id && !isBlogOwner && user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized to delete this comment" });
    }

    db.deleteComment(commentId);
    res.json({ message: "Comment and its replies deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// --- 5. NOTIFICATIONS SYSTEM ---

// Get User's Notifications
app.get("/api/notifications", authMiddleware, (req, res) => {
  try {
    const user = (req as any).user;
    const notifs = db.getNotificationsForUser(user.id);

    // Populate sender details
    const populated = notifs.map(n => {
      const sender = db.getUserById(n.senderId);
      return {
        ...n,
        sender: sender
          ? {
              id: sender.id,
              name: sender.name,
              username: sender.username,
              profileImage: sender.profileImage,
            }
          : { id: "unknown", name: "Former User", username: "deleted", profileImage: "" },
      };
    });

    res.json(populated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Mark All Notifications as Read
app.post("/api/notifications/read", authMiddleware, (req, res) => {
  try {
    const user = (req as any).user;
    db.markNotificationsAsRead(user.id);
    res.json({ message: "All notifications marked as read" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// --- 6. REPORTING SYSTEM ---

// Submit Blog Report
app.post("/api/reports", authMiddleware, (req, res) => {
  try {
    const user = (req as any).user;
    const { blogId, reason, details } = req.body;

    if (!blogId || !reason) {
      return res.status(400).json({ error: "Blog ID and reason for reporting are required" });
    }

    const blog = db.getBlogById(blogId);
    if (!blog) {
      return res.status(404).json({ error: "Blog post not found" });
    }

    const report = db.createReport({
      blogId,
      reporterId: user.id,
      reason,
      details: details || "",
    });

    res.status(201).json({ message: "Report submitted successfully. Our moderation team will review this shortly.", report });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// --- 7. ADMIN ENDPOINTS ---

// Get Platform Stats
app.get("/api/admin/stats", authMiddleware, adminMiddleware, (req, res) => {
  try {
    const users = db.getUsers();
    const blogs = db.getBlogs();
    const comments = db.getComments();
    const reports = db.getReports();

    const totalViews = blogs.reduce((acc, b) => acc + b.views, 0);
    const activeReports = reports.filter(r => !r.isResolved).length;

    // Categorization split counts
    const categoriesCount: Record<string, number> = {};
    blogs.forEach(b => {
      categoriesCount[b.category] = (categoriesCount[b.category] || 0) + 1;
    });

    res.json({
      stats: {
        totalUsers: users.length,
        totalBlogs: blogs.length,
        totalComments: comments.length,
        totalViews,
        activeReports,
        categoriesCount,
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// List Reports (with blog & reporter context)
app.get("/api/admin/reports", authMiddleware, adminMiddleware, (req, res) => {
  try {
    const reports = db.getReports();
    const populated = reports.map(r => {
      const reporter = db.getUserById(r.reporterId);
      const blog = db.getBlogById(r.blogId);
      const author = blog ? db.getUserById(blog.authorId) : null;

      return {
        ...r,
        reporter: reporter ? { name: reporter.name, username: reporter.username } : null,
        blog: blog
          ? {
              id: blog.id,
              title: blog.title,
              slug: blog.slug,
              author: author ? { name: author.name, username: author.username } : null,
            }
          : null,
      };
    });

    res.json(populated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Resolve Report
app.post("/api/admin/reports/:id/resolve", authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const resolved = db.resolveReport(id);
    if (!resolved) {
      return res.status(404).json({ error: "Report not found" });
    }
    res.json({ message: "Report marked as resolved successfully", report: resolved });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// List Users for Admin Control Panel
app.get("/api/admin/users", authMiddleware, adminMiddleware, (req, res) => {
  try {
    const users = db.getUsers().map(({ passwordHash: _, ...user }) => {
      const userBlogs = db.getBlogs().filter(b => b.authorId === user.id);
      return {
        ...user,
        blogsCount: userBlogs.length,
      };
    });
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle Role / Ban Users
app.put("/api/admin/users/:id/role", authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const { role, isBanned } = req.body;

    const userToModify = db.getUserById(id);
    if (!userToModify) {
      return res.status(404).json({ error: "User not found" });
    }

    const currentAdmin = (req as any).user;
    if (userToModify.id === currentAdmin.id) {
      return res.status(400).json({ error: "You cannot change your own role or ban status" });
    }

    const updated = db.updateUser(id, {
      role: role !== undefined ? role : userToModify.role,
      isBanned: isBanned !== undefined ? isBanned : userToModify.isBanned,
    });

    res.json({ message: "User status updated successfully", user: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Delete User & Content
app.delete("/api/admin/users/:id", authMiddleware, adminMiddleware, (req, res) => {
  try {
    const { id } = req.params;
    const userToModify = db.getUserById(id);
    if (!userToModify) {
      return res.status(404).json({ error: "User not found" });
    }

    const currentAdmin = (req as any).user;
    if (userToModify.id === currentAdmin.id) {
      return res.status(400).json({ error: "You cannot delete your own admin account" });
    }

    db.deleteUser(id);
    res.json({ message: "User account and all related blog posts and comments deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});


// --- 8. AI ASSISTANT ENDPOINTS (PROXIED TO GEMINI SECURELY SERVER-SIDE) ---

// AI Blog Summary
app.post("/api/ai/summarize", authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Please write some content first to generate a summary" });
    }
    const result = await aiHelper.generateSummary(content);
    res.json({ summary: result });
  } catch (error: any) {
    console.error("AI summarization error:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI summary" });
  }
});

// AI Title Suggestions
app.post("/api/ai/titles", authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Please write some draft content to suggest titles" });
    }
    const result = await aiHelper.generateTitles(content);
    res.json({ titles: result });
  } catch (error: any) {
    console.error("AI title generation error:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI titles" });
  }
});

// AI Tag Generator
app.post("/api/ai/tags", authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Please write some content to generate tags" });
    }
    const result = await aiHelper.generateTags(content);
    res.json({ tags: result });
  } catch (error: any) {
    console.error("AI tag generation error:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI tags" });
  }
});

// AI Grammar Correction
app.post("/api/ai/grammar", authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Please write some content to run grammar correction" });
    }
    const result = await aiHelper.correctGrammar(content);
    res.json({ corrected: result });
  } catch (error: any) {
    console.error("AI grammar error:", error);
    res.status(500).json({ error: error.message || "Failed to correct text grammar" });
  }
});

// AI Reading Level Analysis
app.post("/api/ai/reading-level", optionalAuthMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Please write some content to analyze readability" });
    }
    const result = await aiHelper.analyzeReadingLevel(content);
    res.json(result);
  } catch (error: any) {
    console.error("AI reading level error:", error);
    res.status(500).json({ error: error.message || "Failed to analyze reading level" });
  }
});

// AI Content Suggestions (Continuation)
app.post("/api/ai/suggest", authMiddleware, async (req, res) => {
  try {
    const { content, cursorContext } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Please provide content to suggest continuation" });
    }
    const result = await aiHelper.generateContinuation(content, cursorContext || "");
    res.json({ suggestion: result });
  } catch (error: any) {
    console.error("AI continuation suggestion error:", error);
    res.status(500).json({ error: error.message || "Failed to generate content continuation" });
  }
});

// AI SEO Scoring & Actionable Tips
app.post("/api/ai/seo", authMiddleware, async (req, res) => {
  try {
    const { title, content, tags } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required for SEO analysis" });
    }
    const result = await aiHelper.analyzeSEO(title, content, tags || []);
    res.json(result);
  } catch (error: any) {
    console.error("AI SEO analysis error:", error);
    res.status(500).json({ error: error.message || "Failed to perform AI SEO scoring" });
  }
});


// --- 9. CLIENT ROUTING / STATIC SERVING & VITE DEVELOPMENT MIDDLEWARE ---

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Dev Mode: integration of Vite as middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Mode: serve static front-end assets directly
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[BlogSphere AI] Full-stack server running at http://localhost:${PORT}`);
  });
}

startServer();
