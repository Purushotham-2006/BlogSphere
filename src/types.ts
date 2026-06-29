export interface User {
  id: string;
  name: string;
  username: string;
  email?: string;
  profileImage: string;
  coverImage: string;
  bio: string;
  followers: string[];
  following: string[];
  role: "user" | "admin";
  isBanned?: boolean;
  bookmarks: string[];
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
  likes: string[];
  views: number;
  commentsCount: number;
  readingTime: number;
  createdAt: string;
  updatedAt: string;
  author?: {
    id: string;
    name: string;
    username: string;
    bio?: string;
    profileImage: string;
  };
  isLiked?: boolean;
  isBookmarked?: boolean;
}

export interface Comment {
  id: string;
  blogId: string;
  userId: string;
  comment: string;
  parentCommentId: string | null;
  likes: string[];
  createdAt: string;
  user?: {
    id: string;
    name: string;
    username: string;
    profileImage: string;
  };
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
  sender?: {
    id: string;
    name: string;
    username: string;
    profileImage: string;
  };
}

export interface Report {
  id: string;
  blogId: string;
  reporterId: string;
  reason: string;
  details: string;
  isResolved: boolean;
  createdAt: string;
  reporter?: {
    name: string;
    username: string;
  } | null;
  blog?: {
    id: string;
    title: string;
    slug: string;
    author: {
      name: string;
      username: string;
    } | null;
  } | null;
}

export interface PlatformStats {
  totalUsers: number;
  totalBlogs: number;
  totalComments: number;
  totalViews: number;
  activeReports: number;
  categoriesCount: Record<string, number>;
}
