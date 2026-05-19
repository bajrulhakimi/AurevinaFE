import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import API, { extractApiList } from "../services/api";

interface Product {
  id: number;
  product_name: string;
  slug: string;
  base_price: number;
  final_price?: number;
  has_special_price?: boolean;
  main_image?: string | null;
  category?: {
    category_name: string;
  };
}

const formatPrice = (value: number) => `Rp${Number(value).toLocaleString("id-ID")}`;

const discountPercent = (basePrice: number, finalPrice?: number) => {
  if (!finalPrice || finalPrice >= basePrice) return 0;
  return Math.round(((basePrice - finalPrice) / basePrice) * 100);
};

export default function PromoSection() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    API.get("/products")
      .then((response) => {
        const specialProducts = extractApiList<Product>(response.data)
          .filter((product) => product.has_special_price && product.final_price)
          .slice(0, 4);
        setProducts(specialProducts);
      })
      .catch(() => setProducts([]));
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="bg-[#15110f] py-8 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#d9b17c]">Harga Spesial</p>
            <h2 className="mt-1.5 text-2xl font-bold text-[#d9b17c]">Promo pilihan hari ini</h2>
            <p className="mt-1.5 max-w-2xl text-xs leading-5 text-stone-300">
              Kode promo hanya dikirim lewat email. Di website, customer cukup melihat produk dengan harga spesial aktif.
            </p>
          </div>
          <Link to="/products?promo=1" className="text-sm font-bold text-[#d9b17c] hover:text-white">
            Lihat Semua Promo
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {products.map((product) => {
            const finalPrice = Number(product.final_price || product.base_price);
            const discount = discountPercent(Number(product.base_price), finalPrice);

            return (
              <Link
                key={product.id}
                to={`/products/${product.id}`}
                className="group overflow-hidden rounded-xl border border-white/10 bg-white/[0.06] transition hover:-translate-y-1 hover:bg-white/[0.1]"
              >
                <div className="aspect-square bg-white/10">
                  {product.main_image ? (
                    <img src={product.main_image} alt={product.product_name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-stone-400">
                      <ShoppingBag className="h-10 w-10" />
                    </div>
                  )}
                </div>
                <div className="p-3.5">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#d9b17c]">
                    {product.category?.category_name || "Produk Promo"}
                  </p>
                  <h3 className="mt-2 line-clamp-2 min-h-[2.25rem] text-[13px] font-bold leading-4 sm:min-h-[2.5rem] sm:text-sm sm:leading-5">{product.product_name}</h3>
                  <div className="mt-2.5 flex flex-wrap items-baseline gap-2">
                    {discount > 0 ? <span className="text-[11px] font-semibold text-red-400 sm:text-xs">-{discount}%</span> : null}
                    <span className="text-sm font-black text-white sm:text-lg">{formatPrice(finalPrice)}</span>
                    <span className="text-[10px] text-stone-400 line-through sm:text-xs">{formatPrice(Number(product.base_price))}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
