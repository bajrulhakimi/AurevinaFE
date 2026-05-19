import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronDown, Gem, Scissors, Shirt, Sparkles } from "lucide-react";
import API, { extractApiList } from "../services/api";

interface Category {
  id: number;
  category_name: string;
  slug: string;
  description?: string | null;
  products_count?: number;
}

const categoryStyles: Record<string, { Icon: typeof Sparkles; accent: string; bg: string }> = {
  "hijab-modern": { Icon: Sparkles, accent: "text-[#8f3d5b]", bg: "bg-rose-50" },
  "hijab-syari": { Icon: Shirt, accent: "text-[#6f5135]", bg: "bg-amber-50" },
  pashmina: { Icon: Scissors, accent: "text-[#3f6f68]", bg: "bg-emerald-50" },
  bergo: { Icon: Gem, accent: "text-[#7b5aa6]", bg: "bg-violet-50" },
};

export default function CategoriesSection() {
  const fallbackCategories: Category[] = [
    {
      id: 1,
      category_name: "Hijab Modern",
      slug: "hijab-modern",
      description: "Clean look untuk kantor, kampus, dan daily outfit.",
    },
    {
      id: 2,
      category_name: "Hijab Syar'i",
      slug: "hijab-syari",
      description: "Coverage nyaman dengan jatuh bahan yang anggun.",
    },
    {
      id: 3,
      category_name: "Pashmina",
      slug: "pashmina",
      description: "Warna lembut dan mudah dibentuk untuk banyak gaya.",
    },
    {
      id: 4,
      category_name: "Bergo",
      slug: "bergo",
      description: "Praktis, rapi, dan siap dipakai untuk hari sibuk.",
    },
  ];
  const [categories, setCategories] = useState<Category[]>(fallbackCategories);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const visibleCategories = showAll ? categories : categories.slice(0, 4);
  const hasMoreCategories = categories.length > 4;

  useEffect(() => {
    let active = true;

    API.get("/categories")
      .then((response) => {
        const nextCategories = extractApiList<Category>(response.data)
          .map((category) => ({
            ...category,
            products_count: Number(category.products_count || 0),
          }))
          .sort((a, b) => (b.products_count || 0) - (a.products_count || 0));

        if (active && nextCategories.length > 0) {
          setCategories(nextCategories);
        }
      })
      .catch((error) => {
        console.error("Failed to load categories:", error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <section className="bg-[#fbf7f2] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-64 items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#8f3d5b]" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="kategori" className="bg-[#fbf7f2] py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b9895e]">Koleksi</p>
          <h2 className="mt-3 text-4xl font-bold text-stone-950">Pilih gaya hijabmu</h2>
          <p className="mt-3 text-lg leading-8 text-stone-600">
            Setiap kategori dirancang untuk kebutuhan yang berbeda, dari tampilan praktis sampai look yang lebih formal.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-2 lg:grid-cols-4">
          {visibleCategories.map((category, index) => {
            const style = categoryStyles[category.slug] || categoryStyles["hijab-modern"];
            const Icon = style.Icon;
            const description = category.description || "Koleksi pilihan Aurevina yang siap dipadukan untuk banyak gaya.";

            return (
              <Link
                key={category.id}
                to={`/products?category=${category.slug}`}
                className="group overflow-hidden rounded-2xl border border-white/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#8f3d5b]"
              >
                <div className={`mb-8 flex h-16 w-16 items-center justify-center rounded-2xl ${style.bg}`}>
                  <Icon className={`h-8 w-8 ${style.accent}`} />
                </div>
                {index < 4 ? (
                  <span className="mb-4 inline-flex rounded-full bg-[#f4e5dd] px-3 py-1 text-xs font-bold text-[#8f3d5b]">
                    Top {index + 1}
                  </span>
                ) : null}
                <h3 className="text-xl font-bold text-stone-950 transition-colors group-hover:text-[#8f3d5b]">
                  {category.category_name}
                </h3>
                <p className="mt-3 hidden min-h-[72px] text-sm leading-6 text-stone-600 sm:block">{description}</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-stone-400">
                  {category.products_count || 0} produk
                </p>
                <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#8f3d5b]">
                  Lihat koleksi
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>

        {hasMoreCategories ? (
          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={() => setShowAll((value) => !value)}
              className="inline-flex items-center gap-2 rounded-full border border-[#8f3d5b]/20 bg-white px-6 py-3 text-sm font-bold text-[#8f3d5b] shadow-sm transition hover:border-[#8f3d5b]/40 hover:bg-[#fff8f5]"
            >
              {showAll ? "Tampilkan lebih sedikit" : "Selengkapnya"}
              <ChevronDown className={`h-4 w-4 transition-transform ${showAll ? "rotate-180" : ""}`} />
            </button>
          </div>
        ) : null}
      </div>
    </section>
  );
}
