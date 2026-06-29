import fs from "fs";
import path from "path";
import crypto from "crypto";

// Schema Definitions
export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  passwordHash: string;
  profileImage: string;
  coverImage: string;
  bio: string;
  followers: string[]; // User IDs
  following: string[]; // User IDs
  role: "user" | "admin";
  isBanned: boolean;
  bookmarks: string[]; // Blog IDs
  createdAt: string;
}

export interface Blog {
  id: string;
  title: string;
  slug: string;
  content: string;
  coverImage: string;
  category: string;
  tags: string[];
  authorId: string;
  likes: string[]; // User IDs
  views: number;
  commentsCount: number;
  readingTime: number; // in minutes
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  blogId: string;
  userId: string;
  comment: string;
  parentCommentId: string | null; // For nesting
  likes: string[]; // User IDs
  createdAt: string;
}

export interface Notification {
  id: string;
  receiverId: string;
  senderId: string;
  type: "like" | "comment" | "follow" | "reply" | "mention";
  message: string;
  isRead: boolean;
  blogId: string | null;
  createdAt: string;
}

export interface Report {
  id: string;
  blogId: string;
  reporterId: string;
  reason: string;
  details: string;
  isResolved: boolean;
  createdAt: string;
}

interface DatabaseSchema {
  users: User[];
  blogs: Blog[];
  comments: Comment[];
  notifications: Notification[];
  reports: Report[];
}

const DB_FILE = path.join(process.cwd(), "blog_database.json");

