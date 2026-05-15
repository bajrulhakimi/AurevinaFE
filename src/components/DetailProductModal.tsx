import { X, ShoppingCart, Star, Plus, Minus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "../context/useCart";

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
  base_price: number;
  main_image?: string | null;
  status: string;
  variants?: ProductVariant[];
}

interface DetailProductModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export default function DetailProductModal({
  product,
  isOpen,
  onClose,
}: DetailProductModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isAdded, setIsAdded] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setSelectedColor(null);
      setSelectedSize(null);
      setIsAdded(false);
    }
  }, [isOpen, product.id]);

  const colorVariants = product.variants?.filter((variant) => variant.variant_type === "color") || [];
  const sizeVariants = product.variants?.filter((variant) => variant.variant_type === "size") || [];
  const selectedVariant = useMemo(() => {
    return product.variants?.find((variant) => {
      const colorMatches = !selectedColor || variant.variant_value === selectedColor || variant.color === selectedColor;
      const sizeMatches = !selectedSize || variant.size === selectedSize || variant.variant_value === selectedSize;
      return colorMatches && sizeMatches;
    });
  }, [product.variants, selectedColor, selectedSize]);
  const currentPrice = product.base_price + (selectedVariant?.additional_price ?? 0);
  const currentImage = selectedVariant?.image || selectedVariant?.variant_image || product.main_image;

  if (!isOpen) return null;

  const handleAddToCart = () => {
    if (colorVariants.length > 0 && !selectedColor) {
      alert("Pilih warna terlebih dahulu");
      return;
    }
    if (sizeVariants.length > 0 && !selectedSize) {
      alert("Pilih ukuran terlebih dahulu");
      return;
    }

    const variantLabel = [
      selectedColor && `Warna: ${selectedColor}`,
      selectedSize && `Ukuran: ${selectedSize}`,
    ]
      .filter(Boolean)
      .join(", ");

    addToCart({
      id: selectedVariant ? `${product.id}-${selectedVariant.id}` : product.id,
      product_id: product.id,
      variant_id: selectedVariant?.id ?? null,
      product_name: `${product.product_name}${variantLabel ? ` (${variantLabel})` : ""}`,
      base_price: currentPrice,
      quantity,
      slug: product.slug,
    });

    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
      onClose();
      setQuantity(1);
      setSelectedColor(null);
      setSelectedSize(null);
    }, 1500);
  };

  const increaseQty = () => setQuantity(quantity + 1);
  const decreaseQty = () => quantity > 1 && setQuantity(quantity - 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white p-6">
          <h2 className="text-2xl font-bold text-gray-900">{product.product_name}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 transition-colors hover:bg-gray-100"
            aria-label="Tutup detail produk"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_1.05fr]">
          <div className="space-y-3">
            <div className="flex h-96 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
              {currentImage ? (
                <img
                  src={currentImage}
                  alt={`${product.product_name}${selectedColor ? ` - ${selectedColor}` : ""}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="text-center">
                  <ShoppingCart className="mx-auto mb-4 h-20 w-20 text-gray-400 opacity-50" />
                  <p className="text-lg text-gray-500">Pilih varian untuk melihat gambar</p>
                </div>
              )}
            </div>
            {selectedColor ? (
              <p className="text-sm font-medium text-gray-600">Warna dipilih: {selectedColor}</p>
            ) : null}
          </div>

          <div className="space-y-5">
            <div>
              <p className="text-sm font-semibold text-gray-500">Nama Produk</p>
              <h3 className="mt-1 text-xl font-bold text-gray-900">{product.product_name}</h3>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${i < 4 ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-600">(120 reviews)</span>
            </div>

            <div className="border-y border-gray-200 py-4">
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-3xl font-bold text-gray-900">
                  Rp {currentPrice.toLocaleString("id-ID")}
                </span>
                {selectedVariant?.additional_price ? (
                  <span className="rounded bg-blue-50 px-2 py-1 text-sm font-semibold text-blue-700">
                    +Rp {selectedVariant.additional_price.toLocaleString("id-ID")}
                  </span>
                ) : null}
              </div>
            </div>

            <div>
              <h3 className="mb-2 font-semibold text-gray-900">Deskripsi Produk</h3>
              <p className="leading-relaxed text-gray-700">
                Produk hijab berkualitas premium dari Aurevina. Nyaman, stylish, dan cocok
                untuk berbagai acara.
              </p>
            </div>

            {colorVariants.length > 0 && (
              <div className="border-t border-gray-200 pt-4">
                <h3 className="mb-3 font-semibold text-gray-900">Pilih Warna</h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {colorVariants.map((variant) => {
                    const variantImage = variant.image || variant.variant_image;
                    const selected = selectedColor === variant.variant_value;

                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => setSelectedColor(variant.variant_value)}
                        className={`overflow-hidden rounded-xl border text-left transition-all ${
                          selected ? "border-blue-600 ring-2 ring-blue-200" : "border-gray-200 hover:border-blue-300"
                        } ${variant.stock === 0 ? "cursor-not-allowed opacity-50" : ""}`}
                        disabled={variant.stock === 0}
                      >
                        <div className="h-20 bg-slate-100">
                          {variantImage ? (
                            <img
                              src={variantImage}
                              alt={variant.variant_value}
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="p-3">
                          <div className="text-sm font-semibold text-gray-900">{variant.variant_value}</div>
                          <div className="text-xs text-gray-500">
                            {variant.stock === 0 ? "Habis" : `Stok ${variant.stock}`}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {sizeVariants.length > 0 && (
              <div className="border-t border-gray-200 pt-4">
                <h3 className="mb-3 font-semibold text-gray-900">Pilih Ukuran</h3>
                <div className="flex flex-wrap gap-3">
                  {sizeVariants.map((variant) => (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => setSelectedSize(variant.variant_value)}
                      className={`rounded-lg px-4 py-2 font-medium transition-all ${
                        selectedSize === variant.variant_value
                          ? "bg-blue-600 text-white ring-2 ring-blue-400"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      } ${variant.stock === 0 ? "cursor-not-allowed opacity-50" : ""}`}
                      disabled={variant.stock === 0}
                    >
                      {variant.variant_value}
                      {variant.stock === 0 && " (Habis)"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-gray-200 pt-4">
              <h3 className="mb-3 font-semibold text-gray-900">Jumlah</h3>
              <div className="flex w-fit items-center gap-4">
                <button
                  onClick={decreaseQty}
                  className="rounded-lg border border-gray-300 p-2 transition-colors hover:bg-gray-50"
                  aria-label="Kurangi jumlah"
                >
                  <Minus className="h-5 w-5 text-gray-600" />
                </button>
                <span className="w-12 text-center text-2xl font-bold">{quantity}</span>
                <button
                  onClick={increaseQty}
                  className="rounded-lg border border-gray-300 p-2 transition-colors hover:bg-gray-50"
                  aria-label="Tambah jumlah"
                >
                  <Plus className="h-5 w-5 text-gray-600" />
                </button>
              </div>
              <div className="mt-3 text-sm text-gray-600">
                Subtotal:{" "}
                <span className="font-bold text-gray-900">
                  Rp {(currentPrice * quantity).toLocaleString("id-ID")}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 space-y-3 border-t border-gray-200 bg-white p-6">
          <button
            onClick={handleAddToCart}
            disabled={isAdded}
            className={`flex w-full items-center justify-center gap-2 rounded-lg py-3 font-semibold transition-all ${
              isAdded ? "bg-green-500 text-white" : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            <ShoppingCart className="h-5 w-5" />
            {isAdded ? "Ditambahkan ke Keranjang" : "Tambah ke Keranjang"}
          </button>
          <button
            onClick={onClose}
            className="w-full rounded-lg border border-gray-300 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
