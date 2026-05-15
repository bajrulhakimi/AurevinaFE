import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MessageCircle, Minus, Package, Plus, ShoppingCart, Star } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import API, { getApiErrorMessage } from "../services/api";
import { useCart } from "../context/useCart";
import { useAuth } from "../context/useAuth";

interface ProductImage {
  id: number;
  image_url?: string | null;
}

interface ProductVariant {
  id: number;
  sku?: string;
  color?: string | null;
  size?: string | null;
  variant_type?: string;
  variant_value?: string;
  stock: number;
  additional_price?: number;
  image?: string | null;
  variant_image?: string | null;
}

interface Product {
  id: number;
  product_name: string;
  slug: string;
  description?: string | null;
  base_price: number;
  special_price?: number | null;
  has_special_price?: boolean;
  final_price?: number;
  total_stock?: number;
  rating_average?: number;
  reviews_count?: number;
  main_image?: string | null;
  images?: ProductImage[];
  variants?: ProductVariant[];
  reviews?: ProductReview[];
  category?: {
    id: number;
    category_name?: string;
    name?: string;
    slug?: string;
  };
}

interface ProductReview {
  id: number;
  rating: number;
  review: string;
  admin_reply?: string | null;
  replied_at?: string | null;
  created_at: string;
  user?: {
    name: string;
  };
}

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const discountPercent = (basePrice: number, finalPrice: number) => {
  if (!finalPrice || finalPrice >= basePrice) return 0;
  return Math.round(((basePrice - finalPrice) / basePrice) * 100);
};

const variantName = (variant: ProductVariant) =>
  (variant.color || variant.variant_value || "").trim();

const isColorVariant = (variant: ProductVariant) => {
  const name = variantName(variant);
  return name !== "" && name !== "-";
};

