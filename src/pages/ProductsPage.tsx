import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, ShoppingCart, Star, Filter } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import PromoSection from "../components/PromoSection";
import API, { extractApiList } from "../services/api";

interface ProductVariant {
  id: number;
  variant_type: string;
  variant_value: string;
  sku: string;
  stock: number;
  image?: string;
}

interface Product {
  id: number;
  product_name: string;
  slug: string;
  base_price: number;
  special_price?: number | null;
  has_special_price?: boolean;
  final_price?: number;
  rating_average?: number;
  reviews_count?: number;
  description: string;
  main_image?: string;
  status: string;
  variants?: ProductVariant[];
  category?: {
    id: number;
    category_name: string;
    slug: string;
  };
}

const formatPrice = (value: number) => `Rp ${Number(value).toLocaleString("id-ID")}`;

const discountPercent = (basePrice: number, finalPrice?: number) => {
  if (!finalPrice || finalPrice >= basePrice) return 0;
  return Math.round(((basePrice - finalPrice) / basePrice) * 100);
};

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get("category");
  const promoFromUrl = searchParams.get("promo") === "1";
  const sortFromUrl = searchParams.get("sort");
  const [products, setProducts] = useState<Product[]>([
    {
      id: 1,
      product_name: "Hijab Modern Premium 1",
      slug: "hijab-modern-premium-1",
      base_price: 85000,
      description: "Hijab berkualitas premium dengan desain modern",
      status: "active",
      variants: [
        { id: 1, variant_type: "color", variant_value: "Hitam", sku: "HMP1-BLK", stock: 10, image: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500&h=500&fit=crop" },
        { id: 2, variant_type: "color", variant_value: "Putih", sku: "HMP1-WHT", stock: 8, image: "https://images.unsplash.com/photo-1617330890776-eecdc0a28a35?w=500&h=500&fit=crop" },
        { id: 3, variant_type: "color", variant_value: "Biru", sku: "HMP1-BLU", stock: 5, image: "https://images.unsplash.com/photo-1575633346328-f5bafc397c12?w=500&h=500&fit=crop" },
        { id: 4, variant_type: "color", variant_value: "Merah", sku: "HMP1-RED", stock: 0, image: "https://images.unsplash.com/photo-1595623589518-4aa0d6b05f08?w=500&h=500&fit=crop" },
      ],
      category: { id: 1, category_name: "Hijab Modern", slug: "hijab-modern" }
    },
    {
      id: 2,
      product_name: "Hijab Syar'i Elegan",
      slug: "hijab-syari-elegan",
      base_price: 95000,
      description: "Hijab syar'i dengan material premium dan nyaman",
      status: "active",
      variants: [
        { id: 5, variant_type: "size", variant_value: "M", sku: "HSE-M", stock: 12, image: "https://images.unsplash.com/photo-1609270018887-c1e6db3f6b4f?w=500&h=500&fit=crop" },
        { id: 6, variant_type: "size", variant_value: "L", sku: "HSE-L", stock: 10, image: "https://images.unsplash.com/photo-1614628346961-2cfd8675c8fa?w=500&h=500&fit=crop" },
        { id: 7, variant_type: "color", variant_value: "Coklat", sku: "HSE-BRN", stock: 6, image: "https://images.unsplash.com/photo-1619451334792-150fb9ebc4e5?w=500&h=500&fit=crop" },
        { id: 8, variant_type: "color", variant_value: "Krem", sku: "HSE-CRM", stock: 8, image: "https://images.unsplash.com/photo-1584308666744-24d5f400f6f0?w=500&h=500&fit=crop" },
      ],
      category: { id: 2, category_name: "Hijab Syar'i", slug: "hijab-syari" }
    },
    {
      id: 3,
      product_name: "Pashmina Eksklusif",
      slug: "pashmina-eksklusif",
      base_price: 105000,
      description: "Pashmina eksklusif dengan warna-warna tren",
      status: "active",
      variants: [
        { id: 9, variant_type: "color", variant_value: "Pink", sku: "PEK-PNK", stock: 7, image: "https://images.unsplash.com/photo-1596215898707-a51b2e5fa1d0?w=500&h=500&fit=crop" },
        { id: 10, variant_type: "color", variant_value: "Ungu", sku: "PEK-PUR", stock: 9, image: "https://images.unsplash.com/photo-1583391733351-78691c30dd7d?w=500&h=500&fit=crop" },
        { id: 11, variant_type: "color", variant_value: "Hijau", sku: "PEK-GRN", stock: 4, image: "https://images.unsplash.com/photo-1596215898637-7b0b7a6b1f5e?w=500&h=500&fit=crop" },
        { id: 12, variant_type: "size", variant_value: "S", sku: "PEK-S", stock: 6, image: "https://images.unsplash.com/photo-1609290290969-701c5c9b9dfe?w=500&h=500&fit=crop" },
      ],
      category: { id: 3, category_name: "Pashmina", slug: "pashmina" }
    },
    {
      id: 4,
      product_name: "Bergo Modern Stylish",
      slug: "bergo-modern-stylish",
      base_price: 75000,
      description: "Bergo dengan gaya modern dan nyaman digunakan",
      status: "active",
      variants: [
        { id: 13, variant_type: "color", variant_value: "Abu-abu", sku: "BMS-GRY", stock: 11, image: "https://images.unsplash.com/photo-1594689299771-e6fcb3b4e8f2?w=500&h=500&fit=crop" },
        { id: 14, variant_type: "color", variant_value: "Navy", sku: "BMS-NVY", stock: 8, image: "https://images.unsplash.com/photo-1606008799639-a38ad64da3a8?w=500&h=500&fit=crop" },
        { id: 15, variant_type: "size", variant_value: "One Size", sku: "BMS-OS", stock: 15, image: "https://images.unsplash.com/photo-1582552938406-7e5c72f232ce?w=500&h=500&fit=crop" },
      ],
      category: { id: 4, category_name: "Bergo", slug: "bergo" }
    }
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryFromUrl);
  const [promoOnly, setPromoOnly] = useState(promoFromUrl);
  const [sortMode, setSortMode] = useState<string | null>(sortFromUrl);
  const [loading, setLoading] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await API.get("/products");
      const nextProducts = extractApiList<Product>(res.data);
      if (nextProducts.length > 0) {
        setProducts(nextProducts);
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSelectedCategory(categoryFromUrl);
    setPromoOnly(promoFromUrl);
    setSortMode(sortFromUrl);
    fetchProducts();
  }, [categoryFromUrl, promoFromUrl, sortFromUrl]);

  const chooseCategory = (slug: string | null) => {
    setSelectedCategory(slug);
    const nextParams: Record<string, string> = {};
    if (slug) {
      nextParams.category = slug;
    }
    if (promoOnly) nextParams.promo = "1";
    if (sortMode) nextParams.sort = sortMode;
    setSearchParams(nextParams);
  };

  const clearSpecialFilter = () => {
    setPromoOnly(false);
    setSortMode(null);
    const nextParams: Record<string, string> = {};
    if (selectedCategory) nextParams.category = selectedCategory;
    setSearchParams(nextParams);
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.product_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || product.category?.slug === selectedCategory;
    const matchesPromo = !promoOnly || Boolean(product.has_special_price && product.final_price);
    return matchesSearch && matchesCategory && matchesPromo;
  }).sort((a, b) => {
    if (sortMode === "new") {
      return b.id - a.id;
    }
    if (sortMode === "best-seller") {
      return (b.id % 5) - (a.id % 5);
    }
    return 0;
  });

  const categories = Array.from(
    new Map(
      products
        .filter(p => p.category)
        .map(p => [p.category!.slug, p.category!])
    ).values()
  );
  const selectedCategoryName =
    categories.find((category) => category.slug === selectedCategory)?.category_name ?? null;
  const specialFilterLabel = promoOnly
    ? "Promo Spesial"
    : sortMode === "new"
      ? "Produk Baru"
      : sortMode === "best-seller"
        ? "Best Seller"
        : null;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      {promoOnly ? <PromoSection /> : null}

      {/* Header */}
      <div className="bg-[#fbf7f2] py-8 sm:py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#b9895e]">Shop</p>
          <h1 className="mb-3 text-2xl font-bold text-stone-950 sm:text-3xl">
            {selectedCategoryName ? `Koleksi ${selectedCategoryName}` : "Koleksi Produk"}
          </h1>
          <p className="max-w-2xl text-sm leading-6 text-stone-600 sm:text-base sm:leading-7">
            Temukan hijab dan busana muslim pilihan Aurevina dengan warna lembut, bahan nyaman, dan detail rapi.
          </p>
          {specialFilterLabel ? (
            <button
              type="button"
              onClick={clearSpecialFilter}
              className="mt-4 rounded-full border border-[#8f3d5b] px-4 py-2 text-sm font-semibold text-[#8f3d5b] hover:bg-white"
            >
              Filter aktif: {specialFilterLabel} x
            </button>
          ) : null}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Sidebar - Filter */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
              <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-stone-950">
                <Filter className="h-4 w-4" />
                Filter
              </h3>

              {/* Search */}
              <div className="mb-5">
                <label className="mb-2 block text-sm font-semibold text-stone-700">
                  Cari Produk
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
                  <input
                    type="text"
                    placeholder="Nama produk..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-full border border-stone-300 py-2 pl-9 pr-4 text-sm focus:border-transparent focus:ring-2 focus:ring-[#8f3d5b]"
                  />
                </div>
              </div>

              {/* Categories Filter */}
              <div>
                <label className="mb-3 block text-sm font-semibold text-stone-700">
                  Kategori
                </label>
                <select
                  value={selectedCategory ?? ""}
                  onChange={(event) => chooseCategory(event.target.value || null)}
                  className="w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 shadow-sm focus:border-[#8f3d5b] focus:outline-none focus:ring-2 focus:ring-[#8f3d5b]/15 lg:hidden"
                >
                  <option value="">Semua Kategori</option>
                  {categories.map((category) => (
                    <option key={category.slug} value={category.slug}>
                      {category.category_name}
                    </option>
                  ))}
                </select>
                <div className="hidden space-y-2 lg:block">
                  <button
                    onClick={() => chooseCategory(null)}
                    className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      selectedCategory === null
                        ? "bg-[#8f3d5b] text-white"
                        : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                    }`}
                  >
                    Semua Kategori
                  </button>
                  {categories.map(category => (
                    <button
                      key={category.slug}
                      onClick={() => chooseCategory(category.slug)}
                      className={`w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        selectedCategory === category.slug
                          ? "bg-[#8f3d5b] text-white"
                          : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                      }`}
                    >
                      {category.category_name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-4">
            {loading ? (
              <div className="flex h-72 items-center justify-center">
                <div className="text-gray-500">Memuat produk...</div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex h-72 items-center justify-center">
                <div className="text-gray-500">Tidak ada produk yang ditemukan</div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
                {filteredProducts.map(product => (
                  <Link
                    key={product.id}
                    to={`/products/${product.id}`}
                    state={{ product }}
                    className="cursor-pointer overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#8f3d5b]"
                  >
                    {/* Product Image */}
                    <div className="flex h-32 items-center justify-center bg-[#efe1d4] sm:h-48">
                      {product.main_image ? (
                        <img
                          src={product.main_image}
                          alt={product.product_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ShoppingCart className="h-8 w-8 text-[#8f3d5b] sm:h-9 sm:w-9" />
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-2.5 sm:p-3.5">
                      <div className="mb-2">
                        <span className="inline-block rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-[#8f3d5b] sm:px-2.5 sm:py-1 sm:text-[11px]">
                          {product.category?.category_name || "Produk"}
                        </span>
                      </div>
                      <h3 className="mb-1.5 line-clamp-2 text-[13px] font-bold leading-4 text-stone-950 sm:text-[15px] sm:leading-5">
                        {product.product_name}
                      </h3>
                      <p className="mb-3 hidden text-xs leading-5 text-stone-600 sm:line-clamp-2">
                        {product.description}
                      </p>

                      {/* Rating */}
                      <div className="mb-2 flex items-center gap-0.5 sm:mb-3 sm:gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${i < Math.round(Number(product.rating_average || 0)) ? "fill-yellow-400 text-yellow-400" : "text-stone-300"}`}
                          />
                        ))}
                        <span className="ml-1 hidden text-[10px] text-gray-500 sm:inline sm:text-[11px]">
                          {Number(product.rating_average || 0).toFixed(1)} ({product.reviews_count || 0} ulasan)
                        </span>
                      </div>

                      {/* Price & Button */}
                      <div className="flex items-center justify-between">
                        <div>
                          {product.has_special_price && product.final_price ? (
                            <div className="flex flex-wrap items-baseline gap-2">
                              <span className="text-[11px] font-semibold text-red-500 sm:text-xs">
                                -{discountPercent(product.base_price, product.final_price)}%
                              </span>
                              <span className="whitespace-nowrap text-[13px] font-bold text-stone-950 sm:text-base">{formatPrice(product.final_price)}</span>
                              <span className="text-[10px] text-stone-400 line-through sm:text-xs">{formatPrice(product.base_price)}</span>
                            </div>
                          ) : (
                            <div className="whitespace-nowrap text-[13px] font-bold text-[#8f3d5b] sm:text-base">{formatPrice(product.base_price)}</div>
                          )}
                        </div>
                        <span
                          className="rounded-full bg-[#8f3d5b] p-2 text-white transition-colors hover:bg-[#76304a]"
                          aria-label={`Lihat detail ${product.product_name}`}
                        >
                          <ShoppingCart className="h-4 w-4" />
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
