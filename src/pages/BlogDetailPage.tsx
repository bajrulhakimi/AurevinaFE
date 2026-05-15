import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowLeft, Calendar, ChevronRight, User } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import API from "../services/api";

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

export default function BlogDetailPage() {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await API.get(`/blogs/${slug}`);
        setPost(response.data?.data ?? null);
      } catch {
        setPost(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fbf7f2]">
        <Navbar />
        <main className="flex min-h-[60vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#8f3d5b]" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-[#fbf7f2]">
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b9895e]">Journal</p>
          <h1 className="mt-4 text-3xl font-bold text-stone-950">Artikel tidak ditemukan</h1>
          <p className="mt-3 text-stone-600">Artikel yang kamu buka belum tersedia atau sudah dipindahkan.</p>
          <Link to="/blog" className="mt-8 inline-flex rounded-xl bg-[#8f3d5b] px-5 py-3 font-semibold text-white hover:bg-[#76304a]">Kembali ke Blog</Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbf7f2]">
      <Navbar />
      <main>
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <Link to="/blog" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-[#8f3d5b] hover:text-[#76304a]">
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Blog
          </Link>
          <div className="overflow-hidden rounded-[32px] border border-white/80 bg-white shadow-xl shadow-stone-900/5">
            <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="flex min-h-[360px] items-center justify-center bg-[#efe1d4]">
                {post.image ? <img src={post.image} alt={post.title} className="h-full min-h-[360px] w-full object-cover" /> : <div className="text-[120px] leading-none">A</div>}
              </div>
              <div className="flex flex-col justify-center p-8 sm:p-10">
                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <span className="rounded-full bg-rose-50 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#8f3d5b]">{post.category || "Aurevina Tips"}</span>
                  <span className="text-sm font-medium text-stone-500">{post.read_time || "2 menit baca"}</span>
                </div>
                <h1 className="text-4xl font-bold leading-tight text-stone-950 sm:text-5xl">{post.title}</h1>
                <p className="mt-5 text-lg leading-8 text-stone-600">{post.excerpt}</p>
                <div className="mt-8 flex flex-wrap items-center gap-5 text-sm text-stone-500">
                  <span className="inline-flex items-center gap-2"><User className="h-4 w-4" />{post.author?.name || "Admin"}</span>
                  <span className="inline-flex items-center gap-2"><Calendar className="h-4 w-4" />{new Date(post.created_at).toLocaleDateString("id-ID")}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-16 sm:px-6 lg:grid-cols-[1fr_320px] lg:px-8">
          <article className="rounded-[28px] border border-white/80 bg-white p-7 shadow-sm sm:p-10">
            {post.content.split("\n").filter(Boolean).map((paragraph) => (
              <p key={paragraph} className="mb-6 text-lg leading-9 text-stone-700">{paragraph}</p>
            ))}
          </article>
          <aside>
            <div className="rounded-[24px] border border-white/80 bg-stone-950 p-6 text-white shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#d9a66f]">Aurevina Notes</p>
              <h3 className="mt-4 text-2xl font-bold">Temukan hijab yang cocok untuk gaya harianmu.</h3>
              <Link to="/products" className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-[#8f3d5b]">
                Belanja Sekarang <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </aside>
        </section>
      </main>
      <Footer />
    </div>
  );
}
