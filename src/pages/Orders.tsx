import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API, { extractApiList, getApiErrorMessage, resolveAssetUrl } from "../services/api";
import { ChevronDown, MessageCircle, MoreHorizontal, PackageCheck, Printer, Search, SlidersHorizontal } from "lucide-react";
import Modal from "../components/Modal";

interface OrderItem {
  id: number;
  product_id?: number;
  quantity: number;
  price: number;
  product_name?: string;
  product_image?: string | null;
  variant_name?: string | null;
  product?: { name: string };
}

interface Order {
  id: number;
  order_code?: string;
  total_price: number;
  order_status: string;
  created_at: string;
  user?: { name: string; email: string };
  payment?: { payment_status: string; payment_proof?: string | null } | null;
  shipping?: {
    courier?: string | null;
    tracking_number?: string | null;
    shipping_status?: string | null;
  } | null;
  items?: OrderItem[];
  address?: {
    receiver_name?: string;
    receiver_phone?: string;
    city?: string;
    postal_code?: string;
    full_address?: string;
  };
}

interface OrderDetail extends Order {
  subtotal?: number;
  discount_amount?: number;
  shipping_cost?: number;
  payment_method?: string;
  notes?: string;
  items?: OrderItem[];
  address?: {
    receiver_name?: string;
    receiver_phone?: string;
    city?: string;
    postal_code?: string;
    full_address?: string;
  };
}

