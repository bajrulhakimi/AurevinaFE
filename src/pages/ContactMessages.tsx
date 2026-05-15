import { useEffect, useState } from "react";
import { Download, Mail, Trash2 } from "lucide-react";
import API, { extractApiList, getApiErrorMessage } from "../services/api";

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
}

export default function ContactMessages({ compact = false }: { compact?: boolean }) {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = async () => {
    try {
      const response = await API.get("/admin/contact-messages");
      setMessages(
        extractApiList<ContactMessage>(response.data).filter((message) =>
          message.subject.toLowerCase().includes("subscribe")
        )
      );
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, "Pesan masuk gagal dimuat."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const deleteMessage = async (id: number) => {
    if (!confirm("Hapus pesan ini?")) return;
    await API.delete(`/admin/contact-messages/${id}`);
    await fetchMessages();
  };

  const exportEmails = () => {
    const csv = [
      ["Email", "Nama", "Tanggal Subscribe"],
      ...messages.map((message) => [
        message.email,
        message.name,
        new Date(message.created_at).toLocaleString("id-ID"),
      ]),
    ]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "subscribe-aurevina.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-[2rem] border border-white bg-white shadow-sm">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#8f3d5b] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!compact ? <div className="rounded-[2rem] border border-white bg-[#15110f] p-6 text-white shadow-xl shadow-stone-300/40">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#d9b17c]">Newsletter</p>
        <h2 className="mt-2 text-3xl font-bold">Subscribe</h2>
        <p className="mt-2 text-sm text-stone-300">Daftar email pelanggan yang ingin menerima promo eksklusif.</p>
      </div> : null}

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      <div className="overflow-hidden rounded-[1.75rem] border border-white bg-white/95 shadow-sm shadow-stone-200/70 ring-1 ring-stone-200/70">
        <div className="flex flex-col gap-3 border-b border-stone-100 bg-[#fbfaf8] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-stone-950">{messages.length} Email Subscribe</p>
            <p className="text-xs text-stone-500">Email pelanggan dari form promo eksklusif di footer.</p>
          </div>
          <button
            type="button"
            onClick={exportEmails}
            disabled={messages.length === 0}
            className="inline-flex items-center justify-center gap-2 rounded-2xl border border-stone-300 bg-white px-4 py-2 text-sm font-bold text-stone-700 transition hover:border-[#8f3d5b]/40 hover:bg-[#fbf6f2] hover:text-[#8f3d5b] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Ekspor CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200 text-sm">
            <thead className="bg-stone-50">
              <tr>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-stone-500">Email</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-stone-500">Nama</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-stone-500">Sumber</th>
                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-stone-500">Tanggal</th>
                <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-[0.16em] text-stone-500">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 bg-white">
              {messages.map((message) => (
                <tr key={message.id} className="hover:bg-[#fbfaf8]">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#f4e5dd] text-[#8f3d5b]">
                        <Mail className="h-4 w-4" />
                      </span>
                      <a href={`mailto:${message.email}`} className="font-semibold text-stone-950 hover:text-[#8f3d5b]">{message.email}</a>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-stone-700">{message.name || "Newsletter Subscriber"}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex rounded-full bg-[#f4e5dd] px-3 py-1 text-xs font-bold text-[#8f3d5b]">
                      {message.subject || "Subscribe Promo"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-stone-500">{new Date(message.created_at).toLocaleString("id-ID")}</td>
                  <td className="px-5 py-4 text-right">
                    <button type="button" onClick={() => deleteMessage(message.id)} className="rounded-xl bg-red-50 p-2 text-red-600 transition hover:bg-red-100" aria-label="Hapus subscriber">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {messages.length === 0 ? (
          <div className="p-10 text-center text-stone-500">
            <Mail className="mx-auto mb-3 h-10 w-10 text-stone-300" />
            Belum ada email subscribe.
          </div>
        ) : null}
            </div>
    </div>
  );
}
