import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, ChevronRight, Search, User } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import API, { extractApiList } from "../services/api";

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  category?: string;
  read_time?: string;
  image?: string | null;
  author?: { name?: string };
  created_at: string;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await API.get("/blogs");
        setPosts(extractApiList<BlogPost>(response.data));
      } catch (error) {
        console.error("Failed to load blogs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  const categories = useMemo(() => Array.from(new Set(posts.map((post) => post.category || "Aurevina Tips"))), [posts]);
  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.excerpt || post.content).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || (post.category || "Aurevina Tips") === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#fbf7f2]">
      <Navbar />
      <div className="bg-[#fbf7f2] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-[#b9895e]">Journal</p>
          <h1 className="mb-4 text-4xl font-bold text-stone-950">Blog Aurevina</h1>
          <p className="max-w-2xl text-stone-600">Tips, tren, dan inspirasi fashion hijab dari artikel yang dikelola admin.</p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          <aside className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-white/80 bg-white p-6 shadow-sm">
              <div className="mb-6">
                <label className="mb-2 block text-sm font-semibold text-stone-700">Cari Artikel</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-5 w-5 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Judul artikel..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="w-full rounded-full border border-stone-300 py-2 pl-10 pr-4 focus:border-[#8f3d5b] focus:ring-2 focus:ring-rose-100"
                  />
                </div>
              </div>

              <h3 className="mb-3 font-bold text-stone-950">Kategori</h3>
              <div className="space-y-2">
                <button onClick={() => setSelectedCategory(null)} className={`w-full rounded-lg px-4 py-2 text-left transition-colors ${selectedCategory === null ? "bg-[#8f3d5b] text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"}`}>
                  Semua Artikel
                </button>
                {categories.map((category) => (
                  <button key={category} onClick={() => setSelectedCategory(category)} className={`w-full rounded-lg px-4 py-2 text-left transition-colors ${selectedCategory === category ? "bg-[#8f3d5b] text-white" : "bg-stone-100 text-stone-700 hover:bg-stone-200"}`}>
                    {category}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <section className="lg:col-span-3">
            {loading ? (
              <div className="flex h-96 items-center justify-center rounded-[24px] border border-white/80 bg-white">
                <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#8f3d5b]" />
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="flex h-96 items-center justify-center rounded-[24px] border border-white/80 bg-white">
                <div className="text-center text-stone-500">
                  <p className="font-semibold text-stone-800">Belum ada artikel.</p>
                  <p className="mt-2 text-sm">Tambahkan artikel dari halaman admin Blog.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {filteredPosts.map((post) => (
                  <article key={post.id} className="group overflow-hidden rounded-[24px] border border-white/80 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl">
                    <div className="grid grid-cols-1 gap-0 md:grid-cols-3">
                      <div className="flex h-48 items-center justify-center overflow-hidden bg-[#efe1d4] md:col-span-1 md:h-auto">
                        {post.image ? <img src={post.image} alt={post.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" /> : <div className="text-7xl">A</div>}
                      </div>
                      <div className="flex flex-col justify-between p-6 md:col-span-2">
                        <div>
                          <div className="mb-3 flex items-center gap-2">
                            <span className="inline-block rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-[#8f3d5b]">{post.category || "Aurevina Tips"}</span>
                            <span className="text-xs font-medium text-stone-500">{post.read_time || "2 menit baca"}</span>
                          </div>
                          <Link to={`/blog/${post.slug}`} className="mb-2 block text-xl font-bold text-stone-950 transition-colors hover:text-[#8f3d5b]">{post.title}</Link>
                          <p className="mb-4 leading-7 text-stone-600">{post.excerpt || post.content.slice(0, 150)}</p>
                        </div>
                        <div className="flex flex-col gap-4 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex flex-wrap items-center gap-4">
                            <span className="flex items-center gap-1"><User className="h-4 w-4" />{post.author?.name || "Admin"}</span>
                            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{new Date(post.created_at).toLocaleDateString("id-ID")}</span>
                          </div>
                          <Link to={`/blog/${post.slug}`} className="flex items-center gap-1 font-semibold text-[#8f3d5b] transition-all hover:text-[#76304a] group-hover:gap-2">
                            Baca Artikel <ChevronRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
}
