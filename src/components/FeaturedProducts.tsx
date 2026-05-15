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
        setProducts(extractApiList<Product>(res.data).slice(0, 6));
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
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-96 items-center justify-center">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#8f3d5b]" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b9895e]">Best Seller</p>
            <h2 className="mt-3 text-4xl font-bold text-stone-950">Produk Unggulan</h2>
            <p className="mt-3 text-lg text-stone-600">Favorit pelanggan untuk tampilan harian, acara, dan koleksi warna lembut.</p>
          </div>
          <Link
            to="/products"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-[#8f3d5b] px-5 py-3 text-sm font-semibold text-[#8f3d5b] transition-colors hover:bg-rose-50"
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
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product, index) => (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                state={{ product }}
                className="group cursor-pointer overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-[#8f3d5b]"
              >
                <div className="relative h-72 overflow-hidden bg-stone-100">
                  {product.main_image ? (
                    <img
                      src={product.main_image}
                      alt={product.product_name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-stone-400">
                      <ShoppingCart className="h-12 w-12" />
                    </div>
                  )}
                  <div className="absolute left-4 top-4 rounded-full bg-[#8f3d5b] px-3 py-1 text-xs font-semibold text-white">
                    #{index + 1} Terlaris
                  </div>
                  <div className="absolute right-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-stone-700">
                    Terjual {product.sold_count ?? 0}
                  </div>
                  <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-stone-950/25 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                </div>

                <div className="p-6">
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-[#8f3d5b]">
                      {product.category?.category_name || "Produk"}
                    </span>
                    {product.variants && product.variants.length > 0 ? (
                      <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-600">
                        {product.variants.length} varian
                      </span>
                    ) : null}
                  </div>

                  <h3 className="line-clamp-2 text-lg font-bold text-stone-950">
                    {product.product_name}
                  </h3>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-600">
                    {product.description || "Produk pilihan Aurevina."}
                  </p>

                  <div className="mt-4 flex items-center gap-1">
                    {[...Array(5)].map((_, i) => {
                      const rating = Number(product.rating_average || 0);
                      return (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                        />
                      );
                    })}
                    <span className="ml-2 text-sm text-stone-600">
                      {Number(product.rating_average || 0).toFixed(1)} ({product.reviews_count || 0} ulasan)
                    </span>
                  </div>

                  <div className="mt-5 flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium text-stone-500">Mulai dari</p>
                      {product.has_special_price && product.final_price ? (
                        <div className="flex flex-wrap items-baseline gap-2">
                          <span className="text-sm font-semibold text-red-500">
                            -{discountPercent(product.base_price, product.final_price)}%
                          </span>
                          <span className="text-2xl font-bold text-stone-950">{formatPrice(product.final_price)}</span>
                          <span className="text-sm text-stone-400 line-through">{formatPrice(product.base_price)}</span>
                        </div>
                      ) : (
                        <p className="text-2xl font-bold text-stone-950">{formatPrice(product.base_price)}</p>
                      )}
                    </div>
                    <span
                      className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#8f3d5b] text-white transition-colors hover:bg-[#76304a]"
                      aria-label={`Pilih varian ${product.product_name}`}
                    >
                      <ShoppingCart className="h-5 w-5" />
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