const periods = [
  { value: "all", label: "Semua" },
  { value: "today", label: "Hari Ini" },
  { value: "7d", label: "7 Hari" },
  { value: "30d", label: "30 Hari" },
];

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("all");
  const [statusTab, setStatusTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [bulkCourier, setBulkCourier] = useState("JNE");
  const [trackingDrafts, setTrackingDrafts] = useState<Record<number, string>>({});
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState<{ order: OrderDetail | Order; productId?: number; productName?: string } | null>(null);
  const [chatMessage, setChatMessage] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get("/admin/orders", {
        params: period === "all" ? {} : { period },
      });
      const nextOrders = extractApiList<Order>(res.data);
      setOrders(nextOrders);
      setTrackingDrafts(Object.fromEntries(nextOrders.map((order) => [order.id, order.shipping?.tracking_number || ""])));
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, "Pesanan tidak dapat dimuat."));
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const fetchOrderDetail = async (id: number) => {
    setDetailLoading(true);
    try {
      const res = await API.get(`/admin/orders/${id}`);
      setSelectedOrder(res.data.data);
      setIsDetailOpen(true);
    } catch (err) {
      setError(getApiErrorMessage(err, "Detail pesanan tidak dapat dimuat."));
    } finally {
      setDetailLoading(false);
    }
  };

  const updateStatus = async (id: number, status: string, extra: Record<string, string> = {}) => {
    try {
      const res = await API.put(`/admin/orders/${id}`, { order_status: status, ...extra });
      await fetchOrders();
      if (selectedOrder?.id === id) {
        setSelectedOrder(res.data.data);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Status pesanan gagal diperbarui."));
    }
  };

  const updatePaymentStatus = async (id: number, status: string) => {
    try {
      const res = await API.put(`/admin/orders/${id}`, { payment_status: status });
      await fetchOrders();
      if (selectedOrder?.id === id) {
        setSelectedOrder(res.data.data);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Status pembayaran gagal diperbarui."));
    }
  };

  const deleteOrder = async (id: number) => {
    if (!confirm("Hapus pesanan ini?")) return;

    try {
      await API.delete(`/admin/orders/${id}`);
      await fetchOrders();
      if (selectedOrder?.id === id) {
        setSelectedOrder(null);
        setIsDetailOpen(false);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Pesanan gagal dihapus."));
    }
  };

  const bulkShip = async () => {
    if (selectedIds.length === 0) {
      setError("Pilih pesanan terlebih dahulu untuk pengiriman masal.");
      return;
    }

    try {
      await API.post("/admin/orders/bulk-ship", {
        order_ids: selectedIds,
        courier: bulkCourier,
        tracking_numbers: Object.fromEntries(selectedIds.map((id) => [id, trackingDrafts[id] || null])),
      });
      setSelectedIds([]);
      await fetchOrders();
    } catch (err) {
      setError(getApiErrorMessage(err, "Pengiriman masal gagal diproses."));
    }
  };

  const handleRowAction = (order: Order, action: string) => {
    switch (action) {
      case "detail":
        fetchOrderDetail(order.id);
        break;
      case "ship":
        shipSingle(order);
        break;
      case "chat":
        chatBuyer(order);
        break;
      case "print":
        printShippingLabels([order]);
        break;
      case "delete":
        deleteOrder(order.id);
        break;
      default:
        break;
    }
  };

  const shipSingle = async (order: Order) => {
    try {
      await API.put(`/admin/orders/${order.id}`, {
        order_status: "shipped",
        courier: order.shipping?.courier || bulkCourier,
        tracking_number: trackingDrafts[order.id] || order.shipping?.tracking_number || "",
      });
      await fetchOrders();
    } catch (err) {
      setError(getApiErrorMessage(err, "Pesanan gagal dikirim."));
    }
  };

  const selectedOrders = orders.filter((order) => selectedIds.includes(order.id));
  const filteredOrders = orders.filter((order) => {
    const matchesTab = statusTab === "all" || order.order_status === statusTab;
    const keyword = searchQuery.toLowerCase();
    const matchesSearch =
      !keyword ||
      (order.order_code || `#${order.id}`).toLowerCase().includes(keyword) ||
      order.user?.name?.toLowerCase().includes(keyword) ||
      order.items?.some((item) => item.product_name?.toLowerCase().includes(keyword));

    return matchesTab && matchesSearch;
  });
  const metricCards = [
    { label: "Harus dikirim sebelum pukul 23.59 hari ini", value: orders.filter((order) => ["confirmed", "processed"].includes(order.order_status)).length },
    { label: "Pembatalan otomatis dalam maks. 24 jam", value: orders.filter((order) => order.order_status === "pending").length },
    { label: "Pengiriman terlambat", value: orders.filter((order) => order.order_status === "shipped" && !order.shipping?.tracking_number).length },
    { label: "Pembatalan", value: orders.filter((order) => order.order_status === "cancelled").length },
    { label: "Masalah logistik", value: 0 },
    { label: "Pengembalian barang/dana diajukan", value: 0 },
  ];
  const tabs = [
    { value: "all", label: "Semua", count: orders.length },
    { value: "confirmed", label: "Perlu dikirim", count: orders.filter((order) => ["confirmed", "processed"].includes(order.order_status)).length },
    { value: "shipped", label: "Dikirim", count: orders.filter((order) => order.order_status === "shipped").length },
    { value: "delivered", label: "Selesai", count: orders.filter((order) => order.order_status === "delivered").length },
    { value: "processed", label: "Dalam proses", count: orders.filter((order) => order.order_status === "processed").length },
    { value: "cancelled", label: "Dibatalkan", count: orders.filter((order) => order.order_status === "cancelled").length },
  ];

  const printShippingLabels = (targetOrders: Order[]) => {
    if (targetOrders.length === 0) {
      setError("Pilih pesanan atau buka pesanan yang ingin dicetak resinya.");
      return;
    }

    const labels = targetOrders.map((order) => {
      const trackingNumber = trackingDrafts[order.id] || order.shipping?.tracking_number || "-";
      const courier = order.shipping?.courier || bulkCourier || "-";
      const items = (order as OrderDetail).items?.map((item) => `<li>${item.product_name || item.product?.name || "Produk"} x${item.quantity}</li>`).join("") || "<li>Lihat detail pesanan di admin</li>";

      return `
        <section class="label">
          <div class="label-head">
            <div>
              <div class="brand">AUREVINA</div>
              <div class="muted">Modest Fashion</div>
            </div>
            <div class="badge">${courier}</div>
          </div>
          <div class="barcode">${trackingNumber}</div>
          <div class="grid">
            <div>
              <div class="caption">Nomor Pesanan</div>
              <div class="strong">${order.order_code || `#${order.id}`}</div>
            </div>
            <div>
              <div class="caption">Tanggal</div>
              <div class="strong">${new Date(order.created_at).toLocaleDateString("id-ID")}</div>
            </div>
          </div>
          <div class="block">
            <div class="caption">Penerima</div>
            <div class="strong">${order.user?.name || "Customer"}</div>
            <div>${(order as OrderDetail).address?.receiver_phone || ""}</div>
            <div>${(order as OrderDetail).address?.full_address || "Alamat terlihat di detail admin"}</div>
            <div>${(order as OrderDetail).address?.city || ""} ${(order as OrderDetail).address?.postal_code || ""}</div>
          </div>
          <div class="block">
            <div class="caption">Isi Paket</div>
            <ul>${items}</ul>
          </div>
          <div class="footer">
            <span>Total: ${formatRupiah(order.total_price)}</span>
            <span>Resi: ${trackingNumber}</span>
          </div>
        </section>
      `;
    }).join("");

    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Cetak Resi Aurevina</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 18px; font-family: Arial, sans-serif; color: #111827; background: #f8fafc; }
            .label { width: 100%; max-width: 760px; margin: 0 auto 18px; padding: 18px; border: 2px solid #111827; background: #fff; page-break-after: always; }
            .label-head, .grid, .footer { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
            .brand { font-size: 24px; font-weight: 800; letter-spacing: .08em; }
            .muted, .caption { color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: .12em; }
            .badge { border: 2px solid #111827; padding: 8px 14px; font-weight: 800; font-size: 18px; }
            .barcode { margin: 18px 0; border: 1px solid #111827; padding: 16px; text-align: center; font-size: 34px; font-weight: 900; letter-spacing: .16em; }
            .grid > div { flex: 1; border: 1px solid #cbd5e1; padding: 12px; }
            .block { margin-top: 14px; border: 1px solid #cbd5e1; padding: 12px; line-height: 1.5; }
            .strong { font-weight: 800; margin-top: 4px; }
            ul { margin: 8px 0 0; padding-left: 18px; }
            .footer { margin-top: 14px; border-top: 2px solid #111827; padding-top: 12px; font-weight: 800; }
            @media print { body { background: #fff; padding: 0; } .label { margin: 0; max-width: none; border-width: 2px; } }
          </style>
        </head>
        <body>${labels}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const chatBuyer = (order: OrderDetail | Order, productId?: number, productName?: string) => {
    setChatTarget({ order, productId, productName });
    setChatMessage(
      productId
        ? `Halo, kami ingin mengabari terkait produk ${productName || "yang dibeli"} pada pesanan ${order.order_code || `#${order.id}`}.`
        : `Halo, kami ingin mengabari terkait pesanan ${order.order_code || `#${order.id}`}.`
    );
  };

  const sendChatToBuyer = async () => {
    if (!chatTarget || !chatMessage.trim()) {
      setError("Tulis pesan terlebih dahulu sebelum mengirim chat.");
      return;
    }

    setSendingChat(true);
    try {
      await API.post("/admin/chats/start", {
        order_id: chatTarget.order.id,
        product_id: chatTarget.productId,
        message: chatMessage.trim(),
      });
      setChatTarget(null);
      setChatMessage("");
      navigate("/admin/chats");
    } catch (err) {
      setError(getApiErrorMessage(err, "Chat pembeli gagal dibuat."));
    } finally {
      setSendingChat(false);
    }
  };

  const toggleSelected = (id: number) => {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "pending": return "Menunggu";
      case "confirmed": return "Dikonfirmasi";
      case "processed": return "Diproses";
      case "shipped": return "Dikirim";
      case "delivered": return "Selesai";
      case "cancelled": return "Dibatalkan";
      default: return status;
    }
  };

  const getPaymentColor = (status?: string) => {
    switch (status) {
      case "verified": return "bg-emerald-100 text-emerald-800";
      case "rejected": return "bg-red-100 text-red-800";
      case "pending": return "bg-amber-100 text-amber-800";
      default: return "bg-stone-100 text-stone-700";
    }
  };

  const formatRupiah = (value?: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value || 0));

  const productInitial = (name?: string) => (name || "P").charAt(0).toUpperCase();
  const renderProductThumb = (item: OrderItem, className = "h-9 w-9") => {
    const imageSrc = resolveAssetUrl(item.product_image);

    return (
      <span className={`relative flex ${className} shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white bg-[#f4e5dd] text-xs font-bold text-[#8f3d5b] shadow-sm`}>
        <span>{productInitial(item.product_name)}</span>
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={item.product_name || "Produk"}
            className="absolute inset-0 h-full w-full object-cover"
            onError={(event) => {
              event.currentTarget.style.display = "none";
            }}
          />
        ) : null}
      </span>
    );
  };
  const formatOrderDate = (value: string) => {
    const date = new Date(value);
    const isToday = date.toDateString() === new Date().toDateString();
    const time = date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

    return `${isToday ? "Hari ini" : date.toLocaleDateString("id-ID")} ${time}`;
  };

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#8f3d5b]"></div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="rounded-[2rem] border border-white bg-[#15110f] p-6 text-white shadow-xl shadow-stone-300/40">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#d9b17c]">Operasional Toko</p>
          <h2 className="mt-2 text-3xl font-bold tracking-normal text-white">Kelola pesanan</h2>
          <p className="mt-2 text-sm text-stone-300">Pantau, kirim, cetak resi, dan hubungi pembeli dari satu halaman.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full min-w-64 rounded-2xl border border-white/10 bg-white/10 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-stone-400 focus:border-[#d9b17c] focus:outline-none focus:ring-2 focus:ring-[#d9b17c]/20"
              placeholder="Cari ID pesanan/produk"
            />
          </div>
          <button type="button" onClick={() => printShippingLabels(selectedOrders)} className="rounded-2xl bg-white px-4 py-2.5 text-sm font-bold text-[#171412] shadow-sm hover:bg-stone-100">
            Label pengiriman
          </button>
          <button type="button" className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/15">
            Program & layanan
          </button>
          <button type="button" className="rounded-2xl border border-white/10 bg-white/10 p-2.5 text-white hover:bg-white/15" aria-label="Menu lainnya">
            <MoreHorizontal className="h-5 w-5" />
          </button>
        </div>
        </div>
      </div>

      <section className="overflow-hidden rounded-[2rem] border border-white bg-white/95 shadow-sm ring-1 ring-slate-900/5">
        <div className="grid gap-0 md:grid-cols-3 xl:grid-cols-6">
          {metricCards.map((item) => (
            <div key={item.label} className="min-h-24 border-b border-stone-100 px-5 py-4 xl:border-b-0 xl:border-r last:border-r-0">
              <p className="min-h-9 text-xs font-semibold leading-5 text-stone-600">{item.label}</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{item.value}</p>
            </div>
          ))}
        </div>
        <div className="border-t border-stone-200 bg-stone-50/70 px-5 py-3 text-sm text-stone-700">
          Ketepatan waktu pengiriman sampai besok: <strong className="text-[#8f3d5b]">100%</strong> <span className="text-stone-400">(Target: 95%)</span>
        </div>
      </section>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <section className="overflow-visible rounded-[2rem] border border-white bg-white/95 shadow-sm ring-1 ring-slate-900/5">
        <div className="flex gap-6 overflow-x-auto border-b border-stone-200 px-5">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusTab(tab.value)}
              className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-bold ${
                statusTab === tab.value ? "border-[#8f3d5b] text-[#171412]" : "border-transparent text-stone-600 hover:text-slate-950"
              }`}
            >
              {tab.label} <span className="font-semibold text-stone-400">{tab.count}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 border-b border-stone-100 bg-[#fbfaf8] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className="inline-flex items-center gap-2 rounded-2xl bg-stone-100 px-3 py-2 text-sm font-bold text-[#171412] hover:bg-stone-200">
              <SlidersHorizontal className="h-4 w-4" />
              Filter
            </button>
            <span className="text-sm text-stone-600">Opsi pengantaran:</span>
            <select value={bulkCourier} onChange={(event) => setBulkCourier(event.target.value)} className="rounded-2xl border border-stone-300 bg-white px-3 py-2 text-sm font-semibold text-stone-700 focus:border-[#8f3d5b] focus:outline-none focus:ring-2 focus:ring-[#8f3d5b]/15">
              <option value="JNE">JNE</option>
              <option value="J&T Express">J&T Express</option>
              <option value="SiCepat">SiCepat</option>
              <option value="Anteraja">Anteraja</option>
            </select>
            <span className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-stone-500 ring-1 ring-stone-200">Ada {filteredOrders.length} pesanan</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <select value={period} onChange={(event) => setPeriod(event.target.value)} className="rounded-2xl border border-stone-300 bg-white px-3 py-2 text-sm font-bold text-stone-700 focus:border-[#8f3d5b] focus:outline-none focus:ring-2 focus:ring-[#8f3d5b]/15">
              {periods.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            <button type="button" onClick={bulkShip} className="inline-flex items-center gap-2 rounded-2xl bg-[#8f3d5b] px-4 py-2 text-sm font-bold text-white shadow-sm shadow-[#8f3d5b]/20 hover:bg-[#78304b]">
              <PackageCheck className="h-4 w-4" />
              Kirim {selectedIds.length ? `(${selectedIds.length})` : ""}
            </button>
            <button type="button" onClick={() => printShippingLabels(selectedOrders)} className="inline-flex items-center gap-2 rounded-2xl border border-stone-300 px-4 py-2 text-sm font-bold text-stone-700 hover:bg-stone-50">
              <Printer className="h-4 w-4" />
              Ekspor/Cetak
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] table-fixed divide-y divide-stone-200">
            <colgroup>
              <col className="w-[44px]" />
              <col className="w-[15%]" />
              <col className="w-[12%]" />
              <col className="w-[20%]" />
              <col className="w-[12%]" />
              <col className="w-[16%]" />
              <col className="w-[15%]" />
              <col className="w-[10%]" />
            </colgroup>
            <thead className="bg-stone-50">
              <tr>
                <th className="px-4 py-4 text-left">
                  <input className="h-4 w-4 rounded border-slate-300" type="checkbox" checked={filteredOrders.length > 0 && selectedIds.length === filteredOrders.length} onChange={(event) => setSelectedIds(event.target.checked ? filteredOrders.map((order) => order.id) : [])} />
                </th>
                <th className="px-4 py-4 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">Pesanan</th>
                <th className="px-4 py-4 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">Pembeli</th>
                <th className="px-4 py-4 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">Produk</th>
                <th className="px-4 py-4 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">Status</th>
                <th className="px-4 py-4 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">Pengiriman</th>
                <th className="px-4 py-4 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">Resi</th>
                <th className="px-4 py-4 text-right text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 bg-white">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="transition hover:bg-[#fbfaf8]">
                  <td className="px-4 py-5"><input className="h-4 w-4 rounded border-stone-300 text-[#8f3d5b] focus:ring-[#8f3d5b]" type="checkbox" checked={selectedIds.includes(order.id)} onChange={() => toggleSelected(order.id)} /></td>
                  <td className="px-4 py-5 align-top">
                    <p className="truncate font-bold text-slate-950">{order.order_code || `#${order.id}`}</p>
                    <p className="mt-1 text-xs text-stone-500">{formatOrderDate(order.created_at)}</p>
                  </td>
                  <td className="px-4 py-5 align-top text-sm font-semibold text-slate-900">
                    <p className="truncate">{order.user?.name || "Guest"}</p>
                    <p className="mt-1 truncate text-xs font-normal text-stone-500">{order.user?.email || "Customer"}</p>
                  </td>
                  <td className="group relative px-4 py-5 align-top">
                    <button
                      type="button"
                      className="flex w-full items-start justify-between gap-3 rounded-2xl px-2 py-2 text-left hover:bg-stone-50"
                    >
                      <span className="min-w-0">
                        <span className="block font-bold text-slate-950">{order.items?.length || 0} produk</span>
                        <span className="mt-2 flex items-center -space-x-1">
                          {order.items?.slice(0, 4).map((item) => (
                            <span key={item.id}>{renderProductThumb(item)}</span>
                          ))}
                          {(order.items?.length || 0) > 4 ? (
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white bg-stone-200 text-xs font-bold text-stone-600 shadow-sm">
                              +{(order.items?.length || 0) - 4}
                            </span>
                          ) : null}
                        </span>
                      </span>
                      <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-stone-400 transition group-hover:rotate-180" />
                    </button>
                    <div className="pointer-events-none absolute left-0 top-[calc(100%-4px)] z-50 hidden w-[420px] rounded-2xl border border-stone-200 bg-white p-4 shadow-2xl shadow-slate-900/20 group-hover:block">
                      <p className="mb-3 text-lg font-bold text-slate-950">{order.items?.length || 0} produk</p>
                      <div className="max-h-96 space-y-3 overflow-y-auto">
                        {order.items?.map((item) => (
                          <div key={item.id} className="grid grid-cols-[44px_1fr_auto] gap-3">
                            {renderProductThumb(item, "h-11 w-11")}
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold text-slate-950">{item.product_name || "Produk"}</span>
                              <span className="mt-1 block text-xs font-bold uppercase text-[#8f3d5b]">{item.variant_name || "Tanpa warna"}</span>
                              <span className="mt-1 inline-block max-w-full truncate rounded-lg bg-stone-100 px-2 py-1 text-[11px] text-stone-500">
                                SKU Penjual: {item.product_name || "Produk"}
                              </span>
                            </span>
                            <span className="pt-1 text-sm font-bold text-slate-950">x {item.quantity}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-5 align-top">
                    <p className="font-bold text-slate-950">{getStatusLabel(order.order_status)}</p>
                    <span className={`mt-2 inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getPaymentColor(order.payment?.payment_status)}`}>{order.payment?.payment_status || "belum upload"}</span>
                  </td>
                  <td className="px-4 py-5 align-top text-sm text-slate-700">
                    <p className="font-semibold text-slate-900">Dikirim melalui platform</p>
                    <p className="mt-1 truncate text-xs text-stone-500">{order.shipping?.courier || bulkCourier}, {trackingDrafts[order.id] || order.shipping?.tracking_number || "Resi belum tersedia"}</p>
                  </td>
                  <td className="px-4 py-5 align-top">
                    <p className="font-semibold text-slate-900">Pengiriman Standar</p>
                    <input
                      value={trackingDrafts[order.id] || ""}
                      onChange={(event) => setTrackingDrafts((current) => ({ ...current, [order.id]: event.target.value }))}
                      className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2 text-xs focus:border-[#8f3d5b] focus:outline-none focus:ring-2 focus:ring-[#8f3d5b]/15"
                      placeholder="Nomor resi"
                    />
                  </td>
                  <td className="px-4 py-5 align-top">
                    <p className="text-right font-bold text-slate-950">{formatRupiah(order.total_price)}</p>
                    <div className="mt-3 flex justify-end">
                      <button type="button" onClick={() => printShippingLabels([order])} className="min-w-0 rounded-l-xl bg-[#8f3d5b] px-3 py-2 text-xs font-bold text-white hover:bg-[#78304b]">
                        Cetak
                      </button>
                      <select
                        value=""
                        onChange={(event) => {
                          handleRowAction(order, event.target.value);
                          event.target.value = "";
                        }}
                        className="w-9 rounded-r-xl border border-l-0 border-[#78304b] bg-[#8f3d5b] text-xs font-bold text-white focus:outline-none"
                        aria-label="Aksi pesanan"
                      >
                        <option value="">...</option>
                        <option value="detail">Lihat detail logistik</option>
                        <option value="ship">Kirim pesanan</option>
                        <option value="chat">Hubungi pembeli</option>
                        <option value="print">Cetak resi</option>
                        <option value="delete">Batalkan/Hapus</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {filteredOrders.length === 0 && <div className="py-12 text-center"><p className="text-gray-500">Tidak ada pesanan.</p></div>}

      <Modal open={isDetailOpen} title="Order details" onClose={() => setIsDetailOpen(false)}>
        {detailLoading || !selectedOrder ? (
          <div className="flex items-center justify-center py-10">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#8f3d5b]"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-stone-50 p-4">
                <p className="text-sm text-stone-500">Order</p>
                <p className="text-lg font-semibold text-slate-900">{selectedOrder.order_code || `#${selectedOrder.id}`}</p>
              </div>
              <div className="rounded-2xl bg-stone-50 p-4">
                <p className="text-sm text-stone-500">Customer</p>
                <p className="text-lg font-semibold text-slate-900">{selectedOrder.user?.name || "Guest"}</p>
                <p className="text-sm text-stone-500">{selectedOrder.user?.email || "No email"}</p>
              </div>
            </div>

            <div className="rounded-2xl bg-stone-50 p-4">
              <p className="text-sm text-stone-500">Status Pesanan</p>
              <select value={selectedOrder.order_status} onChange={(event) => updateStatus(selectedOrder.id, event.target.value)} className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-2 focus:border-[#8f3d5b] focus:outline-none focus:ring-2 focus:ring-[#8f3d5b]/15">
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processed">Processed</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => updateStatus(selectedOrder.id, "processed")} className="rounded-xl bg-[#b9895e] px-3 py-2 text-sm font-semibold text-white hover:bg-[#9f714b]">Proses</button>
                <button type="button" onClick={() => updateStatus(selectedOrder.id, "shipped", { courier: selectedOrder.shipping?.courier || bulkCourier, tracking_number: trackingDrafts[selectedOrder.id] || selectedOrder.shipping?.tracking_number || "" })} className="rounded-xl bg-[#8f3d5b] px-3 py-2 text-sm font-semibold text-white hover:bg-[#78304b]">Kirim</button>
                <button type="button" onClick={() => printShippingLabels([selectedOrder])} className="rounded-xl border border-stone-300 px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-white">Cetak Resi</button>
                <button type="button" onClick={() => chatBuyer(selectedOrder)} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Chat Pembeli</button>
                <button type="button" onClick={() => updateStatus(selectedOrder.id, "delivered")} className="rounded-xl bg-emerald-700 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-800">Selesai</button>
                <button type="button" onClick={() => updateStatus(selectedOrder.id, "cancelled")} className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white">Batalkan</button>
              </div>
            </div>

            <div className="rounded-2xl bg-stone-50 p-4">
              <p className="text-sm text-stone-500">Resi Pengiriman</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <input
                  defaultValue={selectedOrder.shipping?.courier || bulkCourier}
                  onChange={(event) => setSelectedOrder({ ...selectedOrder, shipping: { ...selectedOrder.shipping, courier: event.target.value } })}
                  className="rounded-xl border border-stone-300 px-4 py-2 focus:border-[#8f3d5b] focus:outline-none focus:ring-2 focus:ring-[#8f3d5b]/15"
                  placeholder="Kurir"
                />
                <input
                  value={trackingDrafts[selectedOrder.id] || selectedOrder.shipping?.tracking_number || ""}
                  onChange={(event) => setTrackingDrafts((current) => ({ ...current, [selectedOrder.id]: event.target.value }))}
                  className="rounded-xl border border-stone-300 px-4 py-2 focus:border-[#8f3d5b] focus:outline-none focus:ring-2 focus:ring-[#8f3d5b]/15"
                  placeholder="Nomor resi"
                />
              </div>
              <button
                type="button"
                onClick={() => updateStatus(selectedOrder.id, selectedOrder.order_status, { courier: selectedOrder.shipping?.courier || bulkCourier, tracking_number: trackingDrafts[selectedOrder.id] || "" })}
                className="mt-3 rounded-xl bg-[#8f3d5b] px-3 py-2 text-sm font-semibold text-white hover:bg-[#78304b]"
              >
                Simpan Resi
              </button>
            </div>

            <div className="rounded-2xl bg-stone-50 p-4">
              <p className="text-sm text-stone-500">Pembayaran</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getPaymentColor(selectedOrder.payment?.payment_status)}`}>{selectedOrder.payment?.payment_status || "belum upload"}</span>
                {selectedOrder.payment?.payment_proof && <a href={selectedOrder.payment.payment_proof} target="_blank" rel="noreferrer" className="text-sm font-semibold text-[#8f3d5b]">Lihat bukti pembayaran</a>}
              </div>
              {selectedOrder.payment ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={() => updatePaymentStatus(selectedOrder.id, "verified")} className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700">Verifikasi</button>
                  <button type="button" onClick={() => updatePaymentStatus(selectedOrder.id, "rejected")} className="rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700">Tolak</button>
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl bg-stone-50 p-4">
              <p className="text-sm text-stone-500">Alamat Pengiriman</p>
              {selectedOrder.address ? (
                <div className="mt-2 text-stone-700">
                  <p className="font-semibold text-slate-950">{selectedOrder.address.receiver_name}</p>
                  <p>{selectedOrder.address.receiver_phone}</p>
                  <p>{selectedOrder.address.full_address}, {selectedOrder.address.city} {selectedOrder.address.postal_code}</p>
                </div>
              ) : <p className="mt-2 text-stone-500">Alamat tidak tersedia.</p>}
            </div>

            <div className="rounded-2xl bg-stone-50 p-4">
              <p className="text-sm text-stone-500">Items</p>
              <div className="mt-4 space-y-3">
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-100">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-medium text-slate-900">{item.product?.name || item.product_name || "Product"}</p>
                        <p className="text-sm text-slate-500">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-slate-900">{formatRupiah(item.price)}</p>
                        {item.product_id ? (
                          <button
                            type="button"
                            onClick={() => chatBuyer(selectedOrder, item.product_id, item.product_name || item.product?.name)}
                            className="mt-2 inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            Chat produk
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={Boolean(chatTarget)} title="Tulis Chat Pembeli" onClose={() => setChatTarget(null)}>
        <div className="space-y-4">
          <div className="rounded-2xl bg-stone-50 p-4">
            <p className="text-sm font-semibold text-slate-950">{chatTarget?.order.order_code || `#${chatTarget?.order.id}`}</p>
            <p className="mt-1 text-sm text-stone-600">
              {chatTarget?.productName ? `Produk yang dipin: ${chatTarget.productName}` : "Chat terkait pesanan ini."}
            </p>
          </div>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Pesan untuk customer</span>
            <textarea
              value={chatMessage}
              onChange={(event) => setChatMessage(event.target.value)}
              rows={6}
              className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-slate-900 focus:border-[#8f3d5b] focus:outline-none focus:ring-2 focus:ring-[#8f3d5b]/15"
              placeholder="Tulis pesan yang ingin disampaikan..."
            />
          </label>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setChatTarget(null)} className="rounded-xl border border-stone-300 px-4 py-2 text-stone-700 hover:bg-stone-100">
              Batal
            </button>
            <button
              type="button"
              onClick={sendChatToBuyer}
              disabled={sendingChat || !chatMessage.trim()}
              className="rounded-xl bg-[#8f3d5b] px-4 py-2 font-semibold text-white hover:bg-[#78304b] disabled:cursor-not-allowed disabled:bg-stone-400"
            >
              {sendingChat ? "Mengirim..." : "Kirim Chat"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
