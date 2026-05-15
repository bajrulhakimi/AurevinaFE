import { useEffect, useState, type FormEvent } from "react";
import { MessageSquareReply, Star } from "lucide-react";
import API, { extractApiList, getApiErrorMessage } from "../services/api";

interface Review {
  id: number;
  rating: number;
  review: string;
  admin_reply?: string | null;
  created_at: string;
  user?: { name: string; email: string };
  product?: { product_name?: string; name?: string };
}

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>({});
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      const res = await API.get("/admin/reviews");
      const nextReviews = extractApiList<Review>(res.data);
      setReviews(nextReviews);
      setReplyDrafts(Object.fromEntries(nextReviews.map((review) => [review.id, review.admin_reply || ""])));
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, "Ulasan tidak dapat dimuat."));
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const saveReply = async (event: FormEvent, reviewId: number) => {
    event.preventDefault();
    const admin_reply = replyDrafts[reviewId]?.trim();
    if (!admin_reply) return;

    setSavingId(reviewId);
    try {
      await API.patch(`/admin/reviews/${reviewId}/reply`, { admin_reply });
      await fetchReviews();
    } catch (err) {
      setError(getApiErrorMessage(err, "Balasan gagal disimpan."));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Customer voice</p>
        <h2 className="mt-2 text-2xl font-bold text-slate-950">Rating & Ulasan Produk</h2>
        <p className="mt-2 text-slate-600">Semua rating diambil dari ulasan pelanggan, lalu tampil di detail produk customer.</p>
      </div>

      {error ? <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
            Belum ada ulasan pelanggan.
          </div>
        ) : (
          reviews.map((review) => (
            <article key={review.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm text-slate-500">{review.product?.product_name || review.product?.name || "Produk"}</p>
                  <h3 className="mt-1 font-bold text-slate-950">{review.user?.name || "Pelanggan"}</h3>
                  <div className="mt-2 flex items-center gap-1">
                    {[...Array(5)].map((_, index) => (
                      <Star key={index} className={`h-4 w-4 ${index < review.rating ? "fill-yellow-400 text-yellow-400" : "text-slate-300"}`} />
                    ))}
                    <span className="ml-2 text-xs text-slate-500">{new Date(review.created_at).toLocaleDateString("id-ID")}</span>
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${review.admin_reply ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                  {review.admin_reply ? "Sudah dibalas" : "Belum dibalas"}
                </span>
              </div>

              <p className="mt-4 rounded-xl bg-slate-50 p-4 leading-7 text-slate-700">{review.review}</p>

              <form onSubmit={(event) => saveReply(event, review.id)} className="mt-4">
                <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <MessageSquareReply className="h-4 w-4" />
                  Balasan penjual
                </label>
                <textarea
                  value={replyDrafts[review.id] || ""}
                  onChange={(event) => setReplyDrafts((current) => ({ ...current, [review.id]: event.target.value }))}
                  rows={3}
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  placeholder="Tulis balasan untuk pelanggan..."
                />
                <button
                  type="submit"
                  disabled={savingId === review.id || !replyDrafts[review.id]?.trim()}
                  className="mt-3 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {savingId === review.id ? "Menyimpan..." : "Simpan Balasan"}
                </button>
              </form>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
