import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import API, { extractApiList, getApiErrorMessage } from "../services/api";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import Modal from "../components/Modal";

interface Category {
  id: number;
  category_name: string;
  description?: string;
  created_at: string;
}

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    category_name: "",
    description: "",
    slug: "",
  });
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = async () => {
    try {
      const res = await API.get("/admin/categories");
      setCategories(extractApiList<Category>(res.data));
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Unable to load categories.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const openModal = (category?: Category) => {
    if (category) {
      setEditingId(category.id);
      setFormData({
        category_name: category.category_name,
        description: category.description || "",
        slug: category.category_name.toLowerCase().replace(/\s+/g, "-"),
      });
    } else {
      setEditingId(null);
      setFormData({ category_name: "", description: "", slug: "" });
    }
    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ category_name: "", description: "", slug: "" });
    setError(null);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (editingId) {
        await API.put(`/admin/categories/${editingId}`, formData);
      } else {
        await API.post("/admin/categories", formData);
      }
      await fetchCategories();
      closeModal();
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "Unable to save category."));
    } finally {
      setSaving(false);
    }
  };

  const deleteCategory = async (id: number) => {
    if (!confirm("Are you sure you want to delete this category?")) {
      return;
    }

    try {
      await API.delete(`/admin/categories/${id}`);
      await fetchCategories();
    } catch (err) {
      console.error(err);
      setError("Unable to delete category.");
    }
  };

  const filteredCategories = categories.filter((category) =>
    category.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#8f3d5b]"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-white bg-[#15110f] p-6 text-white shadow-xl shadow-stone-300/40">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#d9b17c]">Kategori Produk</p>
          <h2 className="mt-2 text-3xl font-bold tracking-normal">Kelola Kategori</h2>
          <p className="mt-2 text-sm text-stone-300">Buat, ubah, dan hapus kategori yang dipakai saat menambahkan produk.</p>
        </div>
        <button
          type="button"
          onClick={() => openModal()}
          className="inline-flex items-center rounded-2xl bg-white px-4 py-2.5 text-sm font-bold text-[#171412] transition hover:bg-stone-100"
        >
          <Plus className="mr-2 h-5 w-5" />
          Tambah Kategori
        </button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
        <input
          type="text"
          placeholder="Cari kategori..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-2xl border border-stone-300 bg-white py-3 pl-12 pr-4 text-sm focus:border-[#8f3d5b] focus:outline-none focus:ring-2 focus:ring-[#8f3d5b]/15"
        />
      </div>

      <div className="overflow-hidden rounded-[2rem] border border-white bg-white/95 shadow-sm ring-1 ring-slate-900/5">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-200">
            <thead className="bg-stone-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-stone-500">Kategori</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-stone-500">Slug</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-stone-500">Deskripsi</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-stone-500">Dibuat</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-stone-500">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 bg-white">
              {filteredCategories.map((category) => (
                <tr key={category.id} className="transition hover:bg-[#fbfaf8]">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-bold text-slate-950">{category.category_name}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-stone-500">{category.category_name.toLowerCase().replace(/\s+/g, "-")}</td>
                  <td className="max-w-xs truncate px-6 py-4 text-sm text-slate-700">{category.description || "Tidak ada deskripsi"}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-stone-500">{new Date(category.created_at).toLocaleDateString("id-ID")}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                    <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openModal(category)}
                      className="rounded-xl bg-stone-100 p-2 text-stone-700 transition hover:bg-[#f4e5dd] hover:text-[#8f3d5b]"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCategory(category.id)}
                      className="rounded-xl bg-red-50 p-2 text-red-600 transition hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-12">
          <p className="text-stone-500">Kategori tidak ditemukan.</p>
        </div>
      )}

      <Modal open={isModalOpen} title={editingId ? "Edit Kategori" : "Tambah Kategori"} onClose={closeModal}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-slate-700">Nama Kategori</label>
            <input
              name="category_name"
              value={formData.category_name}
              onChange={handleChange}
              required
              className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-2 focus:border-[#8f3d5b] focus:outline-none focus:ring-2 focus:ring-[#8f3d5b]/15"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Slug</label>
            <input
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              required
              className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-2 focus:border-[#8f3d5b] focus:outline-none focus:ring-2 focus:ring-[#8f3d5b]/15"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Deskripsi</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-2 focus:border-[#8f3d5b] focus:outline-none focus:ring-2 focus:ring-[#8f3d5b]/15"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={closeModal} className="rounded-xl border border-stone-300 px-4 py-2 text-stone-700 hover:bg-stone-100">Batal</button>
            <button type="submit" disabled={saving} className="rounded-xl bg-[#8f3d5b] px-4 py-2 text-white hover:bg-[#78304b] disabled:cursor-not-allowed disabled:bg-stone-400">
              {saving ? "Menyimpan..." : editingId ? "Update Kategori" : "Buat Kategori"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