export default function ProductDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated, isCustomer } = useAuth();
  const fallbackProduct = (location.state as { product?: Product } | null)?.product ?? null;
  const [product, setProduct] = useState<Product | null>(fallbackProduct);
  const [selectedImage, setSelectedImage] = useState<string | null>(
    fallbackProduct?.main_image || fallbackProduct?.images?.[0]?.image_url || null
  );
  const [selectedVariantId, setSelectedVariantId] = useState<number | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);
      try {
        const response = await API.get(`/products/${id}`);
        const nextProduct = response.data?.data as Product;
        setProduct(nextProduct);
        setSelectedImage(nextProduct.main_image || nextProduct.images?.[0]?.image_url || null);
        const firstVariant = nextProduct.variants?.find(isColorVariant);
        setSelectedVariantId(firstVariant?.id ?? null);
      } catch (err) {
        console.error(err);
        if (!fallbackProduct) {
          setError(getApiErrorMessage(err, "Produk tidak dapat dimuat."));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [fallbackProduct, id]);

  const colorVariants = useMemo(
    () => product?.variants?.filter(isColorVariant) ?? [],
    [product?.variants]
  );
  const selectedVariant = colorVariants.find((variant) => variant.id === selectedVariantId) ?? null;
  const displayBasePrice = product?.has_special_price && product.final_price ? product.final_price : product?.base_price ?? 0;
  const currentPrice = displayBasePrice + (selectedVariant?.additional_price ?? 0);
  const originalPrice = (product?.base_price ?? 0) + (selectedVariant?.additional_price ?? 0);
  const currentDiscount = discountPercent(originalPrice, currentPrice);
  const availableStock = selectedVariant ? selectedVariant.stock : product?.total_stock ?? 0;
  const ratingAverage = Number(product?.rating_average ?? 0);
  const reviewsCount = Number(product?.reviews_count ?? product?.reviews?.length ?? 0);
  const galleryImages = useMemo(() => {
    const images = [
      product?.main_image,
      ...(product?.images?.map((image) => image.image_url) ?? []),
      ...colorVariants.map((variant) => variant.image || variant.variant_image),
    ].filter((image): image is string => Boolean(image));

    return Array.from(new Set(images));
  }, [colorVariants, product?.images, product?.main_image]);

  const handleSelectVariant = (variant: ProductVariant) => {
    setSelectedVariantId(variant.id);
    setQuantity(1);
    const image = variant.image || variant.variant_image || product?.main_image || null;
    setSelectedImage(image);
  };

  const handleAddToCart = () => {
    if (!product) return;

    if (colorVariants.length > 0 && !selectedVariant) {
      alert("Pilih warna terlebih dahulu.");
      return;
    }

    if (availableStock <= 0) {
      alert("Stok produk ini sedang habis.");
      return;
    }

    const finalQuantity = Math.min(quantity, availableStock);
    const colorLabel = selectedVariant ? variantName(selectedVariant) : "";

    addToCart({
      id: selectedVariant ? `${product.id}-${selectedVariant.id}` : product.id,
      product_id: product.id,
      variant_id: selectedVariant?.id ?? null,
      product_name: `${product.product_name}${colorLabel ? ` - ${colorLabel}` : ""}`,
      base_price: currentPrice,
      quantity: finalQuantity,
      slug: product.slug,
    });

    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  const refreshProduct = async () => {
    if (!id) return;
    const response = await API.get(`/products/${id}`);
    setProduct(response.data?.data as Product);
  };

  const handleSubmitReview = async (event: FormEvent) => {
    event.preventDefault();
    if (!product || !reviewText.trim()) return;

    setReviewSubmitting(true);
    setReviewError(null);
    try {
      await API.post("/reviews", {
        product_id: product.id,
        rating: reviewRating,
        review: reviewText.trim(),
      });
      setReviewText("");
      setReviewRating(5);
      await refreshProduct();
    } catch (err) {
      setReviewError(getApiErrorMessage(err, "Ulasan gagal dikirim."));
    } finally {
      setReviewSubmitting(false);
    }
  };

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

  if (error || !product) {
    return (
      <div className="min-h-screen bg-[#fbf7f2]">
        <Navbar />
        <main className="mx-auto max-w-4xl px-4 py-16 text-center">
          <Package className="mx-auto h-14 w-14 text-slate-300" />
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Produk tidak ditemukan</h1>
          <p className="mt-2 text-slate-600">{error || "Produk yang kamu buka tidak tersedia."}</p>
          <Link
            to="/products"
            className="mt-6 inline-flex rounded-xl bg-[#8f3d5b] px-5 py-3 font-semibold text-white hover:bg-[#76304a]"
          >
            Kembali ke Produk
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fbf7f2]">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#8f3d5b] hover:text-[#76304a]"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </button>

        <section className="overflow-hidden rounded-[28px] border border-white/80 bg-white shadow-xl shadow-stone-900/5">
          <div className="grid gap-0 lg:grid-cols-[48%_52%]">
            <div className="border-b border-stone-200 p-4 sm:p-6 lg:border-b-0 lg:border-r">
              <div className="aspect-square overflow-hidden rounded-2xl bg-[#efe1d4]">
                {selectedImage ? (
                  <img src={selectedImage} alt={product.product_name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-slate-300">
                    <Package className="h-20 w-20" />
                  </div>
                )}
              </div>

              {galleryImages.length > 0 ? (
                <div className="mt-4 grid grid-cols-5 gap-3">
                  {galleryImages.slice(0, 5).map((image) => (
                    <button
                      key={image}
                      type="button"
                      onClick={() => setSelectedImage(image)}
                      className={`aspect-square overflow-hidden rounded-lg border bg-slate-100 ${
                        selectedImage === image ? "border-[#8f3d5b] ring-2 ring-rose-100" : "border-stone-200"
                      }`}
                    >
                      <img src={image} alt="Foto produk" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="p-5 sm:p-7">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-[#8f3d5b]">
                  {product.category?.category_name || product.category?.name || "Produk"}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  Stok {availableStock}
                </span>
              </div>

              <h1 className="mt-4 text-2xl font-bold leading-tight text-slate-950 sm:text-3xl">
                {product.product_name}
              </h1>

              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-slate-600">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, index) => (
                    <Star
                      key={index}
                      className={`h-4 w-4 ${index < Math.round(ratingAverage) ? "fill-yellow-400 text-yellow-400" : "text-slate-300"}`}
                    />
                  ))}
                </div>
                <span>{ratingAverage > 0 ? ratingAverage.toFixed(1) : "Belum ada rating"} dari {reviewsCount} ulasan</span>
                <span className="hidden h-4 w-px bg-slate-200 sm:block" />
                <span>SKU {selectedVariant?.sku || product.slug}</span>
              </div>

              <div className="mt-6 rounded-2xl bg-[#fbf7f2] px-5 py-4">
                <p className="text-sm font-medium text-slate-500">Harga</p>
                <div className="mt-1 flex flex-wrap items-end gap-3">
                  {product.has_special_price && currentDiscount > 0 ? (
                    <span className="pb-1 text-base font-semibold text-red-500">-{currentDiscount}%</span>
                  ) : null}
                  <p className="text-3xl font-bold text-stone-950">{formatRupiah(currentPrice)}</p>
                  {product.has_special_price ? <p className="pb-1 text-sm text-slate-400 line-through">{formatRupiah(originalPrice)}</p> : null}
                </div>
                {product.has_special_price ? <p className="mt-2 text-sm font-semibold text-amber-700">Harga spesial aktif</p> : null}
              </div>

              {colorVariants.length > 0 ? (
                <div className="mt-6">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-sm font-bold text-slate-900">Pilih Warna</h2>
                    <span className="text-xs font-semibold text-slate-400">{colorVariants.length} pilihan</span>
                  </div>
                  <div className="mt-3 max-h-[276px] overflow-y-auto pr-2 [scrollbar-color:#8f8f8f_transparent] [scrollbar-width:thin]">
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {colorVariants.map((variant) => {
                      const image = variant.image || variant.variant_image || product.main_image;
                      const selected = selectedVariantId === variant.id;

                      return (
                        <button
                          key={variant.id}
                          type="button"
                          disabled={variant.stock <= 0}
                          onClick={() => handleSelectVariant(variant)}
                          className={`flex min-h-[64px] items-center gap-3 rounded-xl border bg-white p-2 text-left transition ${
                            selected ? "border-[#8f3d5b] bg-rose-50 ring-2 ring-rose-100" : "border-stone-200 hover:border-[#d9a66f]"
                          } ${variant.stock <= 0 ? "cursor-not-allowed opacity-50" : ""}`}
                        >
                          <span className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                            {image ? <img src={image} alt={variantName(variant)} className="h-full w-full object-cover" /> : null}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-slate-900">{variantName(variant)}</span>
                            <span className="text-xs text-slate-500">{variant.stock <= 0 ? "Habis" : `Stok ${variant.stock}`}</span>
                          </span>
                        </button>
                      );
                    })}
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="mt-6">
                <h2 className="text-sm font-bold text-slate-900">Jumlah</h2>
                <div className="mt-3 flex items-center gap-4">
                  <div className="flex items-center overflow-hidden rounded-xl border border-slate-300 bg-white">
                    <button
                      type="button"
                      onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                      className="p-3 text-slate-600 hover:bg-[#fbf7f2]"
                      aria-label="Kurangi jumlah"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-14 text-center font-bold text-slate-900">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity((current) => Math.min(availableStock || current + 1, current + 1))}
                      className="p-3 text-slate-600 hover:bg-[#fbf7f2]"
                      aria-label="Tambah jumlah"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-sm text-slate-500">Tersedia {availableStock}</p>
                </div>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-[1fr_auto]">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={availableStock <= 0}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-bold transition ${
                    added
                      ? "bg-green-600 text-white"
                      : "bg-[#8f3d5b] text-white hover:bg-[#76304a] disabled:cursor-not-allowed disabled:bg-slate-300"
                  }`}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {added ? "Masuk Keranjang" : "Tambah ke Keranjang"}
                </button>
                <Link
                  to="/cart"
                  className="inline-flex items-center justify-center rounded-xl border border-[#8f3d5b] px-5 py-3 font-bold text-[#8f3d5b] hover:bg-rose-50"
                >
                  Lihat Keranjang
                </Link>
                <Link
                  to={isAuthenticated ? `/chat?product_id=${product.id}` : `/login?redirect=${encodeURIComponent(`/chat?product_id=${product.id}`)}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d9a66f] px-5 py-3 font-bold text-[#8f3d5b] hover:bg-[#fbf7f2] sm:col-span-2"
                >
                  <MessageCircle className="h-5 w-5" />
                  Tanya Produk Ini
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[24px] border border-white/80 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-950">Detail Produk</h2>
          <div className="mt-4 whitespace-pre-line leading-7 text-slate-700">
            {product.description || "Belum ada deskripsi produk."}
          </div>
        </section>

        <section className="mt-6 rounded-[24px] border border-white/80 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-950">Rating & Ulasan</h2>
              <p className="mt-1 text-sm text-slate-500">Ulasan berasal dari pelanggan dan balasan resmi dari penjual.</p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-rose-50 px-4 py-2 text-[#8f3d5b]">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-bold">{ratingAverage > 0 ? ratingAverage.toFixed(1) : "0.0"}</span>
              <span className="text-sm text-stone-500">({reviewsCount})</span>
            </div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-4">
              {product.reviews?.length ? (
                product.reviews.map((review) => (
                  <article key={review.id} className="rounded-2xl border border-stone-100 bg-[#fbf7f2] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-stone-950">{review.user?.name || "Pelanggan"}</p>
                        <p className="text-xs text-stone-500">{new Date(review.created_at).toLocaleDateString("id-ID")}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, index) => (
                          <Star key={index} className={`h-4 w-4 ${index < review.rating ? "fill-yellow-400 text-yellow-400" : "text-stone-300"}`} />
                        ))}
                      </div>
                    </div>
                    <p className="mt-3 leading-7 text-stone-700">{review.review}</p>
                    {review.admin_reply ? (
                      <div className="mt-4 rounded-2xl border border-[#ead2b8] bg-white p-4">
                        <p className="text-sm font-bold text-[#8f3d5b]">Balasan Penjual</p>
                        <p className="mt-2 leading-7 text-stone-700">{review.admin_reply}</p>
                      </div>
                    ) : null}
                  </article>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-stone-300 bg-[#fbf7f2] p-8 text-center text-stone-500">
                  Belum ada ulasan untuk produk ini.
                </div>
              )}
            </div>

            <form onSubmit={handleSubmitReview} className="rounded-2xl border border-stone-100 bg-stone-950 p-5 text-white">
              <h3 className="text-lg font-bold">Tulis Ulasan</h3>
              <p className="mt-1 text-sm text-stone-300">
                {isAuthenticated && isCustomer ? "Bagikan pengalaman kamu setelah memakai produk." : "Login sebagai pelanggan untuk memberi ulasan."}
              </p>

              <div className="mt-5 flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    disabled={!isAuthenticated || !isCustomer}
                    onClick={() => setReviewRating(value)}
                    className="disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={`${value} bintang`}
                  >
                    <Star className={`h-7 w-7 ${value <= reviewRating ? "fill-yellow-400 text-yellow-400" : "text-stone-600"}`} />
                  </button>
                ))}
              </div>

              <textarea
                value={reviewText}
                onChange={(event) => setReviewText(event.target.value)}
                rows={5}
                disabled={!isAuthenticated || !isCustomer}
                placeholder="Ceritakan kualitas bahan, warna, ukuran, atau pengalaman belanja..."
                className="mt-4 w-full rounded-2xl border border-white/10 bg-white/10 p-4 text-sm text-white placeholder:text-stone-400 focus:border-[#d9a66f] focus:outline-none focus:ring-2 focus:ring-[#d9a66f]/20 disabled:cursor-not-allowed disabled:opacity-60"
              />

              {reviewError ? <p className="mt-3 text-sm text-red-200">{reviewError}</p> : null}

              {isAuthenticated && isCustomer ? (
                <button
                  type="submit"
                  disabled={reviewSubmitting || !reviewText.trim()}
                  className="mt-4 w-full rounded-full bg-[#d9a66f] px-5 py-3 font-bold text-stone-950 hover:bg-[#e8b983] disabled:cursor-not-allowed disabled:bg-stone-500"
                >
                  {reviewSubmitting ? "Mengirim..." : "Kirim Ulasan"}
                </button>
              ) : (
                <Link to={`/login?redirect=/products/${product.id}`} className="mt-4 inline-flex w-full justify-center rounded-full bg-[#d9a66f] px-5 py-3 font-bold text-stone-950 hover:bg-[#e8b983]">
                  Login untuk Ulasan
                </Link>
              )}
            </form>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
