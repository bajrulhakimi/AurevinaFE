import { useEffect, useState } from "react";
import API, { getApiErrorMessage } from "../services/api";
import SummaryCard from "../components/SummaryCard";
import { Users, Package, ShoppingCart, DollarSign, Clock, CheckCircle, Truck, TrendingUp } from "lucide-react";

interface DashboardData {
  users: number;
  products: number;
  orders: number;
  total_revenue: number;
  monthly_revenue: number;
  pending_orders: number;
  shipped_orders: number;
  delivered_orders: number;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await API.get<{ data: DashboardData }>("/admin/dashboard");
        setData(res.data.data);
      } catch (err) {
        console.error("API Error:", err);
        setError(getApiErrorMessage(err, "Failed to load dashboard data"));
      }
    }

    void loadDashboard();
  }, []);

  if (error && !data) {
    return (
    <div className="flex h-64 items-center justify-center">
      <div className="text-center">
          <p className="mb-4 text-red-600">Error: {error}</p>
          <p className="text-gray-600">Pastikan backend berjalan dan akun admin sudah login.</p>
      </div>
    </div>
  );
  }

  if (!data) return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#8f3d5b]"></div>
    </div>
  );

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] border border-white bg-[#15110f] p-7 text-white shadow-xl shadow-stone-300/40">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#d9b17c]">Selamat datang kembali</p>
            <h2 className="mt-3 text-3xl font-bold tracking-normal text-white">Ringkasan performa toko</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-300">
              Pantau pesanan, pelanggan, stok produk, dan pendapatan secara cepat sebelum memproses operasional hari ini.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-[#d9b17c]">
              <Users className="h-6 w-6" />
              <p className="mt-3 text-2xl font-bold text-white">{data.users}</p>
              <p className="text-xs text-stone-300">Pelanggan</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-[#d9b17c]">
              <Package className="h-6 w-6" />
              <p className="mt-3 text-2xl font-bold text-white">{data.products}</p>
              <p className="text-xs text-stone-300">Produk</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-4 text-[#d9b17c]">
              <ShoppingCart className="h-6 w-6" />
              <p className="mt-3 text-2xl font-bold text-white">{data.orders}</p>
              <p className="text-xs text-stone-300">Pesanan</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Pelanggan"
          value={data.users}
          icon={Users}
          color="border-l-[#8f3d5b]"
        />
        <SummaryCard
          title="Total Produk"
          value={data.products}
          icon={Package}
          color="border-l-emerald-500"
        />
        <SummaryCard
          title="Total Pesanan"
          value={data.orders}
          icon={ShoppingCart}
          color="border-l-indigo-500"
        />
        <SummaryCard
          title="Total Pendapatan"
          value={new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(data.total_revenue)}
          icon={DollarSign}
          color="border-l-amber-500"
        />
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,0.6fr)_minmax(0,0.4fr)]">
        <div className="rounded-[2rem] border border-white bg-white/95 p-6 shadow-sm ring-1 ring-slate-900/5">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Pendapatan Bulan Ini</h3>
              <p className="text-sm text-slate-500">Performa transaksi yang sudah masuk bulan berjalan</p>
            </div>
            <div className="rounded-2xl bg-amber-50 p-3 text-amber-600">
              <TrendingUp className="h-6 w-6" />
            </div>
          </div>
          <div className="text-4xl font-bold text-slate-950">
            {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(data.monthly_revenue)}
          </div>
          <div className="mt-6 h-3 overflow-hidden rounded-full bg-stone-100">
            <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-[#8f3d5b] via-[#b9895e] to-amber-400" />
          </div>
          <p className="mt-4 text-sm text-slate-600">Gunakan ringkasan ini untuk melihat apakah kampanye, produk unggulan, dan pesanan baru bergerak sehat.</p>
        </div>

        <div className="rounded-[2rem] border border-white bg-white/95 p-6 shadow-sm ring-1 ring-slate-900/5">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Status Pesanan</h3>
              <p className="text-sm text-slate-500">Ringkasan proses pesanan aktif</p>
            </div>
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-600">
              <ShoppingCart className="h-6 w-6" />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-center">
              <Clock className="mx-auto mb-3 h-6 w-6 text-amber-600" />
              <p className="text-3xl font-semibold text-amber-700">{data.pending_orders}</p>
              <p className="mt-2 text-sm text-amber-700">Menunggu</p>
            </div>
            <div className="rounded-3xl border border-indigo-200 bg-indigo-50 p-5 text-center">
              <Truck className="mx-auto mb-3 h-6 w-6 text-indigo-600" />
              <p className="text-3xl font-semibold text-indigo-700">{data.shipped_orders}</p>
              <p className="mt-2 text-sm text-indigo-700">Dikirim</p>
            </div>
            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-center">
              <CheckCircle className="mx-auto mb-3 h-6 w-6 text-emerald-600" />
              <p className="text-3xl font-semibold text-emerald-700">{data.delivered_orders}</p>
              <p className="mt-2 text-sm text-emerald-700">Selesai</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
