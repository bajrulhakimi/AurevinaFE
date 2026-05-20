import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useRef } from "react";
import API, { extractApiList, getApiErrorMessage, getApiStatus } from "../services/api";
import { Search, Edit, Trash2, Package, Scissors, X, ChevronDown, ChevronLeft, ChevronRight, Copy } from "lucide-react";
import Categories from "./Categories";

interface CategoryOption {
  id: number;
  category_name: string;
}

interface Product {
  id: number;
  name?: string;
  product_name?: string;
  slug?: string;
  sku?: string;
  description?: string;
  total_stock: number;
  base_price: number;
  special_price?: number | null;
  special_start_date?: string | null;
  special_end_date?: string | null;
  has_special_price?: boolean;
  final_price?: number;
  weight?: number;
  status: string;
  main_image?: string;
  show_on_hero?: boolean;
  hero_position?: number | null;
  images?: ProductImage[];
  variants?: ProductVariant[];
  category?: {
    id: number;
    name?: string;
    category_name?: string;
  };
}

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

interface ColorVariation {
  id: number;
  variantId?: number;
  color: string;
  sku: string;
  price: string;
  stock: string;
  image: File | null;
  existingImage?: string | null;
}

const createColorVariation = (id: number): ColorVariation => ({
  id,
  color: "",
  sku: "",
  price: "",
  stock: "",
  image: null,
  existingImage: null,
});

const nextVariationId = (items: Array<{ id: number }>) =>
  items.reduce((maxId, item) => Math.max(maxId, item.id), 0) + 1;

const emptyProductImageSlots = () => Array<File | null>(5).fill(null);
const MAX_UPLOAD_IMAGE_SIZE = 1200;
const UPLOAD_IMAGE_QUALITY = 0.82;

const compressImageFile = async (file: File) => {
  if (!file.type.startsWith("image/") || file.type === "image/gif") {
    return file;
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = objectUrl;
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = reject;
    });

    const scale = Math.min(1, MAX_UPLOAD_IMAGE_SIZE / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) return file;

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", UPLOAD_IMAGE_QUALITY);
    });

    if (!blob || blob.size >= file.size) return file;

    return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const productDisplayName = (product: Product) =>
  product.name || product.product_name || "Untitled Product";

const categoryDisplayName = (product: Product) =>
  product.category?.name || product.category?.category_name || "No Category";

const isColorVariant = (variant: ProductVariant) => {
  const colorName = (variant.color || variant.variant_value || "").trim();
  return colorName !== "" && colorName !== "-";
};

const productStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    draft: "Draft",
    active: "Tersedia",
    inactive: "Nonaktif",
    archived: "Arsip",
  };

  return labels[status] || status;
};

const productStatusClass = (status: string) => {
  const classes: Record<string, string> = {
    draft: "bg-amber-50 text-amber-700",
    active: "bg-green-50 text-green-700",
    inactive: "bg-slate-100 text-slate-600",
    archived: "bg-rose-50 text-rose-700",
  };

  return classes[status] || "bg-slate-100 text-slate-600";
};

function ImagePreview({ file, src, alt }: { file?: File | null; src?: string | null; alt: string }) {
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(src || null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file, src]);

  if (!preview) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-100 text-xs font-medium text-slate-400">
        Preview
      </div>
    );
  }

  return <img src={preview} alt={alt} className="h-full w-full object-cover" />;
}

const formatRupiah = (value: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);

