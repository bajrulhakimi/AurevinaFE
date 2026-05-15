import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import API, { extractApiList, getApiErrorMessage } from "../services/api";
import { Plus, Search, Edit, Trash2, ShieldCheck, UserRound, Users as UsersIcon } from "lucide-react";
import Modal from "../components/Modal";

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  created_at: string;
}

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "admin" | "customer">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "customer",
    password: "",
  });

  const fetchUsers = async () => {
    try {
      const res = await API.get("/admin/users");
      setUsers(extractApiList<User>(res.data));
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Gagal memuat data user.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openModal = (user?: User) => {
    if (user) {
      setEditingId(user.id);
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone ?? "",
        role: user.role,
        password: "",
      });
    } else {
      setEditingId(null);
      setFormData({ name: "", email: "", phone: "", role: "customer", password: "" });
    }
    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: "", email: "", phone: "", role: "customer", password: "" });
    setError(null);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [event.target.name]: event.target.value });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (editingId) {
        const payload: Record<string, string> = {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          role: formData.role,
        };
        if (formData.password) {
          payload.password = formData.password;
        }
        await API.put(`/admin/users/${editingId}`, payload);
      } else {
        await API.post("/admin/users", formData);
      }
      await fetchUsers();
      closeModal();
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "Unable to save user."));
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async (id: number) => {
    if (!confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      await API.delete(`/admin/users/${id}`);
      await fetchUsers();
    } catch (err) {
      console.error(err);
      setError("Gagal menghapus user.");
    }
  };

  const filteredUsers = users.filter((user) => {
    const keyword = searchTerm.toLowerCase();
    const matchesKeyword =
      user.name.toLowerCase().includes(keyword) ||
      user.email.toLowerCase().includes(keyword) ||
      user.phone?.toLowerCase().includes(keyword);
    const matchesRole = roleFilter === "all" || user.role === roleFilter;

    return matchesKeyword && matchesRole;
  });
  const adminCount = users.filter((user) => user.role === "admin").length;
  const customerCount = users.filter((user) => user.role === "customer").length;
  const roleTabs = [
    { value: "all" as const, label: "Semua User", count: users.length, icon: UsersIcon },
    { value: "admin" as const, label: "Admin", count: adminCount, icon: ShieldCheck },
    { value: "customer" as const, label: "Customer", count: customerCount, icon: UserRound },
  ];
  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

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
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#d9b17c]">Akses Akun</p>
            <h2 className="mt-2 text-3xl font-bold tracking-normal text-white">User Management</h2>
            <p className="mt-2 text-sm text-stone-300">Kelola akun admin dan customer secara terpisah berdasarkan role.</p>
          </div>
          <button type="button" onClick={() => openModal()} className="inline-flex items-center rounded-2xl bg-white px-4 py-2.5 text-sm font-bold text-[#171412] transition hover:bg-stone-100">
            <Plus className="mr-2 h-5 w-5" />
            Tambah User
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {roleTabs.map((tab) => {
          const Icon = tab.icon;
          const active = roleFilter === tab.value;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setRoleFilter(tab.value)}
              className={`rounded-[1.5rem] border p-5 text-left shadow-sm transition ${
                active
                  ? "border-[#8f3d5b] bg-white ring-2 ring-[#8f3d5b]/10"
                  : "border-white bg-white/90 hover:border-stone-200 hover:bg-white"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${active ? "bg-[#8f3d5b] text-white" : "bg-stone-100 text-stone-600"}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-3xl font-bold text-slate-950">{tab.count}</span>
              </div>
              <p className="mt-4 text-sm font-bold text-slate-950">{tab.label}</p>
              <p className="mt-1 text-xs text-stone-500">
                {tab.value === "all" ? "Total akun terdaftar" : tab.value === "admin" ? "Akun pengelola toko" : "Akun pembeli/customer"}
              </p>
            </button>
          );
        })}
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
        <input
          type="text"
          placeholder="Cari nama, email, atau nomor HP..."
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
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-stone-500">User</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-stone-500">Kontak</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-stone-500">Role</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-stone-500">Bergabung</th>
                <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-[0.16em] text-stone-500">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 bg-white">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="transition hover:bg-[#fbfaf8]">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-bold text-white ${user.role === "admin" ? "bg-[#8f3d5b]" : "bg-[#b9895e]"}`}>
                        {getInitials(user.name)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-950">{user.name}</p>
                        <p className="text-xs text-stone-500">ID #{user.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="flex flex-col gap-1 whitespace-nowrap px-6 py-4 text-sm text-slate-900">
                    <span>{user.email}</span>
                    {user.phone && <span className="text-stone-500">{user.phone}</span>}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${user.role === "admin" ? "bg-[#f4e5dd] text-[#8f3d5b]" : "bg-emerald-50 text-emerald-700"}`}>
                      {user.role === "admin" ? "Admin" : "Customer"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-stone-500">{new Date(user.created_at).toLocaleDateString("id-ID")}</td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => openModal(user)} className="rounded-xl bg-stone-100 p-2 text-stone-700 transition hover:bg-[#f4e5dd] hover:text-[#8f3d5b]" aria-label="Edit user"><Edit className="h-4 w-4" /></button>
                      <button type="button" onClick={() => deleteUser(user.id)} className="rounded-xl bg-red-50 p-2 text-red-600 transition hover:bg-red-100" aria-label="Hapus user"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {error ? (
        <div className="text-center py-12"><p className="text-red-600 font-medium">{error}</p></div>
      ) : filteredUsers.length === 0 ? (
        <div className="py-12 text-center"><p className="text-stone-500">User tidak ditemukan.</p></div>
      ) : null}

      <Modal open={isModalOpen} title={editingId ? "Edit User" : "Tambah User"} onClose={closeModal}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700">Nama</label>
              <input name="name" value={formData.name} onChange={handleChange} required className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-2 focus:border-[#8f3d5b] focus:outline-none focus:ring-2 focus:ring-[#8f3d5b]/15" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <input name="email" type="email" value={formData.email} onChange={handleChange} required className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-2 focus:border-[#8f3d5b] focus:outline-none focus:ring-2 focus:ring-[#8f3d5b]/15" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Nomor HP</label>
              <input name="phone" value={formData.phone} onChange={handleChange} className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-2 focus:border-[#8f3d5b] focus:outline-none focus:ring-2 focus:ring-[#8f3d5b]/15" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Role</label>
              <select name="role" value={formData.role} onChange={handleChange} className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-2 focus:border-[#8f3d5b] focus:outline-none focus:ring-2 focus:ring-[#8f3d5b]/15">
                <option value="customer">Customer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {!editingId && (
              <div>
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <input name="password" type="password" value={formData.password} onChange={handleChange} required className="mt-2 w-full rounded-xl border border-stone-300 px-4 py-2 focus:border-[#8f3d5b] focus:outline-none focus:ring-2 focus:ring-[#8f3d5b]/15" />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={closeModal} className="rounded-xl border border-stone-300 px-4 py-2 text-stone-700 hover:bg-stone-100">Batal</button>
            <button type="submit" disabled={saving} className="rounded-xl bg-[#8f3d5b] px-4 py-2 text-white hover:bg-[#78304b] disabled:cursor-not-allowed disabled:bg-stone-400">{saving ? "Menyimpan..." : editingId ? "Update User" : "Buat User"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
