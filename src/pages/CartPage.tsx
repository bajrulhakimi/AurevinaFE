import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageCircle, ShoppingCart, Trash2 } from "lucide-react";
import { useCart } from "../context/useCart";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function CartPage() {
  const navigate = useNavigate();
  const { cart, removeFromCart, updateQuantity, getTotal, clearCart } = useCart();
  const total = getTotal();
  const token = localStorage.getItem("token");

  const handleCheckoutWhatsApp = () => {
    if (cart.length === 0) {
      alert("Keranjang kosong!");
      return;
    }

    let message = "Halo Aurevina! 🌸\n\nSaya ingin melakukan pemesanan produk berikut:\n\n";
    cart.forEach((item) => {
      message += `🛍️ ${item.product_name}\n  Qty: ${item.quantity}\n  Rp ${item.base_price.toLocaleString("id-ID")}\n\n`;
    });
    message += `  Total: Rp ${total.toLocaleString("id-ID")}\n\nMohon diproses. Terima kasih!`;

    window.open(`https://wa.me/6285817744916?text=${encodeURIComponent(message)}`, "_blank");
  };

  const handleCheckoutWeb = () => {
    if (cart.length === 0) {
      alert("Keranjang kosong!");
      return;
    }

    if (!token) {
      navigate("/login?redirect=/checkout");
      return;
    }

    navigate("/checkout");
  };

  return (
    <div className="min-h-screen bg-[#fbf7f2]">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-2 font-semibold text-[#8f3d5b] hover:text-[#76304a]"
        >
          <ArrowLeft className="h-5 w-5" />
          Kembali
        </button>

        <div className="mb-8">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-[#b9895e]">Cart</p>
          <h1 className="text-4xl font-bold text-stone-950">Keranjang Belanja</h1>
          <p className="mt-3 max-w-2xl text-stone-600">Cek lagi produk pilihanmu sebelum lanjut checkout.</p>
        </div>

        {cart.length === 0 ? (
          <div className="rounded-[28px] border border-white/80 bg-white p-12 text-center shadow-xl shadow-stone-900/5">
            <ShoppingCart className="mx-auto mb-4 h-16 w-16 text-[#d9a66f]" />
            <h2 className="mb-2 text-2xl font-bold text-stone-950">Keranjang Kosong</h2>
            <p className="mb-6 text-stone-600">Belum ada produk di keranjang. Ayo mulai berbelanja sekarang.</p>
            <button
              onClick={() => navigate("/products")}
              className="rounded-xl bg-[#8f3d5b] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#76304a]"
            >
              Lanjut Belanja
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-4 lg:col-span-2">
              <div className="overflow-hidden rounded-[24px] border border-white/80 bg-white shadow-xl shadow-stone-900/5">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start justify-between border-b border-stone-200 p-6 transition-colors last:border-b-0 hover:bg-[#fbf7f2]"
                  >
                    <div className="flex-1">
                      <h3 className="mb-2 text-lg font-bold text-stone-950">{item.product_name}</h3>
                      <p className="mb-4 font-semibold text-[#8f3d5b]">Rp {item.base_price.toLocaleString("id-ID")}</p>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-stone-600">Jumlah</span>
                        <div className="flex items-center gap-3 rounded-xl bg-[#fbf7f2] p-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-2 py-1 font-bold text-stone-600 hover:text-stone-950"
                          >
                            -
                          </button>
                          <span className="min-w-[40px] px-3 py-1 text-center font-semibold text-stone-950">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-2 py-1 font-bold text-stone-600 hover:text-stone-950"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="ml-4 text-right">
                      <p className="mb-3 text-xl font-bold text-stone-950">
                        Rp {(item.base_price * item.quantity).toLocaleString("id-ID")}
                      </p>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
                        aria-label="Hapus item"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <aside className="lg:col-span-1">
              <div className="sticky top-24 rounded-[24px] border border-white/80 bg-white p-6 shadow-xl shadow-stone-900/5">
                <h2 className="mb-6 text-xl font-bold text-stone-950">Ringkasan Pesanan</h2>
                <div className="mb-6 space-y-4 border-b border-stone-200 pb-6">
                  <div className="flex justify-between text-stone-600">
                    <span>{cart.length} Produk</span>
                    <span>Rp {total.toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between text-stone-600">
                    <span>Pengiriman</span>
                    <span>Hitung saat checkout</span>
                  </div>
                </div>

                <div className="mb-6 flex items-center justify-between">
                  <span className="text-lg font-bold text-stone-950">Total</span>
                  <span className="text-2xl font-bold text-[#8f3d5b]">Rp {total.toLocaleString("id-ID")}</span>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleCheckoutWhatsApp}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 py-3 font-semibold text-white transition-colors hover:bg-green-700"
                  >
                    <MessageCircle className="h-5 w-5" />
                    Checkout via WhatsApp
                  </button>
                  <button
                    onClick={handleCheckoutWeb}
                    className="w-full rounded-xl bg-[#8f3d5b] py-3 font-semibold text-white transition-colors hover:bg-[#76304a]"
                  >
                    {token ? "Lanjutkan ke Checkout" : "Login untuk Checkout Web"}
                  </button>
                  <button
                    onClick={() => navigate("/products")}
                    className="w-full rounded-xl border border-stone-300 py-3 font-semibold text-stone-700 transition-colors hover:bg-[#fbf7f2]"
                  >
                    Lanjut Belanja
                  </button>
                </div>

                <button
                  onClick={() => {
                    if (confirm("Yakin ingin mengosongkan keranjang?")) {
                      clearCart();
                    }
                  }}
                  className="mt-4 w-full rounded-xl py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  Kosongkan Keranjang
                </button>
              </div>
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