const ADMIN_PRODUCTS_PER_PAGE = 10;

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"manage" | "add" | "categories">("manage");
  const [saving, setSaving] = useState(false);
  const [savingStockKey, setSavingStockKey] = useState<string | null>(null);
  const [savingHeroId, setSavingHeroId] = useState<number | null>(null);
  const [expandedVariantProducts, setExpandedVariantProducts] = useState<Set<number>>(() => new Set());
  const [productPage, setProductPage] = useState(1);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [copyingFromName, setCopyingFromName] = useState<string | null>(null);
  const [variationsEnabled, setVariationsEnabled] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [productImages, setProductImages] = useState<Array<File | null>>(() => emptyProductImageSlots());
  const [existingProductImages, setExistingProductImages] = useState<ProductImage[]>([]);
  const [cropTarget, setCropTarget] = useState<{
    index: number;
    file: File;
    zoom: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const [cropPreviewUrl, setCropPreviewUrl] = useState<string | null>(null);
  const [bulkVariantPrice, setBulkVariantPrice] = useState("");
  const [bulkVariantStock, setBulkVariantStock] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    sku: "",
    description: "",
    category_id: "",
    total_stock: "0",
    base_price: "0",
    special_price: "",
    special_start_date: "",
    special_end_date: "",
    weight: "0",
    status: "active",
    show_on_hero: false,
    image: null as File | null,
  });
  const [colorVariations, setColorVariations] = useState<ColorVariation[]>(() => [
    createColorVariation(1),
  ]);
  const submitStatusOverride = useRef<string | null>(null);
  const existingImageUrls = useMemo(
    () =>
      existingProductImages
        .map((image) => image.image_url)
        .filter((imageUrl): imageUrl is string => Boolean(imageUrl)),
    [existingProductImages]
  );
  const compactProductImages = useMemo(
    () => productImages.filter((image): image is File => image instanceof File),
    [productImages]
  );
  const hasNewProductImages = compactProductImages.length > 0;

  const toggleVariantList = (productId: number) => {
    setExpandedVariantProducts((current) => {
      const next = new Set(current);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  useEffect(() => {
    if (!cropTarget) {
      setCropPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(cropTarget.file);
    setCropPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [cropTarget]);

  const resetCreateForm = () => {
    setFormData({
      name: "",
      slug: "",
      sku: "",
      description: "",
      category_id: "",
      total_stock: "0",
      base_price: "0",
      special_price: "",
      special_start_date: "",
      special_end_date: "",
      weight: "0",
      status: "active",
      show_on_hero: false,
      image: null,
    });
    setVariationsEnabled(false);
    setVideoFile(null);
    setProductImages(emptyProductImageSlots());
    setExistingProductImages([]);
    setBulkVariantPrice("");
    setBulkVariantStock("");
    setColorVariations([createColorVariation(1)]);
    setError(null);
    setEditingId(null);
    setCopyingFromName(null);
  };

  const selectTab = (tab: "manage" | "add" | "categories") => {
    setActiveTab(tab);
    if (tab === "add") {
      resetCreateForm();
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await API.get("/admin/products");
      setProducts(extractApiList<Product>(res.data));
      setError(null);
    } catch (err) {
      console.error(err);
      const status = getApiStatus(err);
      if (status === 401 || status === 403) {
        // Jika admin endpoint tidak bisa diakses karena auth, fallback ke publik
        try {
          const res = await API.get("/products");
          setProducts(extractApiList<Product>(res.data));
          setError("Produk admin tidak dapat dimuat, menampilkan data publik sementara.");
        } catch (fallbackErr) {
          console.error(fallbackErr);
          setError("Tidak dapat memuat produk dari server.");
        }
      } else {
        setError(getApiErrorMessage(err, "Tidak dapat memuat produk dari server."));
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await API.get("/admin/categories");
      setCategories(extractApiList<CategoryOption>(res.data));
    } catch (err) {
      console.error(err);
      setError("Tidak dapat memuat kategori admin.");
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const openProductEditor = (product: Product) => {
    const name = productDisplayName(product);
    const variants = (product.variants || []).filter(isColorVariant);

    setEditingId(product.id);
    setCopyingFromName(null);
    setFormData({
      name,
      slug: product.slug ?? name.toLowerCase().replace(/\s+/g, "-"),
      sku: product.sku ?? "",
      description: product.description || "",
      category_id: product.category?.id.toString() || "",
      total_stock: product.total_stock.toString(),
      base_price: product.base_price.toString(),
      special_price: product.special_price?.toString() || "",
      special_start_date: product.special_start_date?.slice(0, 10) || "",
      special_end_date: product.special_end_date?.slice(0, 10) || "",
      weight: product.weight?.toString() || "0",
      status: product.status,
      show_on_hero: Boolean(product.show_on_hero),
      image: null,
    });
    setVariationsEnabled(variants.length > 0);
    setColorVariations(
      variants.length > 0
        ? variants.map((variant, index) => ({
            id: index + 1,
            variantId: variant.id,
            color: variant.color || variant.variant_value || "",
            sku: variant.sku || "",
            price: ((product.base_price || 0) + (variant.additional_price || 0)).toString(),
            stock: variant.stock.toString(),
            image: null,
            existingImage: variant.image || variant.variant_image || null,
          }))
        : [createColorVariation(1)]
    );
    setVideoFile(null);
    setProductImages(emptyProductImageSlots());
    setExistingProductImages(
      product.images?.length
        ? product.images
        : product.main_image
          ? [{ id: 0, image_url: product.main_image }]
          : []
    );
    setBulkVariantPrice("");
    setBulkVariantStock("");
    setError(null);
    setActiveTab("add");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const copyProductToForm = (product: Product) => {
    const name = productDisplayName(product);
    const variants = (product.variants || []).filter(isColorVariant);

    setEditingId(null);
    setCopyingFromName(name);
    setFormData({
      name: `${name} Copy`,
      slug: "",
      sku: "",
      description: product.description || "",
      category_id: product.category?.id.toString() || "",
      total_stock: product.total_stock.toString(),
      base_price: product.base_price.toString(),
      special_price: product.special_price?.toString() || "",
      special_start_date: product.special_start_date?.slice(0, 10) || "",
      special_end_date: product.special_end_date?.slice(0, 10) || "",
      weight: product.weight?.toString() || "0",
      status: "draft",
      show_on_hero: false,
      image: null,
    });
    setVariationsEnabled(variants.length > 0);
    setColorVariations(
      variants.length > 0
        ? variants.map((variant, index) => ({
            id: index + 1,
            variantId: undefined,
            color: variant.color || variant.variant_value || "",
            sku: "",
            price: ((product.base_price || 0) + (variant.additional_price || 0)).toString(),
            stock: variant.stock.toString(),
            image: null,
            existingImage: variant.image || variant.variant_image || null,
          }))
        : [createColorVariation(1)]
    );
    setVideoFile(null);
    setProductImages(emptyProductImageSlots());
    setExistingProductImages(
      product.images?.length
        ? product.images
        : product.main_image
          ? [{ id: 0, image_url: product.main_image }]
          : []
    );
    setBulkVariantPrice("");
    setBulkVariantStock("");
    setError(null);
    setActiveTab("add");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEditing = () => {
    resetCreateForm();
    setActiveTab("manage");
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = event.target as HTMLInputElement;
    const { name, value } = target;

    if (name === "image") {
      const files = Array.from(target.files ?? []).slice(0, 5);
      setProductImages([...files, ...emptyProductImageSlots()].slice(0, 5));
      setFormData({ ...formData, image: files[0] ?? null });
      return;
    }

    if (name === "status") {
      setFormData({ ...formData, status: value, show_on_hero: value === "active" ? formData.show_on_hero : false });
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleVideoChange = (event: ChangeEvent<HTMLInputElement>) => {
    setVideoFile(event.target.files?.[0] ?? null);
  };

  const updateProductImageSlot = (index: number, file: File | null) => {
    setProductImages((current) => {
      const nextImages = [...current];
      nextImages[index] = file;
      setFormData((currentForm) => ({ ...currentForm, image: nextImages.find((image): image is File => image instanceof File) ?? null }));
      return nextImages;
    });
  };

  const handleProductImageSlotChange = (index: number, event: ChangeEvent<HTMLInputElement>) => {
    updateProductImageSlot(index, event.target.files?.[0] ?? null);
    event.target.value = "";
  };

  const addColorVariation = () => {
    setColorVariations((current) => [
      ...current,
      createColorVariation(nextVariationId(current)),
    ]);
  };

  const updateColorVariation = (id: number, field: keyof ColorVariation, value: string | File | null) => {
    setColorVariations((current) =>
      current.map((variation) =>
        variation.id === id ? { ...variation, [field]: value } : variation
      )
    );
  };

  const removeColorVariation = (id: number) => {
    setColorVariations((current) => current.filter((variation) => variation.id !== id));
  };

  const removeProductImage = (index: number) => {
    setProductImages((current) => {
      const nextImages = [...current];
      nextImages[index] = null;
      setFormData((currentForm) => ({ ...currentForm, image: nextImages.find((image): image is File => image instanceof File) ?? null }));
      return nextImages;
    });
  };

  const applyImageCrop = async () => {
    if (!cropTarget || !cropPreviewUrl) return;

    const image = new Image();
    image.src = cropPreviewUrl;
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });

    const size = 1200;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) return;

    const coverScale = Math.max(size / image.naturalWidth, size / image.naturalHeight) * cropTarget.zoom;
    const drawWidth = image.naturalWidth * coverScale;
    const drawHeight = image.naturalHeight * coverScale;
    const maxOffsetX = Math.max(0, (drawWidth - size) / 2);
    const maxOffsetY = Math.max(0, (drawHeight - size) / 2);
    const drawX = (size - drawWidth) / 2 + (cropTarget.offsetX / 50) * maxOffsetX;
    const drawY = (size - drawHeight) / 2 + (cropTarget.offsetY / 50) * maxOffsetY;

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, size, size);
    context.drawImage(image, drawX, drawY, drawWidth, drawHeight);

    canvas.toBlob((blob) => {
      if (!blob) return;

      const croppedFile = new File([blob], cropTarget.file.name.replace(/\.[^.]+$/, "-cropped.jpg"), {
        type: "image/jpeg",
      });
      updateProductImageSlot(cropTarget.index, croppedFile);
      setCropTarget(null);
    }, "image/jpeg", 0.92);
  };

  const applyBulkVariantValues = () => {
    setColorVariations((current) =>
      current.map((variation) => ({
        ...variation,
        price: bulkVariantPrice.trim() ? bulkVariantPrice : variation.price,
        stock: bulkVariantStock.trim() ? bulkVariantStock : variation.stock,
      }))
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const resolvedStatus = submitStatusOverride.current || formData.status;
    const shouldUseExistingImages = !editingId && compactProductImages.length === 0 && existingImageUrls.length > 0;

    const payload = new FormData();
    payload.append("product_name", formData.name);
    if (formData.slug.trim()) {
      payload.append("slug", formData.slug.trim());
    }
    if (formData.sku.trim()) {
      payload.append("sku", formData.sku.trim());
    }
    payload.append("description", formData.description);
    payload.append("category_id", formData.category_id);
    payload.append("total_stock", formData.total_stock);
    payload.append("base_price", formData.base_price);
    if (formData.special_price) payload.append("special_price", formData.special_price);
    if (formData.special_start_date) payload.append("special_start_date", formData.special_start_date);
    if (formData.special_end_date) payload.append("special_end_date", formData.special_end_date);
    payload.append("weight", formData.weight);
    payload.append("status", resolvedStatus);
    payload.append("show_on_hero", resolvedStatus === "active" && formData.show_on_hero ? "1" : "0");
    payload.append("variations_enabled", variationsEnabled ? "1" : "0");
    const optimizedProductImages = await Promise.all(
      compactProductImages.map((image) => compressImageFile(image))
    );
    const optimizedFallbackImage = formData.image ? await compressImageFile(formData.image) : null;

    optimizedProductImages.forEach((image) => {
      payload.append("images[]", image);
    });
    if (optimizedFallbackImage && optimizedProductImages.length === 0) {
      payload.append("image", optimizedFallbackImage);
    }
    if (shouldUseExistingImages) {
      existingImageUrls.slice(0, 5).forEach((image) => {
        payload.append("existing_images[]", image);
      });
    }

    // Append color variations
    if (variationsEnabled && colorVariations.length > 0) {
      const activeColorVariations = colorVariations.filter(
        (variation) => variation.color.trim() || variation.image instanceof File || variation.existingImage
      );

      for (const [index, variation] of activeColorVariations.entries()) {
        const colorName = variation.color.trim() || `Varian ${index + 1}`;
        const skuValue = variation.sku.trim() || `${formData.sku.trim() || formData.name.trim().replace(/\s+/g, "-").toUpperCase()}-${colorName.replace(/\s+/g, "-").toUpperCase()}`;
        payload.append(`color_variations[${index}][color]`, colorName);
        payload.append(`color_variations[${index}][sku]`, skuValue);
        payload.append(`color_variations[${index}][price]`, variation.price.toString().trim() || formData.base_price || "0");
        payload.append(`color_variations[${index}][stock]`, variation.stock.toString().trim() || formData.total_stock || "0");
        if (variation.image instanceof File) {
          payload.append(`color_variations[${index}][image]`, await compressImageFile(variation.image));
        }
        if (variation.existingImage && !(variation.image instanceof File)) {
          payload.append(`color_variations[${index}][existing_image]`, variation.existingImage);
        }
      }
    }

    if (editingId) {
      payload.append("_method", "PUT");
    }

    try {
      if (editingId) {
        await API.post(`/admin/products/${editingId}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await API.post("/admin/products", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }
      await fetchProducts();
      resetCreateForm();
      setActiveTab("manage");
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "Unable to save product."));
    } finally {
      submitStatusOverride.current = null;
      setSaving(false);
    }
  };

  const updateProductStock = async (product: Product, stock: number) => {
    if (stock === product.total_stock || Number.isNaN(stock) || stock < 0) return;

    const stockKey = `product-${product.id}`;
    setSavingStockKey(stockKey);
    setError(null);
    try {
      const payload = new FormData();
      payload.append("_method", "PUT");
      payload.append("total_stock", stock.toString());
      await API.post(`/admin/products/${product.id}`, payload);
      await fetchProducts();
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "Stok produk gagal diperbarui."));
    } finally {
      setSavingStockKey(null);
    }
  };

  const updateVariantStock = async (variant: ProductVariant, stock: number) => {
    if (stock === variant.stock || Number.isNaN(stock) || stock < 0) return;

    const stockKey = `variant-${variant.id}`;
    setSavingStockKey(stockKey);
    setError(null);
    try {
      await API.patch(`/admin/variants/${variant.id}/stock`, { stock });
      await fetchProducts();
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "Stok varian gagal diperbarui."));
    } finally {
      setSavingStockKey(null);
    }
  };

  const toggleHeroProduct = async (product: Product) => {
    const heroProducts = products.filter((item) => item.show_on_hero);
    const nextValue = !product.show_on_hero;

    if (nextValue && heroProducts.length >= 4) {
      setError("Maksimal hanya 4 produk yang bisa tampil di hero.");
      return;
    }

    if (nextValue && product.status !== "active") {
      setError("Produk harus berstatus Active agar bisa tampil di hero.");
      return;
    }

    if (nextValue && !product.main_image) {
      setError("Produk harus punya foto utama agar bisa tampil di hero.");
      return;
    }

    setSavingHeroId(product.id);
    setError(null);
    try {
      const payload = new FormData();
      payload.append("_method", "PUT");
      payload.append("show_on_hero", nextValue ? "1" : "0");
      await API.post(`/admin/products/${product.id}`, payload);
      await fetchProducts();
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "Gagal mengubah produk hero."));
    } finally {
      setSavingHeroId(null);
    }
  };

  const deleteProduct = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      await API.delete(`/admin/products/${id}`);
      await fetchProducts();
    } catch (err) {
      console.error(err);
      setError("Unable to delete product.");
    }
  };

  const filteredProducts = products.filter((product) =>
    productDisplayName(product).toLowerCase().includes(searchTerm.toLowerCase()) ||
    categoryDisplayName(product).toLowerCase().includes(searchTerm.toLowerCase())
  );
  const totalProductPages = Math.max(1, Math.ceil(filteredProducts.length / ADMIN_PRODUCTS_PER_PAGE));
  const currentProductPage = Math.min(productPage, totalProductPages);
  const paginatedProducts = filteredProducts.slice(
    (currentProductPage - 1) * ADMIN_PRODUCTS_PER_PAGE,
    currentProductPage * ADMIN_PRODUCTS_PER_PAGE
  );
  const heroProductCount = products.filter((product) => product.show_on_hero).length;

  useEffect(() => {
    setProductPage((page) => Math.min(page, totalProductPages));
  }, [totalProductPages]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Product Management</h2>
          <p className="mt-2 text-sm text-gray-600">
            {editingId ? "Ubah produk memakai bentuk form yang sama dengan tambah produk." : "Pilih antara kelola produk yang sudah ada atau buat produk baru dengan langkah seperti Shopee seller."}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-full bg-slate-100 p-2">
        <button
          type="button"
          onClick={() => selectTab("manage")}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition ${activeTab === "manage" ? "bg-white text-slate-900 shadow" : "text-slate-600 hover:bg-white hover:text-slate-900"}`}
        >
          Kelola Product
        </button>
        <button
          type="button"
          onClick={() => selectTab("add")}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition ${activeTab === "add" ? "bg-white text-slate-900 shadow" : "text-slate-600 hover:bg-white hover:text-slate-900"}`}
        >
          Tambah Product
        </button>
        <button
          type="button"
          onClick={() => selectTab("categories")}
          className={`rounded-full px-5 py-2 text-sm font-semibold transition ${activeTab === "categories" ? "bg-white text-slate-900 shadow" : "text-slate-600 hover:bg-white hover:text-slate-900"}`}
        >
          Kategori
        </button>
      </div>

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {activeTab === "categories" ? (
        <Categories />
      ) : activeTab === "add" ? (
        <form onSubmit={handleSubmit} className="space-y-8">
          {editingId && (
            <div className="flex flex-col gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-900">Mode Ubah Produk</p>
                <p className="mt-1 text-sm text-blue-700">Form ini memakai layout yang sama dengan Tambah Product.</p>
              </div>
              <button
                type="button"
                onClick={cancelEditing}
                className="rounded-xl border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
              >
                Batal Ubah
              </button>
            </div>
          )}
          {copyingFromName && (
            <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-amber-900">Mode Salin Produk</p>
                <p className="mt-1 text-sm text-amber-700">
                  Data disalin dari {copyingFromName}. Produk baru disimpan sebagai draft dulu supaya aman sebelum ditampilkan.
                </p>
              </div>
              <button
                type="button"
                onClick={resetCreateForm}
                className="rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-amber-700 shadow-sm hover:bg-amber-100"
              >
                Batal Salin
              </button>
            </div>
          )}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Media Produk</p>
                <h3 className="mt-3 text-2xl font-semibold text-slate-900">Upload Foto Produk Utama</h3>
              </div>
              <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">Step 1</span>
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <h4 className="text-lg font-semibold text-slate-900">Upload Foto Utama</h4>
                <p className="text-sm text-slate-600">Upload foto satu per satu. Setiap foto bisa dihapus atau dipotong agar fokus produk lebih pas.</p>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {Array.from({ length: 5 }).map((_, index) => {
                    const newImage = productImages[index] ?? null;
                    const savedImage = !hasNewProductImages ? existingImageUrls[index] ?? null : null;
                    const image = newImage ?? savedImage;

                    return image ? (
                      <div key={index} className={`overflow-hidden rounded-2xl bg-white ${index === 0 ? "border-2 border-blue-300" : "border border-slate-200"}`}>
                        <div className="relative aspect-square overflow-hidden">
                          <ImagePreview
                            file={image instanceof File ? image : null}
                            src={typeof image === "string" ? image : null}
                            alt={`Preview foto produk ${index + 1}`}
                          />
                          {index === 0 && <span className="absolute left-2 top-2 rounded bg-blue-600 px-2 py-1 text-[10px] font-semibold text-white">Cover</span>}
                          {!newImage && (
                            <span className="absolute right-2 top-2 rounded bg-white/90 px-2 py-1 text-[10px] font-semibold text-slate-600">
                              Tersimpan
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-1 border-t border-slate-100 bg-white p-1">
                          <label className="cursor-pointer rounded-lg px-2 py-1 text-center text-[11px] font-semibold text-blue-700 hover:bg-blue-50">
                            Ganti
                            <input type="file" accept="image/*" onChange={(event) => handleProductImageSlotChange(index, event)} className="hidden" />
                          </label>
                          <button
                            type="button"
                            onClick={() => image instanceof File && setCropTarget({ index, file: image, zoom: 1, offsetX: 0, offsetY: 0 })}
                            disabled={!(image instanceof File)}
                            className="rounded-lg px-2 py-1 text-[11px] font-semibold text-amber-700 hover:bg-amber-50 disabled:cursor-not-allowed disabled:text-slate-300"
                          >
                            Potong
                          </button>
                          <button
                            type="button"
                            onClick={() => removeProductImage(index)}
                            disabled={!newImage}
                            className="rounded-lg px-2 py-1 text-[11px] font-semibold text-red-600 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-slate-300"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label
                        key={index}
                        className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-center text-xs font-medium text-slate-400 hover:border-blue-300 hover:text-blue-600"
                      >
                        <span className="text-lg font-bold">+</span>
                        Foto {index + 1}
                        <input type="file" accept="image/*" onChange={(event) => handleProductImageSlotChange(index, event)} className="hidden" />
                      </label>
                    );
                  })}
                </div>
                {compactProductImages.length > 0 ? (
                  <p className="text-sm text-slate-600">{compactProductImages.length}/5 foto dipilih. Foto pertama yang terisi akan menjadi cover dan menggantikan foto lama.</p>
                ) : existingImageUrls.length > 0 ? (
                  <p className="text-sm text-slate-600">{existingImageUrls.length}/5 foto tersimpan. Upload foto baru jika ingin mengganti galeri produk.</p>
                ) : null}
                <div className="rounded-2xl bg-white p-4 text-sm leading-6 text-slate-700">
                  <p className="font-semibold">Unggah foto:</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-600">
                    <li>Foto utama terbaik</li>
                    <li>Background bersih</li>
                    <li>Terang dan jelas</li>
                    <li>Produk terlihat fokus</li>
                  </ul>
                </div>
              </div>
              <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <h4 className="text-lg font-semibold text-slate-900">Upload Video Produk</h4>
                <p className="text-sm text-slate-600">Klik Tambah Video untuk unggah video 15–30 detik. Video membantu conversion naik dan produk lebih dipercaya.</p>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-dashed border-blue-400 bg-white px-4 py-3 text-sm font-medium text-blue-700 hover:bg-blue-50">
                  <span>Tambah Video</span>
                  <input type="file" accept="video/*" onChange={handleVideoChange} className="hidden" />
                </label>
                {videoFile && <p className="text-sm text-slate-700">Video siap diunggah: {videoFile.name}</p>}
              </div>
            </div>
            <div className="mt-6 rounded-3xl bg-slate-100 p-5 text-sm text-slate-700">
              <h4 className="font-semibold text-slate-900">Urutan Foto yang Bagus</h4>
              <ol className="mt-3 list-decimal space-y-2 pl-5 text-slate-600">
                <li>Foto 1: Produk paling menarik (cover)</li>
                <li>Foto 2: Detail bahan</li>
                <li>Foto 3: Semua warna</li>
                <li>Foto 4: Dipakai model</li>
                <li>Foto 5: Size chart atau close up jahitan/bahan</li>
              </ol>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Nama Produk</p>
                <h3 className="mt-3 text-2xl font-semibold text-slate-900">Isi Nama Produk</h3>
              </div>
              <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">Step 2</span>
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Nama Produk</label>
                <input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
                <p className="mt-3 text-sm text-slate-600">Contoh bagus: Pashmina Jersey Premium Stretch Adem Anti Gerah Hijab Wanita</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Pilih Kategori</label>
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Pilih kategori</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.category_name}</option>
                  ))}
                </select>
                <p className="mt-3 text-sm text-slate-600">Contoh: Fashion Muslim ? Hijab ? Pashmina</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Deskripsi Produk</p>
                <h3 className="mt-3 text-2xl font-semibold text-slate-900">Isi Deskripsi Produk</h3>
              </div>
              <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">Step 3</span>
            </div>
            <div className="mt-6 space-y-4">
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={7}
                className="w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-4 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
              <div className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-900">Contoh deskripsi:</p>
                <pre className="mt-3 rounded-2xl bg-white p-4 text-sm leading-6 text-slate-800">
Pashmina Jersey Premium

? Bahan adem dan lembut
? Stretch dan nyaman dipakai
? Tidak mudah kusut
? Cocok dipakai harian

Ukuran:
175 x 70 cm

Tersedia warna:
Hitam, Mocca, Cream, Dusty Pink
                </pre>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Variasi Produk</p>
                <h3 className="mt-3 text-2xl font-semibold text-slate-900">Aktifkan Variasi Produk</h3>
              </div>
              <button
                type="button"
                onClick={() => setVariationsEnabled((current) => !current)}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${variationsEnabled ? "bg-green-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
              >
                {variationsEnabled ? "Variasi Aktif" : "Aktifkan Variasi"}
              </button>
            </div>
            <p className="mt-4 text-sm text-slate-600">Variasi warna menjadi pilihan pembeli dan SKU stok. Ukuran cukup ditulis di deskripsi produk supaya tidak muncul sebagai varian terpisah.</p>

            {variationsEnabled ? (
              <div className="mt-6 space-y-6">
                <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center justify-between gap-4">
                    <h4 className="text-lg font-semibold text-slate-900">Variasi Warna</h4>
                  </div>
                  <div className="mt-5 grid gap-3 rounded-2xl bg-white p-4 sm:grid-cols-[1fr_1fr_auto]">
                    <input
                      type="number"
                      value={bulkVariantPrice}
                      onChange={(event) => setBulkVariantPrice(event.target.value)}
                      placeholder="Harga masal"
                      className="rounded-xl border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                    <input
                      type="number"
                      value={bulkVariantStock}
                      onChange={(event) => setBulkVariantStock(event.target.value)}
                      placeholder="Stok masal"
                      className="rounded-xl border border-slate-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                    <button type="button" onClick={applyBulkVariantValues} className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                      Terapkan Masal
                    </button>
                  </div>
                  <div className="mt-5 space-y-4">
                    {colorVariations.map((variation) => (
                      <div key={variation.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="grid flex-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                              <label className="block text-sm font-medium text-slate-700">Warna</label>
                              <input
                                value={variation.color}
                                onChange={(event) => updateColorVariation(variation.id, "color", event.target.value)}
                                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700">SKU</label>
                              <input
                                value={variation.sku}
                                onChange={(event) => updateColorVariation(variation.id, "sku", event.target.value)}
                                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700">Harga</label>
                              <input
                                value={variation.price}
                                onChange={(event) => updateColorVariation(variation.id, "price", event.target.value)}
                                type="number"
                                step="0.01"
                                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-slate-700">Stok</label>
                              <input
                                value={variation.stock}
                                onChange={(event) => updateColorVariation(variation.id, "stock", event.target.value)}
                                type="number"
                                className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                              />
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <label className="block text-sm font-medium text-slate-700">Gambar Warna</label>
                            <label className="group relative h-28 w-28 cursor-pointer overflow-hidden rounded-2xl border border-dashed border-slate-300 bg-slate-50 hover:border-blue-400">
                              <ImagePreview
                                file={variation.image}
                                src={variation.existingImage}
                                alt={`Preview warna ${variation.color || variation.id}`}
                              />
                              <div className="absolute inset-x-0 bottom-0 bg-black/55 px-2 py-1 text-center text-[11px] font-semibold text-white">
                                Ganti Foto
                              </div>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(event) => updateColorVariation(variation.id, "image", event.target.files?.[0] ?? null)}
                                className="hidden"
                              />
                            </label>
                            {variation.image && <p className="max-w-32 truncate text-xs text-slate-500">{variation.image.name}</p>}
                            <button type="button" onClick={() => removeColorVariation(variation.id)} className="mt-2 rounded-2xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600">Hapus</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button type="button" onClick={addColorVariation} className="mt-5 w-full rounded-2xl border border-dashed border-blue-400 bg-white px-4 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-50">
                    Tambah Varian Warna
                  </button>
                </div>

                <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
                  <h4 className="text-lg font-semibold text-slate-900">Informasi Ukuran</h4>
                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    Ukuran tidak dibuat sebagai SKU/varian. Tulis ukuran di bagian deskripsi produk, misalnya "All Size 175 x 70 cm" atau panduan size lain. Dengan begitu yang tampil di pilihan pembeli hanya warna.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-slate-700">
                Klik "Aktifkan Variasi" untuk menambahkan varian warna. Ukuran tetap ditulis di deskripsi sebagai informasi produk.
              </div>
            )}
          </section>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Harga & Stok</p>
                <h3 className="mt-3 text-2xl font-semibold text-slate-900">Isi Harga, Stok, SKU, Berat</h3>
              </div>
              <span className="rounded-full bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">Step 4</span>
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-slate-700">Harga Produk</label>
                <input
                  name="base_price"
                  type="number"
                  step="0.01"
                  value={formData.base_price}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Harga Spesial</label>
                <input
                  name="special_price"
                  type="number"
                  step="0.01"
                  value={formData.special_price}
                  onChange={handleChange}
                  placeholder="Kosongkan jika tidak promo"
                  className="mt-2 w-full rounded-3xl border border-[#d9b17c] bg-amber-50 px-4 py-3 text-slate-900 focus:border-[#8f3d5b] focus:outline-none focus:ring-2 focus:ring-[#8f3d5b]/15"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Stok Produk</label>
                <input
                  name="total_stock"
                  type="number"
                  value={formData.total_stock}
                  onChange={handleChange}
                  required
                  className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Mulai Harga Spesial</label>
                <input
                  name="special_start_date"
                  type="date"
                  value={formData.special_start_date}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:border-[#8f3d5b] focus:outline-none focus:ring-2 focus:ring-[#8f3d5b]/15"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Selesai Harga Spesial</label>
                <input
                  name="special_end_date"
                  type="date"
                  value={formData.special_end_date}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:border-[#8f3d5b] focus:outline-none focus:ring-2 focus:ring-[#8f3d5b]/15"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">SKU Produk</label>
                <input
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700">Berat Produk (gram)</label>
                <input
                  name="weight"
                  type="number"
                  step="0.01"
                  value={formData.weight}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Status Produk</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={formData.show_on_hero}
                    disabled={formData.status !== "active"}
                    onChange={(event) => setFormData({ ...formData, show_on_hero: event.target.checked })}
                    className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-slate-900">Tampilkan di Hero</span>
                    <span className="mt-1 block text-sm leading-5 text-slate-600">
                      Maksimal 4 produk. Produk harus aktif dan memiliki foto utama agar terlihat bagus di slider beranda.
                      {formData.status !== "active" ? " Aktifkan status produk dulu untuk memakai hero." : ""}
                    </span>
                  </span>
                </label>
              </div>
            </div>
          </section>

          <div className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">{editingId ? "Simpan Perubahan" : copyingFromName ? "Simpan Salinan Produk" : "Simpan Produk"}</p>
              <p className="mt-2 text-sm text-slate-600">
                {editingId
                  ? "Perubahan produk akan langsung disimpan ke data admin."
                  : "Gunakan draft kalau produk belum siap tampil di halaman customer."}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="submit"
                disabled={saving}
                onClick={() => {
                  submitStatusOverride.current = "draft";
                }}
                className="inline-flex items-center justify-center rounded-3xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100"
              >
                {saving ? "Menyimpan..." : "Simpan ke Draft"}
              </button>
              <button
                type="submit"
                disabled={saving}
                onClick={() => {
                  submitStatusOverride.current = editingId ? null : "active";
                }}
                className="inline-flex items-center justify-center rounded-3xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {saving ? "Menyimpan..." : editingId ? "Simpan Perubahan" : "Simpan dan Tampilkan"}
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setProductPage(1);
              }}
              className="w-full pl-10 pr-4 py-3 rounded-3xl border border-slate-300 bg-white text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">{filteredProducts.length} Products</p>
                <p className="text-xs text-slate-500">Produk utama dengan rincian varian warna dan SKU di bawahnya. Hero beranda: {heroProductCount}/4 produk.</p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                <span className="rounded-full border border-slate-200 px-3 py-1">Semua</span>
                <span className="rounded-full border border-slate-200 px-3 py-1">Stok Menipis</span>
                <span className="rounded-full border border-slate-200 px-3 py-1">Perlu Optimasi</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="w-[42%] px-5 py-3 text-left text-xs font-semibold text-slate-500">Produk</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">Harga</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">Stok</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">Performa</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">Analisis Produk</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {paginatedProducts.map((product) => {
                    const variants = (product.variants || []).filter(isColorVariant);
                    const totalVariantStock = variants.reduce((sum, variant) => sum + variant.stock, 0);
                    const variantsExpanded = expandedVariantProducts.has(product.id);
                    const visibleVariants = variantsExpanded ? variants : variants.slice(0, 3);
                    const hasHiddenVariants = variants.length > 3;

                    return (
                      <tr key={product.id} className="align-top">
                        <td colSpan={6} className="p-0">
                          <div className="grid min-w-[980px] grid-cols-[42%_12%_12%_15%_14%_5%] px-5 py-5">
                            <div className="flex gap-4 pr-5">
                              <div className="h-16 w-16 shrink-0 overflow-hidden rounded bg-slate-100">
                                {product.main_image ? (
                                  <img src={product.main_image} alt={productDisplayName(product)} className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-slate-400">
                                    <Package className="h-6 w-6" />
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                              <div className="mb-1 flex flex-wrap gap-1">
                                <span className={`rounded px-2 py-0.5 text-[11px] font-medium ${productStatusClass(product.status)}`}>
                                  {productStatusLabel(product.status)}
                                </span>
                                <span className="rounded bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">{categoryDisplayName(product)}</span>
                                {product.show_on_hero ? (
                                  <span className="rounded bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">Hero #{product.hero_position || "-"}</span>
                                ) : null}
                              </div>
                                <p className="line-clamp-2 text-sm font-semibold leading-5 text-slate-900">{productDisplayName(product)}</p>
                                <p className="mt-1 text-xs text-slate-500">SKU Induk: {product.sku || "-"}</p>
                                <p className="text-xs text-slate-500">ID Produk: {product.id}</p>
                              </div>
                            </div>

                            <div className="text-sm text-slate-900">
                              {product.has_special_price && product.final_price ? (
                                <>
                                  <p className="font-bold text-[#8f3d5b]">{formatRupiah(product.final_price)}</p>
                                  <p className="mt-1 text-xs text-slate-400 line-through">{formatRupiah(product.base_price)}</p>
                                  <p className="mt-1 text-xs text-amber-600">Harga spesial</p>
                                </>
                              ) : (
                                <>
                                  {formatRupiah(product.base_price)}
                                  <p className="mt-1 text-xs text-amber-600">Harga utama</p>
                                </>
                              )}
                            </div>
                            <div className="text-sm text-slate-900">
                              {variants.length > 0 ? (
                                <>
                                  <span>{totalVariantStock}</span>
                                  <p className="mt-1 text-xs text-slate-500">{variants.length} varian</p>
                                </>
                              ) : (
                                <>
                                  <input
                                    type="number"
                                    min={0}
                                    defaultValue={product.total_stock}
                                    disabled={savingStockKey === `product-${product.id}`}
                                    onBlur={(event) => updateProductStock(product, Number(event.target.value))}
                                    onKeyDown={(event) => {
                                      if (event.key === "Enter") {
                                        event.currentTarget.blur();
                                      }
                                    }}
                                    className="w-20 rounded-lg border border-slate-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                  />
                                  <p className="mt-1 text-xs text-slate-500">
                                    {savingStockKey === `product-${product.id}` ? "Menyimpan..." : "Enter untuk simpan"}
                                  </p>
                                </>
                              )}
                            </div>
                            <div className="text-sm text-slate-700">
                              <p>Penjualan 0</p>
                              <p className="mt-1 text-xs text-slate-500">Kunjungan 30 Hari Terakhir 0</p>
                            </div>
                            <div className="text-xs text-slate-600">
                              <p className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-slate-300" />Info produk optimal</p>
                              <p className="mt-1 flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400" />{variants.length} SKU produk</p>
                            </div>
                            <div className="flex flex-col items-start gap-2 text-sm font-medium">
                              <button
                                type="button"
                                onClick={() => toggleHeroProduct(product)}
                                disabled={savingHeroId === product.id}
                                className={`${product.show_on_hero ? "text-amber-600 hover:text-amber-800" : "text-slate-500 hover:text-blue-700"} disabled:opacity-60`}
                                title={product.show_on_hero ? "Sembunyikan dari hero" : "Tampilkan di hero"}
                              >
                                {savingHeroId === product.id ? "..." : product.show_on_hero ? "Hero" : "+Hero"}
                              </button>
                              <button type="button" onClick={() => openProductEditor(product)} className="text-blue-600 hover:text-blue-900" title="Ubah produk">
                                <Edit className="h-4 w-4" />
                              </button>
                              <button type="button" onClick={() => copyProductToForm(product)} className="text-slate-600 hover:text-[#8f3d5b]" title="Salin produk">
                                <Copy className="h-4 w-4" />
                              </button>
                              <button type="button" onClick={() => deleteProduct(product.id)} className="text-red-600 hover:text-red-900" title="Hapus produk">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          <div className="ml-14 mr-5 mb-5 rounded bg-slate-50">
                            {variants.length > 0 ? (
                              <>
                              {visibleVariants.map((variant) => {
                                const variantImage = variant.image || variant.variant_image || product.main_image;
                                const variantPrice = product.base_price + (variant.additional_price || 0);
                                const variantName = variant.color || variant.variant_value || "Varian";

                                return (
                                  <div key={variant.id} className="grid min-w-[920px] grid-cols-[42%_12%_12%_15%_14%_5%] border-t border-white px-4 py-3 first:border-t-0">
                                    <div className="flex items-center gap-3 pr-5">
                                      <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-white">
                                        {variantImage ? (
                                          <img src={variantImage} alt={variantName || "Varian produk"} className="h-full w-full object-cover" />
                                        ) : (
                                          <div className="flex h-full w-full items-center justify-center text-slate-300">
                                            <Package className="h-4 w-4" />
                                          </div>
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-900">{variantName || "Varian"}</p>
                                        <p className="text-xs text-slate-500">Kode Variasi: {variant.sku || "-"}</p>
                                        <p className="text-xs text-slate-500">Model ID: {variant.id}</p>
                                      </div>
                                    </div>
                                    <div className="text-sm text-slate-900">
                                      {formatRupiah(variantPrice)}
                                      {(variant.additional_price || 0) > 0 ? (
                                        <p className="mt-1 text-xs text-amber-600">+{formatRupiah(variant.additional_price || 0)}</p>
                                      ) : null}
                                    </div>
                                    <div className="text-sm text-slate-900">
                                      <input
                                        type="number"
                                        min={0}
                                        defaultValue={variant.stock}
                                        disabled={savingStockKey === `variant-${variant.id}`}
                                        onBlur={(event) => updateVariantStock(variant, Number(event.target.value))}
                                        onKeyDown={(event) => {
                                          if (event.key === "Enter") {
                                            event.currentTarget.blur();
                                          }
                                        }}
                                        className="w-20 rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                                      />
                                      {savingStockKey === `variant-${variant.id}` ? (
                                        <p className="mt-1 text-xs text-blue-600">Menyimpan...</p>
                                      ) : null}
                                      {variant.stock <= 0 ? (
                                        <p className="mt-1 w-fit rounded bg-slate-200 px-1.5 py-0.5 text-[11px] text-slate-600">Habis</p>
                                      ) : null}
                                    </div>
                                    <div className="text-sm text-slate-700">Penjualan 0</div>
                                    <div className="text-xs text-slate-500">{variant.stock <= 5 ? "Stok menipis" : "Tersedia"}</div>
                                    <div />
                                  </div>
                                );
                              })}
                              {hasHiddenVariants ? (
                                <button
                                  type="button"
                                  onClick={() => toggleVariantList(product.id)}
                                  className="flex min-w-[920px] items-center justify-center gap-1 border-t border-dashed border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-white hover:text-[#8f3d5b]"
                                >
                                  {variantsExpanded ? "Sembunyikan Varian" : `Lihat Semua (${variants.length} SKU Produk)`}
                                  <ChevronDown className={`h-4 w-4 transition-transform ${variantsExpanded ? "rotate-180" : ""}`} />
                                </button>
                              ) : null}
                              </>
                            ) : (
                              <div className="px-4 py-3 text-sm text-slate-500">Belum ada varian untuk produk ini.</div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {filteredProducts.length > 0 ? (
            <div className="flex flex-wrap items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm sm:justify-end">
              <button
                type="button"
                onClick={() => setProductPage((page) => Math.max(1, page - 1))}
                disabled={currentProductPage <= 1}
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-50 hover:text-[#8f3d5b] disabled:cursor-not-allowed disabled:opacity-35"
                aria-label="Halaman produk sebelumnya"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="flex min-w-[86px] items-center justify-center gap-4 font-medium text-slate-900">
                <span>{currentProductPage}</span>
                <span className="text-slate-400">/</span>
                <span>{totalProductPages}</span>
              </div>
              <button
                type="button"
                onClick={() => setProductPage((page) => Math.min(totalProductPages, page + 1))}
                disabled={currentProductPage >= totalProductPages}
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-50 hover:text-[#8f3d5b] disabled:cursor-not-allowed disabled:opacity-35"
                aria-label="Halaman produk berikutnya"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-slate-500">
                {ADMIN_PRODUCTS_PER_PAGE}/ halaman
              </div>
            </div>
          ) : null}

          {filteredProducts.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
              Tidak ada produk ditemukan.
            </div>
          )}
        </div>
      )}

      {cropTarget && cropPreviewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Potong Foto</p>
                <h3 className="mt-1 text-2xl font-bold text-slate-950">Atur fokus foto produk</h3>
              </div>
              <button
                type="button"
                onClick={() => setCropTarget(null)}
                className="rounded-full bg-slate-100 p-2 text-slate-600 hover:bg-slate-200"
                aria-label="Tutup crop foto"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_260px]">
              <div className="flex items-center justify-center rounded-3xl bg-slate-100 p-4">
                <div className="relative aspect-square w-full max-w-[520px] overflow-hidden rounded-2xl bg-white shadow-inner">
                  <img
                    src={cropPreviewUrl}
                    alt="Preview crop"
                    className="h-full w-full object-cover"
                    style={{
                      transform: `translate(${cropTarget.offsetX}%, ${cropTarget.offsetY}%) scale(${cropTarget.zoom})`,
                    }}
                  />
                  <div className="pointer-events-none absolute inset-0 border-4 border-white/70" />
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Zoom</label>
                  <input
                    type="range"
                    min="1"
                    max="2"
                    step="0.01"
                    value={cropTarget.zoom}
                    onChange={(event) => setCropTarget({ ...cropTarget, zoom: Number(event.target.value) })}
                    className="mt-3 w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Geser Horizontal</label>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    step="1"
                    value={cropTarget.offsetX}
                    onChange={(event) => setCropTarget({ ...cropTarget, offsetX: Number(event.target.value) })}
                    className="mt-3 w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700">Geser Vertikal</label>
                  <input
                    type="range"
                    min="-50"
                    max="50"
                    step="1"
                    value={cropTarget.offsetY}
                    onChange={(event) => setCropTarget({ ...cropTarget, offsetY: Number(event.target.value) })}
                    className="mt-3 w-full"
                  />
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  Foto akan disimpan sebagai kotak 1:1 agar tampil rapi di halaman produk dan hero.
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setCropTarget(null)}
                    className="flex-1 rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={applyImageCrop}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
                  >
                    <Scissors className="h-4 w-4" />
                    Terapkan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
