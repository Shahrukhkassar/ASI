import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  X, 
  Sparkles, 
  Flame, 
  CheckCheck, 
  ExternalLink, 
  ChevronRight,
  BookOpen,
  Send,
  Award
} from 'lucide-react';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  category: 'test_alert' | 'announcement' | 'exam_tip' | 'results';
  timestamp: string;
  isRead: boolean;
  actionLabel?: string;
  actionUrl?: string;
  badgeText?: string;
}

const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'NEET 2026 Grand Mock Test 2 is Live!',
    message: 'NTA pattern 90-question Biology test with Section A (35 Qs) & Section B (15 Qs) is now open for all students.',
    category: 'test_alert',
    timestamp: 'Just now',
    isRead: false,
    actionLabel: 'Attempt Now',
    actionUrl: '#tests-section',
    badgeText: '🔴 NEW LIVE TEST'
  },
  {
    id: 'notif-2',
    title: 'Amerj Sir Special NCERT Biology Revision Notes',
    message: 'Chapterwise assertion-reasoning questions and diagram-based flashcards have been updated for Class 11th & 12th.',
    category: 'announcement',
    timestamp: '2 hours ago',
    isRead: false,
    actionLabel: 'Explore Syllabus',
    actionUrl: '#about-section',
    badgeText: '⭐ STUDY MATERIAL'
  },
  {
    id: 'notif-3',
    title: 'Top Score Ranking Announced for Niwari Center',
    message: 'Congratulations to top scorers in Human Physiology Master Challenge! Detailed rank analysis is available on Telegram.',
    category: 'results',
    timestamp: '1 day ago',
    isRead: false,
    actionLabel: 'Join Telegram',
    actionUrl: 'https://t.me/amerjsirinstitute',
    badgeText: '🏆 LEADERBOARD'
  },
  {
    id: 'notif-4',
    title: 'High-Yield Tip: Negative Marking Avoidance',
    message: 'In NEET Biology, always skip questions with 50-50 uncertainty in Section B to preserve your +4 marks buffer.',
    category: 'exam_tip',
    timestamp: '2 days ago',
    isRead: true,
    badgeText: '💡 EXAM STRATEGY'
  }
];

// 1. Notification Center Dropdown / Modal for Navbar
export const NotificationCenter: React.FC<{
  onNavigateToSection?: (sectionId: string) => void;
}> = ({ onNavigateToSection }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('asi_notifications');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // fallback
    }
    return DEFAULT_NOTIFICATIONS;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, isRead: true }));
    setNotifications(updated);
    localStorage.setItem('asi_notifications', JSON.stringify(updated));
  };

  const markSingleAsRead = (id: string) => {
    const updated = notifications.map(n => n.id === id ? { ...n, isRead: true } : n);
    setNotifications(updated);
    localStorage.setItem('asi_notifications', JSON.stringify(updated));
  };

  return (
    <div className="relative">
      <button
        id="navbar-notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl text-slate-600 hover:text-violet-600 hover:bg-violet-50 transition-colors focus:outline-none cursor-pointer"
        aria-label="Notifications"
        title="Notifications & Announcements"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600 text-[10px] font-extrabold text-white items-center justify-center">
              {unreadCount}
            </span>
          </span>
        )}
      </button>

      {isOpen && (
        <div 
          id="notification-dropdown-panel"
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-violet-100 py-3 z-50 animate-in fade-in slide-in-from-top-2 text-slate-900"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-violet-100 text-violet-700 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Notifications</h4>
                <p className="text-[11px] text-slate-500">{unreadCount} unread announcements</p>
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] font-bold text-violet-600 hover:text-violet-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.map((notif) => (
              <div 
                key={notif.id}
                onClick={() => markSingleAsRead(notif.id)}
                className={`p-3.5 transition-colors text-left hover:bg-violet-50/50 cursor-pointer ${
                  !notif.isRead ? 'bg-violet-50/30' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-violet-100 text-violet-800 uppercase tracking-wider">
                    {notif.badgeText || 'ANNOUNCEMENT'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">{notif.timestamp}</span>
                </div>

                <h5 className="text-xs font-bold text-slate-900 mt-1.5 leading-snug">
                  {notif.title}
                </h5>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {notif.message}
                </p>

                {notif.actionLabel && (
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markSingleAsRead(notif.id);
                        if (notif.actionUrl?.startsWith('#') && onNavigateToSection) {
                          onNavigateToSection(notif.actionUrl.replace('#', ''));
                        } else if (notif.actionUrl) {
                          window.open(notif.actionUrl, '_blank');
                        }
                        setIsOpen(false);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-bold text-violet-700 hover:text-violet-900"
                    >
                      <span>{notif.actionLabel}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer inside dropdown */}
          <div className="px-4 pt-2.5 border-t border-slate-100 text-center">
            <a
              href="https://t.me/amerjsirinstitute"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 hover:text-violet-700"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Join ASI Official Telegram Channel</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

// 2. Home Screen Top Announcement Ticker / Banner
export const HomeNotificationBanner: React.FC<{
  onStartTestNow?: () => void;
  onExploreTests?: () => void;
}> = ({ onStartTestNow, onExploreTests }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);

  const notices = [
    {
      badge: "LIVE NOTICE",
      text: "NEET 2026 Biology Grand Mock Test 2 is Live on CBT Simulator! Attempt free now.",
      action: "Attempt Test",
      onClick: onStartTestNow
    },
    {
      badge: "UPDATED",
      text: "100% NCERT Line-by-Line Statement & Assertion Reasoning Questions loaded.",
      action: "View Tests",
      onClick: onExploreTests
    },
    {
      badge: "NIWARI TOPPERS",
      text: "Amerj Sir Institute Niwari batches produced 94.6% selections in NEET Biology!",
      action: "Explore",
      onClick: onExploreTests
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % notices.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [notices.length]);

  if (isDismissed) return null;

  const currentNotice = notices[currentIdx];

  return (
    <aside
      id="home-screen-notification-banner"
      aria-label="Important Announcement"
      className="bg-gradient-to-r from-violet-700 via-indigo-700 to-purple-800 text-white py-2.5 px-4 text-xs font-medium relative overflow-hidden shadow-inner"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3 flex-1 truncate">
          <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-extrabold tracking-wider shrink-0 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            {currentNotice.badge}
          </span>
          <p className="truncate text-white font-medium text-xs sm:text-[13px]">
            {currentNotice.text}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {currentNotice.onClick && (
            <button
              onClick={currentNotice.onClick}
              className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white text-violet-900 font-bold hover:bg-violet-50 transition-colors text-xs cursor-pointer shadow-xs"
            >
              <span>{currentNotice.action}</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={() => setIsDismissed(true)}
            className="text-white/70 hover:text-white p-1 rounded-md"
            title="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
