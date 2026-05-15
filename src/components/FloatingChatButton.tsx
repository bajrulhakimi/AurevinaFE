import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import API from "../services/api";
import { useAuth } from "../context/useAuth";

export default function FloatingChatButton() {
  const location = useLocation();
  const { isAuthenticated, isCustomer } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const productId = useMemo(() => {
    const match = location.pathname.match(/^\/products\/(\d+)/);
    return match?.[1] ?? null;
  }, [location.pathname]);

  const chatHref = productId ? `/chat?product_id=${productId}` : "/chat";
  const shouldShow =
    !location.pathname.startsWith("/admin") &&
    !location.pathname.startsWith("/login") &&
    !location.pathname.startsWith("/signup") &&
    location.pathname !== "/chat";

  useEffect(() => {
    if (!isAuthenticated || !isCustomer || !shouldShow) {
      setUnreadCount(0);
      return;
    }

    let active = true;

    const fetchUnread = async () => {
      try {
        const res = await API.get("/chat/unread-count");
        if (active) {
          setUnreadCount(Number(res.data?.data?.unread_count || 0));
        }
      } catch {
        if (active) {
          setUnreadCount(0);
        }
      }
    };

    fetchUnread();
    const timer = window.setInterval(fetchUnread, 15000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [isAuthenticated, isCustomer, shouldShow]);

  if (!shouldShow) return null;

  return (
    <Link
      to={isAuthenticated ? chatHref : `/login?redirect=${encodeURIComponent(chatHref)}`}
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#8f3d5b] text-white shadow-2xl shadow-rose-950/25 transition hover:-translate-y-0.5 hover:bg-[#76304a] focus:outline-none focus:ring-4 focus:ring-rose-200"
      aria-label="Chat dengan Aurevina"
    >
      <MessageCircle className="h-6 w-6" />
      {unreadCount > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-[#d15f73] px-1.5 text-xs font-bold text-white ring-2 ring-white">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      ) : null}
    </Link>
  );
}
