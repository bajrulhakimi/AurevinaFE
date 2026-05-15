import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BadgeCheck, Heart, ShieldCheck, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import API, { extractApiList } from "../services/api";
import heroImage from "../assets/hero.png";
import logo1 from "../assets/logo1.png";

interface HeroProduct {
  id: number;
  product_name: string;
  slug: string;
  base_price: number;
  final_price?: number;
  has_special_price?: boolean;
  main_image?: string | null;
  category?: {
    category_name?: string;
    name?: string;
  };
}

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const discountPercent = (basePrice: number, finalPrice?: number) => {
  if (!finalPrice || finalPrice >= basePrice) return 0;
  return Math.round(((basePrice - finalPrice) / basePrice) * 100);
};

export default function Hero() {
  const [products, setProducts] = useState<HeroProduct[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const fetchHeroProducts = async () => {
      try {
        const response = await API.get("/products", {
          params: {
            hero: 1,
          },
        });
        const nextProducts = extractApiList<HeroProduct>(response.data)
          .filter((product) => Boolean(product.main_image))
          .slice(0, 4);
        setProducts(nextProducts);
      } catch (error) {
        console.error("Failed to load hero products:", error);
      }
    };

    fetchHeroProducts();
  }, []);

  useEffect(() => {
    if (products.length <= 1) return;

    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % products.length);
    }, 4000);

    return () => window.clearInterval(timer);
  }, [products.length]);

  const activeProduct = products[activeIndex] ?? null;
  const heroImages = useMemo(() => products.map((product) => product.main_image).filter(Boolean), [products]);
  const backgroundImage = activeProduct?.main_image || heroImage;
  const activeFinalPrice = activeProduct?.has_special_price && activeProduct.final_price ? activeProduct.final_price : activeProduct?.base_price ?? 0;
  const activeDiscount = activeProduct ? discountPercent(activeProduct.base_price, activeProduct.final_price) : 0;

  return (
    <section className="relative overflow-hidden bg-[#fbf7f2]">
      <div className="absolute inset-0">
        <img src={backgroundImage} alt="" className="h-full w-full object-cover opacity-20" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#fbf7f2_0%,rgba(251,247,242,0.96)_35%,rgba(251,247,242,0.72)_100%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 lg:px-8 lg:pb-20 lg:pt-16">
        <div className="grid min-h-[calc(100vh-88px)] grid-cols-1 items-center gap-12 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="max-w-2xl space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#e8c7b4] bg-white/70 px-4 py-2 text-[#8f3d5b] shadow-sm backdrop-blur">
              <img src={logo1} alt="Aurevina Logo" className="h-6 w-6 object-contain" />
              <span className="text-sm font-semibold">Aurevina Modest Fashion</span>
            </div>

            <h1 className="max-w-3xl text-5xl font-bold leading-[1.05] text-stone-950 sm:text-6xl lg:text-7xl">
              Hijab premium untuk gaya anggun setiap hari.
            </h1>

            <p className="max-w-xl text-lg leading-8 text-stone-600 sm:text-xl">
              Pilihan pashmina, bergo, dan hijab syar'i dengan bahan nyaman, warna lembut,
              dan potongan rapi untuk tampilan modest yang terlihat mahal tanpa terasa berlebihan.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                to="/products"
                className="group inline-flex items-center justify-center rounded-full bg-[#8f3d5b] px-8 py-4 font-semibold text-white shadow-lg shadow-rose-900/10 transition-colors hover:bg-[#76304a]"
              >
                <ShoppingBag className="mr-2 h-5 w-5" />
                Belanja Sekarang
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
              {/* <Link
                to="/#kategori"
                className="inline-flex items-center justify-center rounded-full border border-[#b9895e] bg-white/60 px-8 py-4 font-semibold text-[#6f5135] transition-colors hover:bg-white"
              >
                Lihat Kategori
              </Link> */}
            </div>

            <div className="grid grid-cols-1 gap-3 pt-3 sm:grid-cols-3">
              <div className="rounded-xl border border-white/70 bg-white/55 p-4 shadow-sm backdrop-blur">
                <BadgeCheck className="mb-3 h-5 w-5 text-[#8f3d5b]" />
                <div className="text-2xl font-bold text-stone-950">500+</div>
                <div className="text-sm text-stone-600">Produk pilihan</div>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/55 p-4 shadow-sm backdrop-blur">
                <Heart className="mb-3 h-5 w-5 text-[#d15f73]" />
                <div className="text-2xl font-bold text-stone-950">10K+</div>
                <div className="text-sm text-stone-600">Pelanggan puas</div>
              </div>
              <div className="rounded-xl border border-white/70 bg-white/55 p-4 shadow-sm backdrop-blur">
                <ShieldCheck className="mb-3 h-5 w-5 text-[#b9895e]" />
                <div className="text-2xl font-bold text-stone-950">4.8/5</div>
                <div className="text-sm text-stone-600">Rating toko</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative mx-auto max-w-[560px] overflow-hidden rounded-[32px] border border-white/80 bg-white/75 p-4 shadow-2xl shadow-stone-900/10 backdrop-blur md:p-5">
              {activeProduct ? (
                <>
                  <Link
                    to={`/products/${activeProduct.id}`}
                    state={{ product: activeProduct }}
                    className="group block focus:outline-none focus:ring-2 focus:ring-[#8f3d5b] focus:ring-offset-4"
                  >
                    <div className="relative aspect-square overflow-hidden rounded-[26px] bg-stone-100">
                      {heroImages.map((image, index) => (
                        <img
                          key={`${image}-${index}`}
                          src={image || ""}
                          alt={products[index]?.product_name || "Produk Aurevina"}
                          className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${
                            index === activeIndex ? "scale-100 opacity-100" : "scale-105 opacity-0"
                          }`}
                        />
                      ))}
                      <div className="absolute left-4 top-4 rounded-full bg-white/90 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#8f3d5b] shadow-sm backdrop-blur">
                        Paling Dicari
                      </div>
                      <div className="absolute right-4 top-4 rounded-full bg-stone-950/75 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                        {activeIndex + 1}/{products.length}
                      </div>
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-stone-950 via-stone-950/72 to-transparent p-6 pt-28 text-white">
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#f0cfaa]">
                          {activeProduct.category?.category_name || activeProduct.category?.name || "Produk Pilihan"}
                        </p>
                        <h2 className="mt-2 line-clamp-2 text-2xl font-bold leading-snug text-white">
                          {activeProduct.product_name}
                        </h2>
                        <div className="mt-2 flex flex-wrap items-baseline gap-2">
                          {activeProduct.has_special_price && activeDiscount > 0 ? (
                            <span className="text-sm font-semibold text-red-300">-{activeDiscount}%</span>
                          ) : null}
                          <span className="text-lg font-bold">{formatRupiah(activeFinalPrice)}</span>
                          {activeProduct.has_special_price ? (
                            <span className="text-sm text-stone-300 line-through">{formatRupiah(activeProduct.base_price)}</span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </Link>

                  <div className="mt-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      {products.map((product, index) => (
                        <button
                          key={product.id}
                          type="button"
                          onClick={() => setActiveIndex(index)}
                          className={`h-2.5 rounded-full transition-all ${
                            index === activeIndex ? "w-8 bg-[#8f3d5b]" : "w-2.5 bg-stone-300 hover:bg-stone-400"
                          }`}
                          aria-label={`Tampilkan ${product.product_name}`}
                        />
                      ))}
                    </div>
                    <Link
                      to={`/products/${activeProduct.id}`}
                      state={{ product: activeProduct }}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-[#8f3d5b] hover:text-[#76304a]"
                    >
                      Lihat Produk
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </>
              ) : (
                <div className="flex aspect-square items-center justify-center overflow-hidden rounded-[26px] bg-[#efe1d4]">
                  <div className="text-center">
                    <ShoppingBag className="mx-auto mb-4 h-24 w-24 text-[#8f3d5b] opacity-70" />
                    <p className="text-lg font-semibold text-stone-700">Koleksi Fashion Premium</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
