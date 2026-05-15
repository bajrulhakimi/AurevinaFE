import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Edit, Plus, Trash2 } from "lucide-react";
import API, { extractApiList, getApiErrorMessage } from "../services/api";
import Modal from "../components/Modal";

interface Promo {
  id: number;
  promo_code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  start_date: string;
  end_date: string;
}

const formatDateInput = (date: Date) => date.toISOString().slice(0, 10);
const defaultPromoForm = () => {
  const start = new Date();
  const end = new Date(start);
  end.setDate(start.getDate() + 30);

  return {
    promo_code: "",
    discount_type: "percent",
    discount_value: "10",
    start_date: formatDateInput(start),
    end_date: formatDateInput(end),
  };
};

export default function Promos() {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(defaultPromoForm);

  const fetchPromos = async () => {
    try {
      const response = await API.get("/admin/promos");
      setPromos(extractApiList<Promo>(response.data));
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, "Promo gagal dimuat."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  const openForm = (promo?: Promo) => {
    const defaults = defaultPromoForm();
    setEditingId(promo?.id ?? null);
    setForm({
      promo_code: promo?.promo_code ?? "",
      discount_type: promo?.discount_type ?? "percent",
      discount_value: String(promo?.discount_value ?? 10),
      start_date: promo?.start_date?.slice(0, 10) ?? defaults.start_date,
      end_date: promo?.end_date?.slice(0, 10) ?? defaults.end_date,
    });
    setOpen(true);
    setError(null);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (editingId) {
        await API.put(`/admin/promos/${editingId}`, form);
      } else {
        await API.post("/admin/promos", form);
      }
      setOpen(false);
      await fetchPromos();
    } catch (err) {
      setError(getApiErrorMessage(err, "Promo gagal disimpan."));
    } finally {
      setSaving(false);
    }
  };

  const removePromo = async (id: number) => {
    if (!confirm("Hapus promo ini?")) return;
    await API.delete(`/admin/promos/${id}`);
    await fetchPromos();
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#8f3d5b]" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-white bg-[#15110f] p-6 text-white shadow-xl shadow-stone-300/40">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#d9b17c]">Marketing</p>
            <h2 className="mt-2 text-3xl font-bold">Promo</h2>
            <p className="mt-2 text-sm text-stone-300">Kelola kode promo untuk dikirim lewat email dan dipakai customer saat checkout.</p>
          </div>
          <button type="button" onClick={() => openForm()} className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-bold text-[#171412]">
            <Plus className="h-4 w-4" /> Tambah Promo
          </button>
        </div>
      </div>

      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      <div className="overflow-hidden rounded-[2rem] border border-white bg-white/95 shadow-sm ring-1 ring-slate-900/5">
        <table className="min-w-full divide-y divide-stone-200">
          <thead className="bg-stone-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-stone-500">Kode</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-stone-500">Diskon</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-stone-500">Periode</th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-stone-500">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {promos.map((promo) => (
              <tr key={promo.id} className="hover:bg-[#fbfaf8]">
                <td className="px-6 py-4 font-bold text-slate-950">{promo.promo_code}</td>
                <td className="px-6 py-4 text-sm text-stone-700">{promo.discount_type === "percent" ? `${promo.discount_value}%` : `Rp ${Number(promo.discount_value).toLocaleString("id-ID")}`}</td>
                <td className="px-6 py-4 text-sm text-stone-700">{new Date(promo.start_date).toLocaleDateString("id-ID")} - {new Date(promo.end_date).toLocaleDateString("id-ID")}</td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button type="button" onClick={() => openForm(promo)} className="rounded-xl bg-stone-100 p-2 text-stone-700 hover:bg-[#f4e5dd] hover:text-[#8f3d5b]"><Edit className="h-4 w-4" /></button>
                    <button type="button" onClick={() => removePromo(promo.id)} className="rounded-xl bg-red-50 p-2 text-red-600 hover:bg-red-100"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {promos.length === 0 ? <p className="p-8 text-center text-stone-500">Belum ada promo.</p> : null}
      </div>

      <Modal open={open} title={editingId ? "Edit Promo" : "Tambah Promo"} onClose={() => setOpen(false)}>
        <form onSubmit={submit} className="space-y-4">
          <input value={form.promo_code} onChange={(event) => setForm({ ...form, promo_code: event.target.value.toUpperCase() })} required placeholder="Kode promo" className="w-full rounded-xl border border-stone-300 px-4 py-3 focus:border-[#8f3d5b] focus:outline-none focus:ring-2 focus:ring-[#8f3d5b]/15" />
          <div className="grid gap-4 sm:grid-cols-2">
            <select value={form.discount_type} onChange={(event) => setForm({ ...form, discount_type: event.target.value })} className="rounded-xl border border-stone-300 px-4 py-3 focus:border-[#8f3d5b] focus:outline-none focus:ring-2 focus:ring-[#8f3d5b]/15">
              <option value="percent">Persen</option>
              <option value="fixed">Nominal</option>
            </select>
            <input value={form.discount_value} onChange={(event) => setForm({ ...form, discount_value: event.target.value })} type="number" required className="rounded-xl border border-stone-300 px-4 py-3 focus:border-[#8f3d5b] focus:outline-none focus:ring-2 focus:ring-[#8f3d5b]/15" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <input type="date" value={form.start_date} onChange={(event) => setForm({ ...form, start_date: event.target.value })} className="rounded-xl border border-stone-300 px-4 py-3" />
            <input type="date" value={form.end_date} onChange={(event) => setForm({ ...form, end_date: event.target.value })} className="rounded-xl border border-stone-300 px-4 py-3" />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-stone-300 px-4 py-2">Batal</button>
            <button type="submit" disabled={saving} className="rounded-xl bg-[#8f3d5b] px-4 py-2 font-semibold text-white disabled:opacity-60">{saving ? "Menyimpan..." : "Simpan"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
