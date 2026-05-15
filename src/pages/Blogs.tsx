import { useEffect, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import API, { extractApiList, getApiErrorMessage } from "../services/api";
import { Plus, Search, Edit, Trash2 } from "lucide-react";
import Modal from "../components/Modal";

interface Blog {
  id: number;
  title: string;
  content: string;
  status: string;
  image?: string;
  author?: {
    id: number;
    name: string;
  };
  created_at: string;
}

export default function Blogs() {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    status: "draft",
    image: null as File | null,
  });
  const [error, setError] = useState<string | null>(null);

  const fetchBlogs = async () => {
    try {
      const res = await API.get("/admin/blogs");
      setBlogs(extractApiList<Blog>(res.data));
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Unable to load blog posts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const openModal = (blog?: Blog) => {
    if (blog) {
      setEditingId(blog.id);
      setFormData({
        title: blog.title,
        content: blog.content,
        status: blog.status || "draft",
        image: null,
      });
    } else {
      setEditingId(null);
      setFormData({ title: "", content: "", status: "draft", image: null });
    }
    setError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ title: "", content: "", status: "draft", image: null });
    setError(null);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, files } = event.target as HTMLInputElement;
    if (name === "image") {
      setFormData({ ...formData, image: files?.[0] ?? null });
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload = new FormData();
    payload.append("title", formData.title);
    payload.append("content", formData.content);
    payload.append("status", formData.status);
    if (formData.image) {
      payload.append("image", formData.image);
    }
    const userId = localStorage.getItem("user_id");
    if (userId) {
      payload.append("author_id", userId);
    }
    if (editingId) {
      payload.append("_method", "PUT");
    }

    try {
      if (editingId) {
        await API.post(`/admin/blogs/${editingId}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await API.post("/admin/blogs", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      await fetchBlogs();
      closeModal();
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "Unable to save blog post."));
    } finally {
      setSaving(false);
    }
  };

  const deleteBlog = async (id: number) => {
    if (!confirm("Are you sure you want to delete this blog post?")) {
      return;
    }

    try {
      await API.delete(`/admin/blogs/${id}`);
      await fetchBlogs();
    } catch (err) {
      console.error(err);
      setError("Unable to delete blog post.");
    }
  };

  const filteredBlogs = blogs.filter((blog) =>
    blog.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    blog.author?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Blog Management</h2>
          <p className="mt-2 text-sm text-gray-600">Create, edit, and remove blog posts.</p>
        </div>
        <button type="button" onClick={() => openModal()} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <Plus className="h-5 w-5 mr-2" />
          Add Blog Post
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input type="text" placeholder="Search blog posts..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
      </div>

      <div className="bg-white shadow-lg rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Author</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBlogs.map((blog) => (
                <tr key={blog.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{blog.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{blog.author?.name || "Admin"}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${blog.status === "published" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                      {blog.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(blog.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button type="button" onClick={() => openModal(blog)} className="text-blue-600 hover:text-blue-900"><Edit className="h-5 w-5" /></button>
                    <button type="button" onClick={() => deleteBlog(blog.id)} className="text-red-600 hover:text-red-900"><Trash2 className="h-5 w-5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {filteredBlogs.length === 0 && (
        <div className="text-center py-12"><p className="text-gray-500">No blog posts found.</p></div>
      )}

      <Modal open={isModalOpen} title={editingId ? "Edit Blog Post" : "Add Blog Post"} onClose={closeModal}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-slate-700">Title</label>
            <input name="title" value={formData.title} onChange={handleChange} required className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Content</label>
            <textarea name="content" value={formData.content} onChange={handleChange} rows={6} required className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">Status</label>
              <select name="status" value={formData.status} onChange={handleChange} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">Image</label>
              <input name="image" type="file" accept="image/*" onChange={handleChange} className="mt-2 w-full text-sm text-slate-700" />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={closeModal} className="rounded-xl border border-slate-300 px-4 py-2 text-slate-700 hover:bg-slate-100">Cancel</button>
            <button type="submit" disabled={saving} className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400">{saving ? "Saving..." : editingId ? "Update Blog" : "Create Blog"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
