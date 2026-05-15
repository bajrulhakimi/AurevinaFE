import { useState, useEffect } from "react";
import { ShoppingBag, Sparkles, BadgeCheck, Truck } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import API, { extractApiList } from "../services/api";

interface Category {
  id: number;
  category_name: string;
  slug: string;
}

interface CategoryWithProducts extends Category {
  productCount: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryWithProducts[]>([
    {
      id: 1,
      category_name: "Hijab Modern",
      slug: "hijab-modern",
      productCount: 12,
    },
    {
      id: 2,
      category_name: "Hijab Syar'i",
      slug: "hijab-syari",
      productCount: 8,
    },
    {
      id: 3,
      category_name: "Pashmina",
      slug: "pashmina",
      productCount: 15,
    },
    {
      id: 4,
      category_name: "Bergo",
      slug: "bergo",
      productCount: 6,
    },
  ]);
  const [loading, setLoading] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await API.get("/categories");
      const nextCategories = extractApiList<Category>(res.data);
      if (nextCategories.length > 0) {
        setCategories(
          nextCategories.map((category, index) => ({
            ...category,
            productCount: (index + 2) * 3,
          }))
        );
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Kategori Produk</h1>
          <p className="text-gray-600">Jelajahi berbagai kategori hijab dan busana muslim kami</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <div className="text-gray-500">Memuat kategori...</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {categories.map((category) => (
              <a
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="group relative overflow-hidden rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-purple-500 opacity-80 group-hover:opacity-100 transition-opacity" />

                <div className="relative p-8 h-64 flex flex-col justify-between text-white">
                  <div>
                    <ShoppingBag className="h-14 w-14 mb-4" />
                    <h3 className="text-2xl font-bold mb-2">{category.category_name}</h3>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5" />
                      <span className="text-sm font-semibold">{category.productCount} produk</span>
                    </div>
                    <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-semibold group-hover:bg-opacity-30 transition-all">
                      Lihat
                    </div>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Mengapa Memilih Aurevina?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <BadgeCheck className="mx-auto h-12 w-12 mb-4 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Produk Berkualitas</h3>
              <p className="text-gray-600">Semua produk kami dipilih dengan cermat untuk memastikan kualitas terbaik</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <Sparkles className="mx-auto h-12 w-12 mb-4 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Harga Terjangkau</h3>
              <p className="text-gray-600">Kami menawarkan harga yang kompetitif tanpa mengorbankan kualitas</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <Truck className="mx-auto h-12 w-12 mb-4 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">Pengiriman Cepat</h3>
              <p className="text-gray-600">Pengiriman ke seluruh Indonesia dengan layanan tracking real-time</p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
