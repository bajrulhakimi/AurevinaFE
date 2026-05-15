import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Mail, MessageCircle, Package, Send } from "lucide-react";
import API, { getApiErrorMessage } from "../services/api";
import ContactMessages from "./ContactMessages";

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

interface ChatThreadSummary {
  id: number;
  updated_at: string;
  customer?: {
    name: string;
    email: string;
  };
  latest_message?: {
    message: string;
    created_at: string;
    sender?: { role: string };
    product?: PinnedProduct | null;
    order?: PinnedOrder | null;
  } | null;
  unread_count?: number;
}

interface ChatThread extends ChatThreadSummary {
  messages: ChatMessage[];
}

export default function AdminChats() {
  const [activeTab, setActiveTab] = useState<"chat" | "messages">("chat");
  const [threads, setThreads] = useState<ChatThreadSummary[]>([]);
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchThread = useCallback(async (threadId: number) => {
    try {
      const res = await API.get(`/admin/chats/${threadId}`);
      setSelectedThread(res.data?.data as ChatThread);
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, "Detail chat tidak dapat dimuat."));
    }
  }, []);

  const fetchThreads = useCallback(async () => {
    try {
      const res = await API.get("/admin/chats");
      const nextThreads = (res.data?.data || []) as ChatThreadSummary[];
      setThreads(nextThreads);
      if (!selectedThread && nextThreads[0]) {
        await fetchThread(nextThreads[0].id);
      }
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, "Daftar chat tidak dapat dimuat."));
    } finally {
      setLoading(false);
    }
  }, [fetchThread, selectedThread]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedThread || !message.trim()) return;

    setSending(true);
    try {
      const res = await API.post(`/admin/chats/${selectedThread.id}/messages`, { message: message.trim() });
      setSelectedThread(res.data?.data as ChatThread);
      setMessage("");
      await fetchThreads();
    } catch (err) {
      setError(getApiErrorMessage(err, "Balasan chat gagal dikirim."));
    } finally {
      setSending(false);
    }
  };

  const unreadTotal = threads.reduce((total, thread) => total + Number(thread.unread_count || 0), 0);

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-white bg-[#15110f] p-6 text-white shadow-xl shadow-stone-300/40">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#d9b17c]">Customer Care</p>
            <h2 className="mt-2 text-3xl font-bold">Chat & Subscribe</h2>
            <p className="mt-2 max-w-2xl text-sm text-stone-300">Balas chat customer, pantau pesan yang belum dibaca, dan kelola email pelanggan yang subscribe promo.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
              <p className="text-2xl font-bold">{threads.length}</p>
              <p className="text-xs text-stone-300">Percakapan</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
              <p className="text-2xl font-bold">{unreadTotal}</p>
              <p className="text-xs text-stone-300">Belum dibaca</p>
            </div>
            <div className="hidden rounded-2xl border border-white/10 bg-white/10 px-4 py-3 sm:block">
              <p className="text-2xl font-bold">CSV</p>
              <p className="text-xs text-stone-300">Export subscribe</p>
            </div>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2 rounded-2xl bg-white/10 p-2">
          <button
            type="button"
            onClick={() => setActiveTab("chat")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${activeTab === "chat" ? "bg-white text-[#171412]" : "text-stone-300 hover:bg-white/10 hover:text-white"}`}
          >
            <MessageCircle className="h-4 w-4" />
            Percakapan
            {unreadTotal > 0 ? <span className="rounded-full bg-[#8f3d5b] px-2 py-0.5 text-[11px] text-white">{unreadTotal}</span> : null}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("messages")}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${activeTab === "messages" ? "bg-white text-[#171412]" : "text-stone-300 hover:bg-white/10 hover:text-white"}`}
          >
            <Mail className="h-4 w-4" />
            Subscribe
          </button>
        </div>
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      {activeTab === "messages" ? (
        <ContactMessages compact />
      ) : (
      <section className="grid min-h-[680px] overflow-hidden rounded-[1.75rem] border border-white bg-white/95 shadow-sm shadow-stone-200/70 ring-1 ring-stone-200/70 lg:grid-cols-[360px_1fr]">
        <aside className="border-b border-stone-200 bg-[#fbfaf8] lg:border-b-0 lg:border-r">
          <div className="border-b border-stone-100 p-5">
            <h3 className="font-bold text-stone-950">Percakapan Customer</h3>
            <p className="mt-1 text-xs text-stone-500">{threads.length} thread customer</p>
          </div>
          <div className="max-h-[610px] overflow-y-auto p-3">
            {loading ? (
              <div className="p-5 text-sm text-stone-500">Memuat chat...</div>
            ) : threads.length === 0 ? (
              <div className="p-5 text-sm text-stone-500">Belum ada chat customer.</div>
            ) : (
              threads.map((thread) => (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => fetchThread(thread.id)}
                  className={`mb-2 block w-full rounded-2xl border p-4 text-left transition ${
                    selectedThread?.id === thread.id ? "border-[#8f3d5b]/40 bg-white shadow-sm ring-2 ring-[#8f3d5b]/10" : "border-transparent bg-white/60 hover:bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-stone-950">{thread.customer?.name || "Customer"}</p>
                      <p className="truncate text-xs text-stone-500">{thread.customer?.email}</p>
                    </div>
                    {thread.unread_count ? (
                      <span className="rounded-full bg-[#8f3d5b] px-2 py-1 text-xs font-bold text-white">
                        {thread.unread_count}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-stone-600">
                    {thread.latest_message?.product
                      ? `[Produk] ${thread.latest_message.product.product_name}`
                      : thread.latest_message?.order
                        ? `[Pesanan] ${thread.latest_message.order.order_code}`
                        : thread.latest_message?.message || "Belum ada pesan"}
                  </p>
                </button>
              ))
            )}
          </div>
        </aside>

        <div className="flex min-h-[680px] flex-col bg-white">
          {selectedThread ? (
            <>
              <div className="flex items-center justify-between gap-3 border-b border-stone-100 bg-white p-5">
                <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#8f3d5b] text-white">
                  <MessageCircle className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-bold text-stone-950">{selectedThread.customer?.name || "Customer"}</p>
                  <p className="text-xs text-stone-500">{selectedThread.customer?.email}</p>
                </div>
                </div>
                <span className="rounded-full bg-[#f4e5dd] px-3 py-1 text-xs font-bold text-[#8f3d5b]">
                  Thread #{selectedThread.id}
                </span>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto bg-[#fbfaf8] p-5">
                {selectedThread.messages.map((item) => {
                  const admin = item.sender?.role === "admin";
                  return (
                    <div key={item.id} className={`flex ${admin ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[78%] rounded-2xl px-4 py-3 shadow-sm ${admin ? "bg-[#8f3d5b] text-white" : "bg-white text-stone-800 ring-1 ring-stone-100"}`}>
                        {item.product ? (
                          <a
                            href={`/products/${item.product.id}`}
                            target="_blank"
                            rel="noreferrer"
                            className={`mb-3 flex gap-3 rounded-xl border p-2 text-left ${
                              admin ? "border-white/20 bg-white/10" : "border-stone-200 bg-stone-50"
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
                              <span className={`text-xs ${admin ? "text-rose-100" : "text-slate-500"}`}>
                                Rp {Number(item.product.base_price).toLocaleString("id-ID")}
                              </span>
                            </span>
                          </a>
                        ) : null}
                        {item.order ? (
                          <a
                            href={`/admin/orders`}
                            className={`mb-3 block rounded-xl border p-3 text-left ${
                              admin ? "border-white/20 bg-white/10" : "border-stone-200 bg-stone-50"
                            }`}
                          >
                            <span className="block text-xs font-semibold uppercase tracking-[0.18em] opacity-75">Pesanan</span>
                            <span className="mt-1 block font-bold">{item.order.order_code}</span>
                            <span className={`text-xs ${admin ? "text-rose-100" : "text-slate-500"}`}>
                              {item.order.order_status} - Rp {Number(item.order.total_price).toLocaleString("id-ID")}
                            </span>
                          </a>
                        ) : null}
                        <p className="text-sm leading-6">{item.message}</p>
                        <p className={`mt-2 text-[11px] ${admin ? "text-rose-100" : "text-slate-400"}`}>
                          {new Date(item.created_at).toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <form onSubmit={sendMessage} className="flex gap-3 border-t border-stone-100 bg-white p-4">
                <input
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Tulis balasan..."
                  className="min-w-0 flex-1 rounded-2xl border border-stone-300 px-4 py-3 focus:border-[#8f3d5b] focus:outline-none focus:ring-2 focus:ring-[#8f3d5b]/15"
                />
                <button
                  type="submit"
                  disabled={sending || !message.trim()}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#8f3d5b] px-5 py-3 font-semibold text-white hover:bg-[#78304b] disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  <Send className="h-4 w-4" />
                  Kirim
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center text-slate-500">Pilih percakapan customer.</div>
          )}
        </div>
      </section>
      )}
    </div>
  );
}
