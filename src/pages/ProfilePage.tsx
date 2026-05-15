import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { LogOut, Mail, MapPin, MessageCircle, PackageCheck, ShoppingBag, UserRound } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/useAuth";
import API, { extractApiList } from "../services/api";

interface SavedAddress {
  id: number;
  receiver_name: string;
  receiver_phone: string;
  city: string;
  postal_code: string;
  full_address: string;
  is_default: boolean;
}

interface Order {
  id: number;
  order_code: string;
  order_status: string;
  total_price: number;
  created_at: string;
}

const statusLabel: Record<string, string> = {
  pending: "Menunggu",
  confirmed: "Dikonfirmasi",
  processed: "Diproses",
  shipped: "Dikirim",
  delivered: "Selesai",
  cancelled: "Dibatalkan",
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isCustomer, logout } = useAuth();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !isCustomer) return;

    Promise.all([
      API.get("/addresses").then((response) => setAddresses(extractApiList<SavedAddress>(response.data))).catch(() => setAddresses([])),
      API.get("/orders").then((response) => setOrders(extractApiList<Order>(response.data))).catch(() => setOrders([])),
    ]).finally(() => setLoading(false));
  }, [isAuthenticated, isCustomer]);

  if (!isAuthenticated) {
    return <Navigate to="/login?redirect=/profile" replace />;
  }

  if (!isCustomer) {
    return <Navigate to="/" replace />;
  }

  const defaultAddress = addresses.find((address) => address.is_default) || addresses[0];
  const activeOrders = orders.filter((order) => !["delivered", "cancelled"].includes(order.order_status)).length;
  const completedOrders = orders.filter((order) => order.order_status === "delivered").length;
  const latestOrders = orders.slice(0, 3);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#fbf7f2]">
      <Navbar />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] border border-white bg-[#15110f] text-white shadow-xl shadow-stone-300/40">
          <div className="grid gap-8 p-6 md:grid-cols-[1fr_auto] md:items-end lg:p-8">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-[#8f3d5b] text-3xl font-black">
                {user?.name?.slice(0, 1).toUpperCase() || "A"}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#d9b17c]">Profil Customer</p>
                <h1 className="mt-2 text-3xl font-bold">{user?.name}</h1>
                <p className="mt-1 flex items-center gap-2 text-sm text-stone-300">
                  <Mail className="h-4 w-4" />
                  {user?.email}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </button>
          </div>
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.5rem] border border-white bg-white p-5 shadow-sm ring-1 ring-stone-200/70">
            <p className="text-sm text-stone-500">Total Pesanan</p>
            <p className="mt-2 text-3xl font-black text-stone-950">{loading ? "-" : orders.length}</p>
          </div>
          <div className="rounded-[1.5rem] border border-white bg-white p-5 shadow-sm ring-1 ring-stone-200/70">
            <p className="text-sm text-stone-500">Sedang Berjalan</p>
            <p className="mt-2 text-3xl font-black text-[#8f3d5b]">{loading ? "-" : activeOrders}</p>
          </div>
          <div className="rounded-[1.5rem] border border-white bg-white p-5 shadow-sm ring-1 ring-stone-200/70">
            <p className="text-sm text-stone-500">Selesai</p>
            <p className="mt-2 text-3xl font-black text-emerald-700">{loading ? "-" : completedOrders}</p>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_0.9fr]">
          <div className="rounded-[2rem] border border-white bg-white p-6 shadow-sm ring-1 ring-stone-200/70">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b9895e]">Akun</p>
                <h2 className="mt-1 text-xl font-bold text-stone-950">Informasi Profil</h2>
              </div>
              <UserRound className="h-6 w-6 text-[#8f3d5b]" />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-[#fbf7f2] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Nama</p>
                <p className="mt-2 font-bold text-stone-950">{user?.name}</p>
              </div>
              <div className="rounded-2xl bg-[#fbf7f2] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Email</p>
                <p className="mt-2 break-all font-bold text-stone-950">{user?.email}</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-stone-200 p-4">
              <div className="flex items-start gap-3">
                <MapPin className="mt-1 h-5 w-5 shrink-0 text-[#8f3d5b]" />
                <div>
                  <p className="font-bold text-stone-950">Alamat utama</p>
                  {defaultAddress ? (
                    <p className="mt-1 text-sm leading-6 text-stone-600">
                      {defaultAddress.receiver_name} - {defaultAddress.receiver_phone}
                      <br />
                      {defaultAddress.full_address}, {defaultAddress.city} {defaultAddress.postal_code}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-stone-500">Belum ada alamat tersimpan. Tambahkan alamat saat checkout.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white bg-white p-6 shadow-sm ring-1 ring-stone-200/70">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b9895e]">Akses Cepat</p>
            <h2 className="mt-1 text-xl font-bold text-stone-950">Menu Customer</h2>

            <div className="mt-5 grid gap-3">
              <Link to="/orders" className="flex items-center justify-between rounded-2xl border border-stone-200 p-4 transition hover:border-[#8f3d5b]/40 hover:bg-[#fbf7f2]">
                <span className="flex items-center gap-3 font-bold text-stone-950"><PackageCheck className="h-5 w-5 text-[#8f3d5b]" /> Pesanan Saya</span>
                <span className="text-sm text-stone-500">{orders.length}</span>
              </Link>
              <Link to="/products" className="flex items-center justify-between rounded-2xl border border-stone-200 p-4 transition hover:border-[#8f3d5b]/40 hover:bg-[#fbf7f2]">
                <span className="flex items-center gap-3 font-bold text-stone-950"><ShoppingBag className="h-5 w-5 text-[#8f3d5b]" /> Belanja Lagi</span>
              </Link>
              <Link to="/chat" className="flex items-center justify-between rounded-2xl border border-stone-200 p-4 transition hover:border-[#8f3d5b]/40 hover:bg-[#fbf7f2]">
                <span className="flex items-center gap-3 font-bold text-stone-950"><MessageCircle className="h-5 w-5 text-[#8f3d5b]" /> Chat Admin</span>
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[2rem] border border-white bg-white p-6 shadow-sm ring-1 ring-stone-200/70">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#b9895e]">Riwayat</p>
              <h2 className="mt-1 text-xl font-bold text-stone-950">Pesanan Terbaru</h2>
            </div>
            <Link to="/orders" className="rounded-full border border-[#8f3d5b] px-4 py-2 text-sm font-bold text-[#8f3d5b] hover:bg-[#fbf7f2]">
              Lihat Semua
            </Link>
          </div>

          <div className="mt-5 divide-y divide-stone-100">
            {latestOrders.length > 0 ? latestOrders.map((order) => (
              <div key={order.id} className="flex flex-wrap items-center justify-between gap-4 py-4">
                <div>
                  <p className="font-bold text-stone-950">{order.order_code}</p>
                  <p className="text-sm text-stone-500">{new Date(order.created_at).toLocaleString("id-ID")}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-stone-950">Rp {Number(order.total_price).toLocaleString("id-ID")}</p>
                  <span className="mt-1 inline-flex rounded-full bg-[#f4e5dd] px-3 py-1 text-xs font-bold text-[#8f3d5b]">
                    {statusLabel[order.order_status] || order.order_status}
                  </span>
                </div>
              </div>
            )) : (
              <p className="py-8 text-center text-stone-500">Belum ada pesanan.</p>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
