import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { MessageCircle, Package, Send, X } from "lucide-react";
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

export default function FloatingChatButton() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isCustomer, user } = useAuth();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [pinnedProduct, setPinnedProduct] = useState<PinnedProduct | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const fetchThread = async () => {
    if (!isAuthenticated || !isCustomer) return;

    setLoading(true);
    try {
      const res = await API.get("/chat");
      setThread(res.data?.data as ChatThread);
      setUnreadCount(0);
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, "Chat belum bisa dimuat."));
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    if (!open || !productId || !isAuthenticated || !isCustomer) {
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
  }, [isAuthenticated, isCustomer, open, productId]);

  const openWidget = () => {
    if (!isAuthenticated || !isCustomer) {
      navigate(`/login?redirect=${encodeURIComponent(chatHref)}`);
      return;
    }

    setOpen(true);
    fetchThread();
  };

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;

    setSending(true);
    try {
      const res = await API.post("/chat/messages", {
        message: trimmed,
        product_id: pinnedProduct?.id ?? null,
      });
      setThread(res.data?.data as ChatThread);
      setMessage("");
      setPinnedProduct(null);
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, "Pesan gagal dikirim."));
    } finally {
      setSending(false);
    }
  };

  if (!shouldShow) return null;

  return (
    <>
      {open && isAuthenticated && isCustomer ? (
        <section className="fixed bottom-4 right-4 z-50 w-[min(calc(100vw-2rem),340px)] overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl shadow-stone-950/20 sm:bottom-5 sm:right-5 sm:w-[360px]">
          <header className="flex items-center justify-between border-b border-stone-100 bg-[#8f3d5b] px-3.5 py-3 text-white sm:px-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
                <MessageCircle className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold">Chat Aurevina</p>
                <p className="truncate text-xs text-rose-100">Masuk sebagai {user?.name}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1.5 text-white/90 hover:bg-white/15"
              aria-label="Tutup chat"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          {error ? <div className="mx-3 mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div> : null}

          <div className="h-[320px] space-y-3 overflow-y-auto bg-[#fbf7f2] p-3 sm:h-[390px]">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-stone-500">Memuat chat...</div>
            ) : thread?.messages.length ? (
              thread.messages.map((item) => {
                const mine = item.sender?.role === "customer";
                return (
                  <div key={item.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[84%] rounded-2xl px-3 py-2 shadow-sm ${mine ? "bg-white text-stone-800" : "bg-[#8f3d5b] text-white"}`}>
                      {item.product ? (
                        <Link
                          to={`/products/${item.product.id}`}
                          onClick={() => setOpen(false)}
                          className={`mb-2 flex gap-2 rounded-xl border p-2 text-left ${
                            mine ? "border-stone-200 bg-[#fbf7f2]" : "border-white/20 bg-white/10"
                          }`}
                        >
                          <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/20">
                            {item.product.main_image ? (
                              <img src={item.product.main_image} alt={item.product.product_name} className="h-full w-full object-cover" />
                            ) : (
                              <Package className="h-5 w-5" />
                            )}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-xs font-bold">{item.product.product_name}</span>
                            <span className={`text-[11px] ${mine ? "text-stone-500" : "text-rose-100"}`}>
                              Rp {Number(item.product.base_price).toLocaleString("id-ID")}
                            </span>
                          </span>
                        </Link>
                      ) : null}
                      <p className="text-sm leading-5">{item.message}</p>
                      <p className={`mt-1 text-[10px] ${mine ? "text-stone-400" : "text-rose-100"}`}>
                        {new Date(item.created_at).toLocaleString("id-ID", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex h-full items-center justify-center px-8 text-center text-sm text-stone-500">
                Selamat datang di chat Aurevina. Tanyakan stok, warna, bahan, atau pesananmu di sini.
              </div>
            )}
          </div>

          {pinnedProduct ? (
            <div className="border-t border-stone-100 bg-white px-3 pt-3">
              <div className="flex items-center gap-2 rounded-xl border border-[#ead2b8] bg-[#fbf7f2] p-2">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
                  {pinnedProduct.main_image ? (
                    <img src={pinnedProduct.main_image} alt={pinnedProduct.product_name} className="h-full w-full object-cover" />
                  ) : (
                    <Package className="h-5 w-5 text-stone-400" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#b9895e]">Produk</p>
                  <p className="truncate text-xs font-bold text-stone-950">{pinnedProduct.product_name}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setPinnedProduct(null)}
                  className="rounded-full p-1.5 text-stone-500 hover:bg-white hover:text-stone-950"
                  aria-label="Hapus pin produk"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : null}

          <form onSubmit={sendMessage} className="flex gap-2 border-t border-stone-100 bg-white p-3">
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={pinnedProduct ? "Tanyakan produk ini..." : "Tulis pesan..."}
              className="min-w-0 flex-1 rounded-full border border-stone-200 px-4 py-2.5 text-sm focus:border-[#8f3d5b] focus:outline-none focus:ring-2 focus:ring-rose-100"
            />
            <button
              type="submit"
              disabled={sending || !message.trim()}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#8f3d5b] text-white hover:bg-[#76304a] disabled:cursor-not-allowed disabled:bg-stone-300"
              aria-label="Kirim pesan"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </section>
      ) : null}

      {!open ? (
        <button
          type="button"
          onClick={openWidget}
          className="fixed bottom-4 right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-[#8f3d5b] text-white shadow-2xl shadow-rose-950/25 transition hover:-translate-y-0.5 hover:bg-[#76304a] focus:outline-none focus:ring-4 focus:ring-rose-200 sm:bottom-5 sm:right-5 sm:h-14 sm:w-14"
          aria-label="Chat dengan Aurevina"
        >
          <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#d15f73] px-1 text-[10px] font-bold text-white ring-2 ring-white sm:h-6 sm:min-w-6 sm:px-1.5 sm:text-xs">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </button>
      ) : null}
    </>
  );
}
