import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FileText,
  Settings as SettingsIcon,
  LogOut,
  Star,
  MessageCircle,
  Bell,
  Search,
  Sparkles,
} from "lucide-react";
import API from "../services/api";

interface UserData {
  id: number;
  name: string;
  email: string;
  role: string;
}

const navigation = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Produk", href: "/admin/products", icon: Package },
  { name: "Pesanan", href: "/admin/orders", icon: ShoppingCart },
  { name: "User", href: "/admin/users", icon: Users },
  { name: "Artikel", href: "/admin/blogs", icon: FileText },
  { name: "Promo", href: "/admin/promos", icon: Star },
  { name: "Ulasan", href: "/admin/reviews", icon: Star },
  { name: "Chat", href: "/admin/chats", icon: MessageCircle },
  { name: "Pengaturan", href: "/admin/settings", icon: SettingsIcon },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [user] = useState<UserData | null>(() => {
    const userData = localStorage.getItem("user");
    if (!userData) {
      return null;
    }

    try {
      return JSON.parse(userData) as UserData;
    } catch {
      return null;
    }
  });
  const [notifications, setNotifications] = useState<AdminNotificationData>({
    new_orders: 0,
    unread_chats: 0,
    total: 0,
  });
  const [notificationOpen, setNotificationOpen] = useState(false);

  useEffect(() => {
    let active = true;

    const fetchNotifications = async () => {
      try {
        const response = await API.get<{ data: AdminNotificationData }>("/admin/notifications");
        if (active) setNotifications(response.data.data);
      } catch {
        if (active) setNotifications({ new_orders: 0, unread_chats: 0, total: 0 });
      }
    };

    fetchNotifications();
    const timer = window.setInterval(fetchNotifications, 10000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  const currentPage = navigation.find((item) => item.href === location.pathname) || navigation[0];
  const initials = user?.name
    ?.split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "AD";
  const today = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <div className="flex min-h-screen flex-col bg-[#f4f1ed] text-slate-900 lg:h-screen lg:flex-row">
      <aside className="relative shrink-0 overflow-y-auto bg-[#0b0a09] text-stone-300 shadow-2xl lg:w-72">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,rgba(176,74,108,0.34),transparent_48%),radial-gradient(circle_at_top_right,rgba(185,137,94,0.28),transparent_40%)]" />
        <div className="relative p-3 sm:p-4 lg:p-6">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8f3d5b] text-white shadow-lg shadow-[#8f3d5b]/25">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Aurevina</h2>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#d9b17c]">Admin Store</p>
            </div>
          </div>
        </div>
        <nav className="relative flex gap-2 overflow-x-auto px-3 pb-3 lg:block lg:px-4 lg:pb-36">
          <p className="hidden mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-500 lg:block">Menu Utama</p>
          {navigation.map((item) => {
            const isActive = location.pathname === item.href || (item.href === "/admin/dashboard" && location.pathname === "/admin");
            const badgeCount = item.href === "/admin/orders" ? notifications.new_orders : item.href === "/admin/chats" ? notifications.unread_chats : 0;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`group mb-1 flex shrink-0 items-center rounded-2xl px-3 py-2.5 text-xs font-semibold transition sm:text-sm lg:px-4 lg:py-3 ${
                  isActive
                    ? "border border-white/10 bg-white text-[#171412] shadow-xl shadow-black/20"
                    : "text-stone-400 hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                <span
                  className={`mr-3 flex h-9 w-9 items-center justify-center rounded-xl transition ${
                    isActive ? "bg-[#f4e5dd] text-[#8f3d5b]" : "bg-white/[0.07] text-stone-400 group-hover:text-[#d9b17c]"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                </span>
                <span className="flex-1">{item.name}</span>
                {badgeCount > 0 ? (
                  <span className="rounded-full bg-[#8f3d5b] px-2 py-0.5 text-[11px] font-bold text-white">
                    {badgeCount > 99 ? "99+" : badgeCount}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="hidden border-t border-white/10 bg-[#0b0a09]/95 p-4 backdrop-blur lg:absolute lg:bottom-0 lg:left-0 lg:block lg:w-full">
          {user && (
            <div className="mb-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3">
              <div className="flex items-center">
                <div className="mr-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#b9895e] text-sm font-bold text-white">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                  <p className="truncate text-xs text-stone-400">{user.email}</p>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex w-full items-center rounded-2xl px-4 py-3 text-sm font-semibold text-stone-400 transition hover:bg-red-500/10 hover:text-red-200"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Keluar
          </button>
        </div>
      </aside>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="border-b border-stone-200 bg-white/90 shadow-sm backdrop-blur">
          <div className="flex items-center justify-between gap-5 px-4 py-4 sm:px-6 lg:px-8 lg:py-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b9895e]">Admin Panel</p>
              <h1 className="mt-1 text-3xl font-bold tracking-normal text-slate-950">{currentPage.name}</h1>
              <p className="mt-1 hidden text-sm text-slate-500 sm:block">Kelola toko, pesanan, konten, dan pelanggan dari satu tempat.</p>
            </div>
            <div className="hidden min-w-[420px] items-center gap-3 lg:flex">
              <div className="flex flex-1 items-center gap-3 rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-slate-500">
                <Search className="h-4 w-4 text-slate-400" />
                <span>Cari data di halaman aktif</span>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotificationOpen((open) => !open)}
                  className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-stone-200 bg-white text-slate-600 shadow-sm transition hover:border-[#b9895e] hover:text-[#8f3d5b]"
                >
                  <Bell className="h-5 w-5" />
                  {notifications.total > 0 ? (
                    <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#8f3d5b] px-1 text-[10px] font-bold text-white">
                      {notifications.total > 99 ? "99+" : notifications.total}
                    </span>
                  ) : null}
                </button>
                {notificationOpen ? (
                  <div className="absolute right-0 top-14 z-50 w-80 overflow-hidden rounded-2xl border border-stone-200 bg-white text-left shadow-2xl shadow-stone-900/15">
                    <div className="border-b border-stone-100 px-4 py-3">
                      <p className="font-bold text-slate-950">Notifikasi Admin</p>
                      <p className="text-xs text-stone-500">Auto refresh tiap 10 detik</p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 p-3">
                      <Link to="/admin/orders" onClick={() => setNotificationOpen(false)} className="rounded-2xl bg-[#f4e5dd] p-3 text-sm font-bold text-[#8f3d5b]">
                        {notifications.new_orders} order baru
                      </Link>
                      <Link to="/admin/chats" onClick={() => setNotificationOpen(false)} className="rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-700">
                        {notifications.unread_chats} chat belum dibaca
                      </Link>
                    </div>
                    <div className="max-h-72 overflow-y-auto px-3 pb-3">
                      {notifications.latest_orders?.slice(0, 3).map((order) => (
                        <Link key={order.id} to="/admin/orders" onClick={() => setNotificationOpen(false)} className="block rounded-xl px-3 py-2 text-sm hover:bg-stone-50">
                          <span className="font-semibold text-slate-950">{order.order_code}</span>
                          <span className="ml-2 text-xs text-stone-500">{order.order_status}</span>
                        </Link>
                      ))}
                      {notifications.latest_chats?.slice(0, 3).map((chat) => (
                        <Link key={chat.id} to="/admin/chats" onClick={() => setNotificationOpen(false)} className="block rounded-xl px-3 py-2 text-sm hover:bg-stone-50">
                          <span className="font-semibold text-slate-950">{chat.customer?.name || "Customer"}</span>
                          <span className="mt-0.5 block truncate text-xs text-stone-500">{chat.message || "Pesan baru"}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-right shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Hari ini</p>
                <p className="text-sm font-semibold text-slate-900">{today}</p>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-[linear-gradient(180deg,#fbfaf8_0%,#f3f0ec_48%,#eef1f4_100%)] p-3 sm:p-5 lg:p-8">
          <div className="mx-auto max-w-[1600px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

interface AdminNotificationData {
  new_orders: number;
  unread_chats: number;
  total: number;
  latest_orders?: Array<{ id: number; order_code: string; order_status: string; total_price: number }>;
  latest_chats?: Array<{ id: number; customer?: { name?: string; email?: string }; message?: string | null; sender_role?: string | null }>;
}
