import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ShoppingCart, Star } from "lucide-react";
import API, { extractApiList } from "../services/api";

interface ProductVariant {
  id: number;
  variant_type: string;
  variant_value: string;
  sku: string;
  color?: string | null;
  size?: string | null;
  stock: number;
  additional_price?: number;
  image?: string | null;
  variant_image?: string | null;
}

interface Product {
  id: number;
  product_name: string;
  slug: string;
  description?: string;
  base_price: number;
  special_price?: number | null;
  has_special_price?: boolean;
  final_price?: number;
  main_image?: string | null;
  status: string;
  sold_count?: number;
  rating_average?: number;
  reviews_count?: number;
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

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await API.get("/products", {
          params: {
            featured: 1,
          },
        });
        setProducts(extractApiList<Product>(res.data).slice(0, 8));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-64 items-center justify-center">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-[#8f3d5b]" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#b9895e]">Best Seller</p>
            <h2 className="mt-2 text-2xl font-bold text-stone-950 sm:text-3xl">Produk Unggulan</h2>
            <p className="mt-2 text-sm text-stone-600 sm:text-base">Favorit pelanggan untuk tampilan harian, acara, dan koleksi warna lembut.</p>
          </div>
          <Link
            to="/products"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-[#8f3d5b] px-4 py-2.5 text-sm font-semibold text-[#8f3d5b] transition-colors hover:bg-rose-50"
          >
            Lihat Semua Produk
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-10 text-center text-stone-500">
            Belum ada produk unggulan.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
            {products.map((product, index) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                state={{ product }}
                className="group cursor-pointer overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#8f3d5b]"
              >
                <div className="relative h-32 overflow-hidden bg-stone-100 sm:h-52">
                  {product.main_image ? (
                    <img
                      src={product.main_image}
                      alt={product.product_name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-stone-400">
                      <ShoppingCart className="h-9 w-9" />
                    </div>
                  )}
                  <div className="absolute left-2 top-2 rounded-full bg-[#8f3d5b] px-2 py-0.5 text-[10px] font-semibold text-white sm:left-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-[11px]">
                    #{index + 1} Terlaris
                  </div>
                  <div className="absolute right-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-stone-700 sm:right-3 sm:top-3 sm:px-2.5 sm:py-1 sm:text-[11px]">
                    Terjual {product.sold_count ?? 0}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-stone-950/25 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                </div>

                <div className="p-2.5 sm:p-4">
                  <div className="mb-2 flex flex-wrap gap-1.5 sm:gap-2">
                    <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-[#8f3d5b] sm:px-2.5 sm:py-1 sm:text-[11px]">
                      {product.category?.category_name || "Produk"}
                    </span>
                    {product.variants && product.variants.length > 0 ? (
                      <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-600 sm:px-2.5 sm:py-1 sm:text-[11px]">
                        <span className="sm:hidden">{product.variants.length}</span>
                        <span className="hidden sm:inline">{product.variants.length} varian</span>
                      </span>
                    ) : null}
                  </div>

                  <h3 className="line-clamp-2 text-[13px] font-bold leading-4 text-stone-950 sm:text-[15px] sm:leading-5">
                    {product.product_name}
                  </h3>
                  <p className="mt-1.5 hidden text-xs leading-5 text-stone-600 sm:line-clamp-2">
                    {product.description || "Produk pilihan Aurevina."}
                  </p>

                  <div className="mt-2 flex items-center gap-0.5 sm:mt-3 sm:gap-1">
                    {[...Array(5)].map((_, i) => {
                      const rating = Number(product.rating_average || 0);
                      return (
                        <Star
                          key={i}
                          className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${i < Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                        />
                      );
                    })}
                    <span className="ml-1 hidden text-[10px] text-stone-600 sm:inline sm:text-xs">
                      {Number(product.rating_average || 0).toFixed(1)} ({product.reviews_count || 0} ulasan)
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2 sm:mt-4 sm:gap-3">
                    <div>
                      <p className="text-[10px] font-medium text-stone-500 sm:text-[11px]">Mulai dari</p>
                      {product.has_special_price && product.final_price ? (
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="text-[11px] font-semibold text-red-500 sm:text-xs">
                            -{discountPercent(product.base_price, product.final_price)}%
                          </span>
                          <span className="whitespace-nowrap text-[13px] font-bold text-stone-950 sm:text-lg">{formatPrice(product.final_price)}</span>
                          <span className="text-[10px] text-stone-400 line-through sm:text-xs">{formatPrice(product.base_price)}</span>
                        </div>
                      ) : (
                        <p className="whitespace-nowrap text-[13px] font-bold text-stone-950 sm:text-lg">{formatPrice(product.base_price)}</p>
                      )}
                    </div>
                    <span
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#8f3d5b] text-white transition-colors hover:bg-[#76304a] sm:h-9 sm:w-9"
                      aria-label={`Pilih varian ${product.product_name}`}
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
    </section>
  );
}
