import React, { useState, useRef, useEffect } from "react";
import { User, Notification } from "../types";
import { Sun, Moon, Bell, PenTool, LayoutDashboard, Settings, LogOut, Shield, Compass, BookOpen, User as UserIcon, Bookmark } from "lucide-react";

interface NavbarProps {
  currentUser: User | null;
  notifications: Notification[];
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  onNavigate: (page: string, params?: Record<string, any>) => void;
  onLogout: () => void;
  activePage: string;
}

export default function Navbar({
  currentUser,
  notifications,
  darkMode,
  setDarkMode,
  onNavigate,
  onLogout,
  activePage,
}: NavbarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-neutral-200/80 dark:border-neutral-800/80 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div 
            onClick={() => onNavigate("home")} 
            className="flex items-center space-x-2.5 cursor-pointer select-none group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
              <PenTool className="w-4.5 h-4.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-lg font-extrabold tracking-tight bg-gradient-to-r from-neutral-900 to-neutral-700 dark:from-white dark:to-neutral-300 bg-clip-text text-transparent">
                BlogSphere
              </span>
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 tracking-widest uppercase -mt-1">
                AI Powered
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => onNavigate("home")}
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activePage === "home"
                  ? "bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white"
                  : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-900/50"
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Explore</span>
            </button>

            {currentUser && (
              <>
                <button
                  onClick={() => onNavigate("editor")}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    activePage === "editor"
                      ? "bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white"
                      : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-900/50"
                  }`}
                >
                  <PenTool className="w-4 h-4" />
                  <span>Write Post</span>
                </button>

                <button
                  onClick={() => onNavigate("bookmarks")}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    activePage === "bookmarks"
                      ? "bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white"
                      : "text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-900/50"
                  }`}
                >
                  <Bookmark className="w-4 h-4" />
                  <span>Bookmarks</span>
                </button>
              </>
            )}
          </div>

          {/* Action Center */}
          <div className="flex items-center space-x-3">
            
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-xl border border-neutral-200/50 dark:border-neutral-800/60 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-all cursor-pointer"
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {currentUser ? (
              <>
                {/* Notifications Link */}
                <button
                  onClick={() => onNavigate("notifications")}
                  className="p-2.5 rounded-xl border border-neutral-200/50 dark:border-neutral-800/60 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-all cursor-pointer relative"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-extrabold flex items-center justify-center animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center space-x-2 focus:outline-none cursor-pointer"
                  >
                    <img
                      src={currentUser.profileImage}
                      alt={currentUser.name}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-xl object-cover ring-2 ring-neutral-200 dark:ring-neutral-800 hover:ring-blue-500 dark:hover:ring-blue-400 transition-all"
                    />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2.5 w-60 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-950 p-2 shadow-xl ring-1 ring-black/5 animate-in fade-in slide-in-from-top-3 duration-200">
                      
                      {/* Dropdown User Info */}
                      <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-900">
                        <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                          {currentUser.name}
                        </p>
                        <p className="text-xs text-neutral-400 dark:text-neutral-500 truncate">
                          @{currentUser.username}
                        </p>
                      </div>

                      {/* Menu Options */}
                      <div className="py-1.5 space-y-0.5">
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            onNavigate("profile", { username: currentUser.username });
                          }}
                          className="flex w-full items-center space-x-2.5 rounded-xl px-3.5 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
                        >
                          <UserIcon className="w-4 h-4 text-neutral-400" />
                          <span>My Profile</span>
                        </button>

                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            onNavigate("dashboard");
                          }}
                          className="flex w-full items-center space-x-2.5 rounded-xl px-3.5 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
                        >
                          <LayoutDashboard className="w-4 h-4 text-neutral-400" />
                          <span>Dashboard</span>
                        </button>

                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            onNavigate("settings");
                          }}
                          className="flex w-full items-center space-x-2.5 rounded-xl px-3.5 py-2.5 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
                        >
                          <Settings className="w-4 h-4 text-neutral-400" />
                          <span>Settings</span>
                        </button>

                        {currentUser.role === "admin" && (
                          <button
                            onClick={() => {
                              setDropdownOpen(false);
                              onNavigate("admin");
                            }}
                            className="flex w-full items-center space-x-2.5 rounded-xl px-3.5 py-2.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors font-medium"
                          >
                            <Shield className="w-4 h-4 text-blue-500" />
                            <span>Admin Panel</span>
                          </button>
                        )}
                      </div>

                      {/* Logout */}
                      <div className="border-t border-neutral-100 dark:border-neutral-900 pt-1.5 mt-1.5">
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            onLogout();
                          }}
                          className="flex w-full items-center space-x-2.5 rounded-xl px-3.5 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors font-medium"
                        >
                          <LogOut className="w-4 h-4 text-red-500" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2 pl-1">
                <button
                  onClick={() => onNavigate("login")}
                  className="px-4 py-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Log In
                </button>
                <button
                  onClick={() => onNavigate("register")}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/10 active:scale-95 transition-all cursor-pointer"
                >
                  Get Started
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
