import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { MessageCircle, Package, Send, X } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import API, { getApiErrorMessage } from "../services/api";
import { useAuth } from "../context/useAuth";

interface ChatMessage {
  id: number;
  message: string;
  created_at: string;
  sender?: {
    id: number;
    name: string;
    role: "admin" | "customer";
  };
  product?: PinnedProduct | null;
  order?: PinnedOrder | null;
}

interface ChatThread {
  id: number;
  messages: ChatMessage[];
}

interface PinnedProduct {
  id: number;
  product_name: string;
  base_price: number;
  main_image?: string | null;
}

interface PinnedOrder {
  id: number;
  order_code: string;
  order_status: string;
  total_price: number;
}

export default function ChatPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, isCustomer, user } = useAuth();
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [pinnedProduct, setPinnedProduct] = useState<PinnedProduct | null>(null);
  const [pinnedOrder, setPinnedOrder] = useState<PinnedOrder | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchThread = async () => {
    try {
      const res = await API.get("/chat");
      setThread(res.data?.data as ChatThread);
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, "Chat belum bisa dimuat."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !isCustomer) {
      navigate("/login?redirect=/chat", { replace: true });
      return;
    }

    fetchThread();
  }, [isAuthenticated, isCustomer, navigate]);

  useEffect(() => {
    const productId = searchParams.get("product_id");
    if (!productId || !isAuthenticated || !isCustomer) {
      setPinnedProduct(null);
      return;
    }

    let active = true;

    const fetchPinnedProduct = async () => {
      try {
        const res = await API.get(`/products/${productId}`);
        if (active) {
          setPinnedProduct(res.data?.data as PinnedProduct);
        }
      } catch {
        if (active) {
          setPinnedProduct(null);
        }
      }
    };

    fetchPinnedProduct();

    return () => {
      active = false;
    };
  }, [isAuthenticated, isCustomer, searchParams]);

  useEffect(() => {
    const orderId = searchParams.get("order_id");
    if (!orderId || !isAuthenticated || !isCustomer) {
      setPinnedOrder(null);
      return;
    }

    let active = true;

    const fetchPinnedOrder = async () => {
      try {
        const res = await API.get(`/orders/${orderId}`);
        if (active) {
          setPinnedOrder(res.data?.data as PinnedOrder);
        }
      } catch {
        if (active) {
          setPinnedOrder(null);
        }
      }
    };

    fetchPinnedOrder();

    return () => {
      active = false;
    };
  }, [isAuthenticated, isCustomer, searchParams]);

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;

    setSending(true);
    try {
      const res = await API.post("/chat/messages", {
        message: trimmed,
        product_id: pinnedProduct?.id ?? null,
        order_id: pinnedOrder?.id ?? null,
      });
      setThread(res.data?.data as ChatThread);
      setMessage("");
      setPinnedProduct(null);
      setPinnedOrder(null);
      setSearchParams({});
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, "Pesan gagal dikirim."));
    } finally {
      setSending(false);
    }
  };

  if (!isAuthenticated || !isCustomer) return null;

  const removePinnedProduct = () => {
    setPinnedProduct(null);
    setPinnedOrder(null);
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-[#fbf7f2]">
      <Navbar />
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#b9895e]">Bantuan</p>
            <h1 className="mt-2 text-3xl font-bold text-stone-950">Chat dengan Aurevina</h1>
            <p className="mt-2 text-stone-600">Tanyakan stok, pesanan, pembayaran, atau rekomendasi warna favorit.</p>
          </div>
          <Link to="/orders" className="text-sm font-semibold text-[#8f3d5b] hover:text-[#76304a]">
            Lihat pesanan
          </Link>
        </div>

        <section className="overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-xl shadow-stone-900/5">
          <div className="border-b border-stone-100 bg-stone-950 px-6 py-5 text-white">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#8f3d5b]">
                <MessageCircle className="h-5 w-5" />
              </span>
              <div>
                <p className="font-bold">Customer Care</p>
                <p className="text-sm text-stone-300">Masuk sebagai {user?.name}</p>
              </div>
            </div>
          </div>

          {error ? <div className="mx-6 mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

          <div className="h-[52vh] space-y-4 overflow-y-auto bg-[#fbf7f2] p-5">
            {loading ? (
              <div className="flex h-full items-center justify-center text-stone-500">Memuat chat...</div>
            ) : thread?.messages.length ? (
              thread.messages.map((item) => {
                const mine = item.sender?.role === "customer";
                return (
                  <div key={item.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[78%] rounded-2xl px-4 py-3 shadow-sm ${mine ? "bg-[#8f3d5b] text-white" : "bg-white text-stone-800"}`}>
                      {item.product ? (
                        <Link
                          to={`/products/${item.product.id}`}
                          className={`mb-3 flex gap-3 rounded-xl border p-2 text-left ${
                            mine ? "border-white/20 bg-white/10" : "border-stone-200 bg-[#fbf7f2]"
                          }`}
                        >
                          <span className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/20">
                            {item.product.main_image ? (
                              <img src={item.product.main_image} alt={item.product.product_name} className="h-full w-full object-cover" />
                            ) : (
                              <Package className="h-5 w-5" />
                            )}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-bold">{item.product.product_name}</span>
                            <span className={`text-xs ${mine ? "text-rose-100" : "text-stone-500"}`}>
                              Rp {Number(item.product.base_price).toLocaleString("id-ID")}
                            </span>
                          </span>
                        </Link>
                      ) : null}
                      {item.order ? (
                        <Link
                          to="/orders"
                          className={`mb-3 block rounded-xl border p-3 text-left ${
                            mine ? "border-white/20 bg-white/10" : "border-stone-200 bg-[#fbf7f2]"
                          }`}
                        >
                          <span className="block text-xs font-semibold uppercase tracking-[0.18em] opacity-75">Pesanan</span>
                          <span className="mt-1 block font-bold">{item.order.order_code}</span>
                          <span className={`text-xs ${mine ? "text-rose-100" : "text-stone-500"}`}>
                            {item.order.order_status} - Rp {Number(item.order.total_price).toLocaleString("id-ID")}
                          </span>
                        </Link>
                      ) : null}
                      <p className="text-sm leading-6">{item.message}</p>
                      <p className={`mt-2 text-[11px] ${mine ? "text-rose-100" : "text-stone-400"}`}>
                        {new Date(item.created_at).toLocaleString("id-ID")}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex h-full items-center justify-center text-center text-stone-500">
                Belum ada pesan. Mulai percakapan kapan saja.
              </div>
            )}
          </div>

          {pinnedProduct ? (
            <div className="border-t border-stone-100 bg-white px-4 pt-4">
              <div className="flex items-center gap-3 rounded-2xl border border-[#ead2b8] bg-[#fbf7f2] p-3">
                <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white">
                  {pinnedProduct.main_image ? (
                    <img src={pinnedProduct.main_image} alt={pinnedProduct.product_name} className="h-full w-full object-cover" />
                  ) : (
                    <Package className="h-6 w-6 text-stone-400" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b9895e]">Produk yang ditanyakan</p>
                  <p className="truncate font-bold text-stone-950">{pinnedProduct.product_name}</p>
                  <p className="text-sm text-stone-600">Rp {Number(pinnedProduct.base_price).toLocaleString("id-ID")}</p>
                </div>
                <button
                  type="button"
                  onClick={removePinnedProduct}
                  className="rounded-full p-2 text-stone-500 hover:bg-white hover:text-stone-950"
                  aria-label="Hapus pin produk"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}

          {pinnedOrder ? (
            <div className="border-t border-stone-100 bg-white px-4 pt-4">
              <div className="flex items-center gap-3 rounded-2xl border border-[#ead2b8] bg-[#fbf7f2] p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#b9895e]">Pesanan yang ditanyakan</p>
                  <p className="truncate font-bold text-stone-950">{pinnedOrder.order_code}</p>
                  <p className="text-sm text-stone-600">{pinnedOrder.order_status} - Rp {Number(pinnedOrder.total_price).toLocaleString("id-ID")}</p>
                </div>
                <button
                  type="button"
                  onClick={removePinnedProduct}
                  className="rounded-full p-2 text-stone-500 hover:bg-white hover:text-stone-950"
                  aria-label="Hapus pin pesanan"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}

          <form onSubmit={sendMessage} className="flex gap-3 border-t border-stone-100 bg-white p-4">
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={pinnedProduct ? "Tanyakan stok, warna, bahan, atau detail produk..." : pinnedOrder ? "Tanyakan pembayaran, resi, atau status pesanan..." : "Tulis pesan..."}
              className="min-w-0 flex-1 rounded-full border border-stone-200 px-5 py-3 focus:border-[#8f3d5b] focus:outline-none focus:ring-2 focus:ring-rose-100"
            />
            <button
              type="submit"
              disabled={sending || !message.trim()}
              className="inline-flex items-center gap-2 rounded-full bg-[#8f3d5b] px-5 py-3 font-semibold text-white hover:bg-[#76304a] disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              <Send className="h-4 w-4" />
              Kirim
            </button>
          </form>
        </section>
      </main>
      <Footer />
    </div>
  );
}