// Default/Seed Data
const INITIAL_DATABASE: DatabaseSchema = {
  users: [
    {
      id: "admin-1",
      name: "Alex Rivera",
      username: "alex_admin",
      email: "admin@blogsphere.ai",
      passwordHash: crypto.createHash("sha256").update("Admin123!").digest("hex"),
      profileImage: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop",
      coverImage: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000",
      bio: "Chief Editor and Tech Architect at BlogSphere AI. Passionate about AI, fullstack development, and decentralized web systems.",
      followers: ["user-2", "user-3"],
      following: ["user-2"],
      role: "admin",
      isBanned: false,
      bookmarks: ["blog-2"],
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "user-2",
      name: "Sarah Jenkins",
      username: "sarah_j",
      email: "sarah@blogsphere.ai",
      passwordHash: crypto.createHash("sha256").update("User123!").digest("hex"),
      profileImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop",
      coverImage: "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?w=1000",
      bio: "Senior AI Researcher & Educator. Writing about the future of intelligence, generative design, and cognitive systems.",
      followers: ["admin-1"],
      following: ["admin-1", "user-3"],
      role: "user",
      isBanned: false,
      bookmarks: ["blog-1"],
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "user-3",
      name: "Marcus Vance",
      username: "marcus_v",
      email: "marcus@blogsphere.ai",
      passwordHash: crypto.createHash("sha256").update("User123!").digest("hex"),
      profileImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop",
      coverImage: "https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=1000",
      bio: "Fullstack Engineer and open-source enthusiast. Building high performance applications with React, Rust, and Node.js.",
      followers: ["user-2"],
      following: ["admin-1"],
      role: "user",
      isBanned: false,
      bookmarks: [],
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ],
  blogs: [
    {
      id: "blog-1",
      title: "The Architecture of Modern LLMs: From Attention to Transformers",
      slug: "the-architecture-of-modern-llms",
      content: "Large Language Models (LLMs) have completely transformed our digital landscape. But how do they actually process information? At their core lies the Transformer architecture, proposed in the seminal 2017 paper 'Attention Is All You Need'.\n\n### The Self-Attention Mechanism\nTraditional Recurrent Neural Networks (RNNs) processed text sequentially, word-by-word. This made them slow and limited their ability to capture long-range dependencies. The Transformer replaced recurrence entirely with self-attention.\n\nIn simple terms, self-attention allows a model to look at other words in an input sequence to better understand the current word. For example, in the sentence 'The bank of the river', the model can focus on 'river' to understand that 'bank' refers to land, not a financial institution.\n\n```python\n# Concept of Self-Attention\nimport numpy as np\n\ndef softmax(x):\n    return np.exp(x) / np.sum(np.exp(x), axis=-1, keepdims=True)\n\n# Toy Query, Key, Value matrices\nQ = np.array([[1, 0, 1]])\nK = np.array([[1, 0, 1], [0, 1, 0]])\nV = np.array([[10, 20], [30, 40]])\n\n# Compute attention scores\nscores = Q @ K.T\nweights = softmax(scores)\noutput = weights @ V\nprint(\"Contextual vector output:\", output)\n```\n\n### Why Scale Matters\nWe've discovered that as Transformer models scale in parameters and training tokens, emergent capabilities—like logical reasoning and coding—spontaneously appear. This scaling hypothesis suggests that we are still far from reaching the physical boundaries of what these systems can achieve.\n\nWhat are your thoughts on the future of LLMs? Will they eventually reach general intelligence, or is the transformer model missing a fundamental piece of human cognition?",
      coverImage: "https://images.unsplash.com/photo-1677442136019-21780efad99a?w=1200&fit=crop",
      category: "AI",
      tags: ["AI", "LLM", "DeepLearning", "Python"],
      authorId: "user-2",
      likes: ["admin-1", "user-3"],
      views: 342,
      commentsCount: 2,
      readingTime: 4,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "blog-2",
      title: "Mastering React 19: Action Hooks, Server Components, and the Compiler",
      slug: "mastering-react-19-action-hooks",
      content: "React 19 is officially here! With it comes a complete shift in how we handle async state, data mutations, and rendering performance. Let's break down the most impactful new features.\n\n### 1. React Compiler (React Forget)\nHistorically, React developers had to manually optimize renders using `useMemo`, `useCallback`, and `React.memo`. This is finally a thing of the past. The React Compiler automatically optimizes your code at compile time, ensuring components only re-render when their actual output changes.\n\n### 2. Action Hooks: `useActionState` & `useFormStatus`Safe data fetching is now fully integrated into the framework. Instead of manually writing boilerplate `loading` and `error` states for forms, we can use actions:\n\n```tsx\n// React 19 Form action example\nimport { useActionState } from 'react';\n\nasync function updateProfile(prevState: any, formData: FormData) {\n  try {\n    const name = formData.get('username');\n    await saveToDatabase(name);\n    return { success: true, message: 'Updated successfully!' };\n  } catch (err) { \n    return { success: false, message: 'Failed to update.' };\n  }\n}\n\nfunction ProfileForm() {\n  const [state, formAction, isPending] = useActionState(updateProfile, null);\n  return (\n    <form action={formAction}>\n      <input name=\"username\" type=\"text\" />\n      <button type=\"submit\" disabled={isPending}>\n        {isPending ? 'Updating...' : 'Save'}\n      </button>\n      {state && <p>{state.message}</p>}\n    </form>\n  );\n}\n```\n\n### 3. The `use` API\nThe new `use` hook allows you to consume Promises and Context directly in the render cycle. Unlike standard React hooks, `use` can be called conditionally or inside loops! This completely changes how we consume asynchronous data on the client side.",
      coverImage: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200&fit=crop",
      category: "Programming",
      tags: ["React", "JavaScript", "Frontend", "WebDev"],
      authorId: "admin-1",
      likes: ["user-2"],
      views: 189,
      commentsCount: 1,
      readingTime: 3,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "blog-3",
      title: "Designing Elegant APIs: Best Practices for RESTful & GraphQL Interfaces",
      slug: "designing-elegant-apis-best-practices",
      content: "Building an API is easy; designing an API that is intuitive, robust, scalable, and delightful for developers to use is incredibly hard. Whether you are building RESTful endpoints or a GraphQL schema, these guidelines will elevate your API design.\n\n### 1. Resource-Oriented REST URIs\nIn REST, your URLs should represent nouns (resources), not verbs (actions). Keep them simple and hierarchical.\n- **Good:** `GET /api/v1/blogs`\n- **Good:** `POST /api/v1/blogs/:id/comments`\n- **Bad:** `POST /api/v1/getBlogs`\n- **Bad:** `POST /api/v1/deleteComment/:id`\n\n### 2. Standardized Error Formats\nFew things are more frustrating to an API consumer than receiving a `200 OK` status code with an body containing `{\"error\": \"Uncaught exception\"}` or getting a completely different error structure for every endpoint. Consistently return a payload representing the error:\n\n```json\n{\n  \"error\": {\n    \"code\": \"INVALID_PARAMETER\",\n    \"message\": \"The title of the blog post cannot exceed 100 characters.\",\n    \"details\": [\n      {\n        \"field\": \"title\",\n        \"issue\": \"Too long\"\n      }\n    ]\n  }\n}\n```\n\n### 3. Idempotent State Changes\nEnsure that PUT and DELETE operations are fully idempotent—meaning calling them multiple times with the same input produces the exact same result. It prevents race conditions and corrupted data states if network packets get duplicate delivery.",
      coverImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&fit=crop",
      category: "Programming",
      tags: ["APIDesign", "NodeJS", "Backend", "WebDev"],
      authorId: "user-3",
      likes: ["user-2", "admin-1"],
      views: 95,
      commentsCount: 0,
      readingTime: 3,
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ],
  comments: [
    {
      id: "comment-1",
      blogId: "blog-1",
      userId: "admin-1",
      comment: "This is one of the clearest explanations of self-attention I have ever read! The python toy code really helps visualize how queries and keys create weighted sums. Excellent write up Sarah!",
      parentCommentId: null,
      likes: ["user-2"],
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "comment-2",
      blogId: "blog-1",
      userId: "user-2",
      comment: "Thank you Alex! Really appreciate it. I'm planning to write a follow-up piece on multi-head attention and KV caching next week, so stay tuned!",
      parentCommentId: "comment-1",
      likes: ["admin-1"],
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "comment-3",
      blogId: "blog-2",
      userId: "user-2",
      comment: "Awesome breakdown of React 19. The removal of useMemo and useCallback is going to clean up so many repositories. Actions look sweet too!",
      parentCommentId: null,
      likes: [],
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ],
  notifications: [
    {
      id: "notif-1",
      receiverId: "user-2",
      senderId: "admin-1",
      type: "like",
      message: "liked your blog post 'The Architecture of Modern LLMs'",
      isRead: true,
      blogId: "blog-1",
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "notif-2",
      receiverId: "user-2",
      senderId: "admin-1",
      type: "comment",
      message: "commented on your blog post 'The Architecture of Modern LLMs'",
      isRead: false,
      blogId: "blog-1",
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "notif-3",
      receiverId: "admin-1",
      senderId: "user-2",
      type: "reply",
      message: "replied to your comment on 'The Architecture of Modern LLMs'",
      isRead: false,
      blogId: "blog-1",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ],
  reports: []
};

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, "utf-8");
        return JSON.parse(fileContent);
      } else {
        this.save(INITIAL_DATABASE);
        return INITIAL_DATABASE;
      }
    } catch (e) {
      console.error("Failed to load JSON database, using seed data:", e);
      return INITIAL_DATABASE;
    }
  }

  private save(dataToSave: DatabaseSchema): void {
    try {
      // Ensure directory exists
      const dir = path.dirname(DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), "utf-8");
      this.data = dataToSave;
    } catch (e) {
      console.error("Failed to save JSON database:", e);
    }
  }

  // --- USERS OPERATIONS ---
  getUsers() { return this.data.users; }
  getUserById(id: string) { return this.data.users.find(u => u.id === id); }
  getUserByEmail(email: string) { return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase()); }
  getUserByUsername(username: string) { return this.data.users.find(u => u.username.toLowerCase() === username.toLowerCase()); }

  createUser(user: Omit<User, "id" | "createdAt" | "followers" | "following" | "bookmarks" | "isBanned" | "role">) {
    const newUser: User = {
      ...user,
      id: "user-" + Math.random().toString(36).substr(2, 9),
      followers: [],
      following: [],
      bookmarks: [],
      isBanned: false,
      role: "user",
      createdAt: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.save(this.data);
    return newUser;
  }

  updateUser(id: string, updates: Partial<User>) {
    const index = this.data.users.findIndex(u => u.id === id);
    if (index === -1) return null;
    this.data.users[index] = { ...this.data.users[index], ...updates };
    this.save(this.data);
    return this.data.users[index];
  }

  deleteUser(id: string) {
    const user = this.getUserById(id);
    if (!user) return false;
    
    // Remove users from database
    this.data.users = this.data.users.filter(u => u.id !== id);
    // Remove their blogs
    this.data.blogs = this.data.blogs.filter(b => b.authorId !== id);
    // Remove their comments
    this.data.comments = this.data.comments.filter(c => c.userId !== id);
    // Save database
    this.save(this.data);
    return true;
  }

  // --- BLOGS OPERATIONS ---
  getBlogs() { return this.data.blogs; }
  getBlogById(id: string) { return this.data.blogs.find(b => b.id === id); }
  getBlogBySlug(slug: string) { return this.data.blogs.find(b => b.slug === slug); }

  createBlog(blog: Omit<Blog, "id" | "likes" | "views" | "commentsCount" | "createdAt" | "updatedAt">) {
    const newBlog: Blog = {
      ...blog,
      id: "blog-" + Math.random().toString(36).substr(2, 9),
      likes: [],
      views: 0,
      commentsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.data.blogs.push(newBlog);
    this.save(this.data);
    return newBlog;
  }

  updateBlog(id: string, updates: Partial<Blog>) {
    const index = this.data.blogs.findIndex(b => b.id === id);
    if (index === -1) return null;
    this.data.blogs[index] = { 
      ...this.data.blogs[index], 
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.save(this.data);
    return this.data.blogs[index];
  }

  deleteBlog(id: string) {
    const index = this.data.blogs.findIndex(b => b.id === id);
    if (index === -1) return false;
    this.data.blogs.splice(index, 1);
    // Delete comments associated with it
    this.data.comments = this.data.comments.filter(c => c.blogId !== id);
    // Delete reports associated with it
    this.data.reports = this.data.reports.filter(r => r.blogId !== id);
    this.save(this.data);
    return true;
  }

  // --- COMMENTS OPERATIONS ---
  getComments() { return this.data.comments; }
  getCommentsForBlog(blogId: string) {
    return this.data.comments.filter(c => c.blogId === blogId);
  }

  createComment(comment: Omit<Comment, "id" | "likes" | "createdAt">) {
    const newComment: Comment = {
      ...comment,
      id: "comment-" + Math.random().toString(36).substr(2, 9),
      likes: [],
      createdAt: new Date().toISOString(),
    };
    this.data.comments.push(newComment);
    
    // Update comment counts on blog
    const blog = this.getBlogById(comment.blogId);
    if (blog) {
      blog.commentsCount = this.getCommentsForBlog(comment.blogId).length;
      this.updateBlog(blog.id, { commentsCount: blog.commentsCount });
    }

    this.save(this.data);
    return newComment;
  }

  likeComment(commentId: string, userId: string) {
    const comment = this.data.comments.find(c => c.id === commentId);
    if (!comment) return null;
    if (comment.likes.includes(userId)) {
      comment.likes = comment.likes.filter(id => id !== userId);
    } else {
      comment.likes.push(userId);
    }
    this.save(this.data);
    return comment;
  }

  deleteComment(id: string) {
    const comment = this.data.comments.find(c => c.id === id);
    if (!comment) return false;
    
    // Find nested comments to delete too
    const nestedIds = this.data.comments.filter(c => c.parentCommentId === id).map(c => c.id);
    const idsToDelete = [id, ...nestedIds];

    this.data.comments = this.data.comments.filter(c => !idsToDelete.includes(c.id));
    
    // Update comment counts
    const blog = this.getBlogById(comment.blogId);
    if (blog) {
      blog.commentsCount = this.getCommentsForBlog(comment.blogId).length;
      this.updateBlog(blog.id, { commentsCount: blog.commentsCount });
    }

    this.save(this.data);
    return true;
  }

  // --- NOTIFICATIONS OPERATIONS ---
  getNotifications() { return this.data.notifications; }
  getNotificationsForUser(userId: string) {
    return this.data.notifications
      .filter(n => n.receiverId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  createNotification(notif: Omit<Notification, "id" | "isRead" | "createdAt">) {
    // Avoid notifying yourself
    if (notif.senderId === notif.receiverId) return null;

    const newNotif: Notification = {
      ...notif,
      id: "notif-" + Math.random().toString(36).substr(2, 9),
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    this.data.notifications.push(newNotif);
    this.save(this.data);
    return newNotif;
  }

  markNotificationsAsRead(userId: string) {
    this.data.notifications = this.data.notifications.map(n => {
      if (n.receiverId === userId) {
        return { ...n, isRead: true };
      }
      return n;
    });
    this.save(this.data);
    return true;
  }

  // --- REPORTS OPERATIONS ---
  getReports() { return this.data.reports; }
  createReport(report: Omit<Report, "id" | "isResolved" | "createdAt">) {
    const newReport: Report = {
      ...report,
      id: "report-" + Math.random().toString(36).substr(2, 9),
      isResolved: false,
      createdAt: new Date().toISOString(),
    };
    this.data.reports.push(newReport);
    this.save(this.data);
    return newReport;
  }

  resolveReport(id: string) {
    const index = this.data.reports.findIndex(r => r.id === id);
    if (index === -1) return null;
    this.data.reports[index].isResolved = true;
    this.save(this.data);
    return this.data.reports[index];
  }

  deleteReport(id: string) {
    const index = this.data.reports.findIndex(r => r.id === id);
    if (index === -1) return false;
    this.data.reports.splice(index, 1);
    this.save(this.data);
    return true;
  }
}

export const db = new Database();
