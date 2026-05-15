import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle, Package, Star } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import API, { extractApiList, getApiErrorMessage, resolveAssetUrl } from "../services/api";
import { useAuth } from "../context/useAuth";

interface OrderItem {
  id: number;
  product_id: number;
  product_name: string;
  variant_name?: string | null;
  product_image?: string | null;
  quantity: number;
  subtotal: number;
}

interface Order {
  id: number;
  order_code: string;
  total_price: number;
  order_status: string;
  created_at: string;
  payment?: {
    payment_status: string;
    payment_proof?: string | null;
  } | null;
  shipping?: {
    courier?: string | null;
    tracking_number?: string | null;
    shipping_status?: string | null;
  } | null;
  items?: OrderItem[];
}

const statusSteps = ["pending", "confirmed", "processed", "shipped", "delivered"];

const statusLabel: Record<string, string> = {
  pending: "Menunggu",
  confirmed: "Dikonfirmasi",
  processed: "Diproses",
  shipped: "Dikirim",
  delivered: "Selesai",
  cancelled: "Dibatalkan",
};

export default function CustomerOrdersPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isCustomer } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [reviewDrafts, setReviewDrafts] = useState<Record<number, { rating: number; review: string; submitting?: boolean; sent?: boolean }>>({});
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await API.get("/orders");
      setOrders(extractApiList<Order>(res.data));
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, "Tidak dapat memuat pesanan."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !isCustomer) {
      navigate("/login?redirect=/orders", { replace: true });
      return;
    }
    fetchOrders();
  }, [isAuthenticated, isCustomer, navigate]);

  const updateCustomerOrder = async (orderId: number, action: "cancel" | "complete") => {
    if (action === "cancel" && !confirm("Batalkan pesanan ini?")) return;
    if (action === "complete" && !confirm("Tandai pesanan sudah diterima?")) return;

    setActionLoadingId(orderId);
    setError(null);
    try {
      await API.patch(`/orders/${orderId}/${action}`);
      await fetchOrders();
    } catch (err) {
      setError(getApiErrorMessage(err, "Status pesanan gagal diperbarui."));
    } finally {
      setActionLoadingId(null);
    }
  };

  const stepIndex = (status: string) => statusSteps.indexOf(status);
  const productInitial = (name?: string) => (name || "P").charAt(0).toUpperCase();

  const updateReviewDraft = (itemId: number, data: Partial<{ rating: number; review: string; submitting: boolean; sent: boolean }>) => {
    setReviewDrafts((current) => {
      const existing = current[itemId] ?? { rating: 5, review: "" };

      return {
        ...current,
        [itemId]: {
          ...existing,
          ...data,
        },
      };
    });
  };

  const submitReview = async (item: OrderItem) => {
    const draft = reviewDrafts[item.id] ?? { rating: 5, review: "" };
    if (!draft.review.trim()) {
      setError("Tulis ulasan terlebih dahulu.");
      return;
    }

    updateReviewDraft(item.id, { submitting: true });
    setError(null);
    try {
      await API.post("/reviews", {
        product_id: item.product_id,
        order_item_id: item.id,
        rating: draft.rating,
        review: draft.review.trim(),
      });
      updateReviewDraft(item.id, { submitting: false, sent: true, review: "" });
    } catch (err) {
      setError(getApiErrorMessage(err, "Ulasan gagal dikirim."));
      updateReviewDraft(item.id, { submitting: false });
    }
  };

  if (!isAuthenticated || !isCustomer) return null;

  return (
    <div className="min-h-screen bg-[#fbf7f2]">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#8f3d5b] hover:text-[#76304a]"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Pesanan Saya</h1>
          <p className="mt-2 text-slate-600">Pantau pembayaran, pengiriman, resi, dan konfirmasi pesanan sampai.</p>
        </div>

        {error && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#8f3d5b]" />
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <Package className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <p className="font-semibold text-slate-900">Belum ada pesanan.</p>
            <Link to="/products" className="mt-4 inline-flex rounded-xl bg-[#8f3d5b] px-5 py-3 font-semibold text-white">
              Belanja Sekarang
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            {orders.map((order) => {
              const currentStep = stepIndex(order.order_status);
              const paymentStatus = order.payment?.payment_status || "belum upload";

              return (
                <article key={order.id} className="rounded-[24px] border border-white/80 bg-white p-6 shadow-xl shadow-stone-900/5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm text-slate-500">{new Date(order.created_at).toLocaleDateString("id-ID")}</p>
                      <h2 className="mt-1 text-xl font-bold text-slate-900">{order.order_code}</h2>
                      <p className="mt-1 text-sm text-slate-600">Total Rp {Number(order.total_price).toLocaleString("id-ID")}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-[#8f3d5b]">
                        {statusLabel[order.order_status] || order.order_status}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                        Pembayaran: {paymentStatus}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-3 sm:grid-cols-5">
                    {statusSteps.map((step, index) => (
                      <div key={step} className={`rounded-xl border p-3 text-center text-xs font-semibold ${
                        currentStep >= index ? "border-[#d9a66f] bg-rose-50 text-[#8f3d5b]" : "border-slate-200 bg-slate-50 text-slate-400"
                      }`}>
                        {statusLabel[step]}
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 space-y-3">
                    {order.items?.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-stone-100 bg-slate-50 p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex min-w-0 items-start gap-4">
                            <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#f4e5dd] text-lg font-bold text-[#8f3d5b] ring-1 ring-stone-200">
                              <span>{productInitial(item.product_name)}</span>
                              {resolveAssetUrl(item.product_image) ? (
                                <img
                                  src={resolveAssetUrl(item.product_image)}
                                  alt={item.product_name}
                                  className="absolute inset-0 h-full w-full object-cover"
                                  onError={(event) => {
                                    event.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : null}
                            </div>
                            <div className="min-w-0">
                              <p className="line-clamp-2 font-semibold text-slate-900">{item.product_name}</p>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#8f3d5b] ring-1 ring-[#f4e5dd]">
                                  {item.variant_name || "Tanpa varian"}
                                </span>
                                <span className="text-sm text-slate-500">x{item.quantity}</span>
                              </div>
                            </div>
                          </div>
                          <p className="shrink-0 text-right font-semibold text-slate-900">Rp {Number(item.subtotal).toLocaleString("id-ID")}</p>
                        </div>
                        {order.order_status === "delivered" ? (
                          <div className="mt-4 rounded-2xl border border-stone-200 bg-white p-4">
                            {reviewDrafts[item.id]?.sent ? (
                              <p className="text-sm font-semibold text-green-700">Terima kasih, ulasan produk ini sudah dikirim.</p>
                            ) : (
                              <>
                                <p className="text-sm font-bold text-slate-900">Beri rating dan ulasan</p>
                                <div className="mt-3 flex gap-1">
                                  {[1, 2, 3, 4, 5].map((value) => (
                                    <button
                                      key={value}
                                      type="button"
                                      onClick={() => updateReviewDraft(item.id, { rating: value })}
                                      aria-label={`${value} bintang`}
                                    >
                                      <Star className={`h-6 w-6 ${value <= (reviewDrafts[item.id]?.rating ?? 5) ? "fill-yellow-400 text-yellow-400" : "text-stone-300"}`} />
                                    </button>
                                  ))}
                                </div>
                                <textarea
                                  value={reviewDrafts[item.id]?.review ?? ""}
                                  onChange={(event) => updateReviewDraft(item.id, { review: event.target.value })}
                                  rows={3}
                                  className="mt-3 w-full rounded-xl border border-stone-300 px-4 py-3 text-sm focus:border-[#8f3d5b] focus:outline-none focus:ring-2 focus:ring-rose-100"
                                  placeholder="Ceritakan kualitas produk, warna, dan pengalaman belanja..."
                                />
                                <button
                                  type="button"
                                  onClick={() => submitReview(item)}
                                  disabled={reviewDrafts[item.id]?.submitting}
                                  className="mt-3 rounded-xl bg-[#8f3d5b] px-4 py-2 text-sm font-bold text-white hover:bg-[#76304a] disabled:opacity-60"
                                >
                                  {reviewDrafts[item.id]?.submitting ? "Mengirim..." : "Kirim Ulasan"}
                                </button>
                              </>
                            )}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 rounded-xl border border-stone-200 bg-[#fbf7f2] p-4">
                    <p className="font-semibold text-slate-900">Pengiriman</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {order.shipping?.courier || "Kurir belum diisi"} - {order.shipping?.tracking_number ? `Resi ${order.shipping.tracking_number}` : "Resi belum tersedia"}
                    </p>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    {["pending", "confirmed"].includes(order.order_status) ? (
                      <button
                        type="button"
                        onClick={() => updateCustomerOrder(order.id, "cancel")}
                        disabled={actionLoadingId === order.id}
                        className="rounded-xl border border-red-200 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-60"
                      >
                        Batalkan Pesanan
                      </button>
                    ) : null}
                    {order.order_status === "shipped" ? (
                      <button
                        type="button"
                        onClick={() => updateCustomerOrder(order.id, "complete")}
                        disabled={actionLoadingId === order.id}
                        className="rounded-xl bg-green-600 px-4 py-3 text-sm font-bold text-white hover:bg-green-700 disabled:opacity-60"
                      >
                        Pesanan Selesai
                      </button>
                    ) : null}
                    <Link to={`/chat?order_id=${order.id}`} className="inline-flex items-center gap-2 rounded-xl bg-[#8f3d5b] px-4 py-3 text-sm font-bold text-white hover:bg-[#76304a]">
                      <MessageCircle className="h-4 w-4" />
                      Chat Pesanan Ini
                    </Link>
                    {order.payment?.payment_proof ? (
                      <a href={order.payment.payment_proof} target="_blank" rel="noreferrer" className="inline-flex items-center rounded-xl border border-[#8f3d5b] px-4 py-3 text-sm font-bold text-[#8f3d5b] hover:bg-rose-50">
                        Lihat Bukti Bayar
                      </a>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
