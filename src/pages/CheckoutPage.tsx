import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { ArrowLeft, CheckCircle2, CreditCard, Mail, MapPin, Phone, Trash2, Upload } from "lucide-react";
import { useCart } from "../context/useCart";
import { useAuth } from "../context/useAuth";
import API, { extractApiList, getApiErrorMessage } from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

interface ShippingData {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  notes: string;
  isDefault: boolean;
}

interface SavedAddress {
  id: number;
  receiver_name: string;
  receiver_phone: string;
  city: string;
  postal_code: string;
  full_address: string;
  is_default: boolean;
}

interface ApiCartItem {
  id: number;
}

interface Promo {
  promo_code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  discount_amount: number;
}

const paymentMethods = [
  {
    id: "bank_transfer",
    label: "Transfer Bank",
    detail: "Transfer sesuai total belanja, lalu upload bukti pembayaran.",
  },
  {
    id: "qris",
    label: "QRIS",
    detail: "Bayar melalui QRIS toko, lalu upload screenshot pembayaran.",
  },
  {
    id: "e_wallet",
    label: "E-Wallet",
    detail: "Bayar melalui dompet digital dan lampirkan bukti transaksi.",
  },
  {
    id: "midtrans",
    label: "Pembayaran Otomatis",
    detail: "Bayar melalui Midtrans. Status pembayaran otomatis terverifikasi setelah berhasil.",
  },
];

const paymentInstructions: Record<string, string> = {
  bank_transfer: "BCA 1234567890 a.n. Aurevina Store",
  qris: "Scan QRIS toko dari admin/WhatsApp, lalu upload bukti pembayaran.",
  e_wallet: "Dana/OVO/ShopeePay 0812 3456 7890 a.n. Aurevina Store",
  midtrans: "Klik Bayar & Buat Pesanan, lalu selesaikan pembayaran di halaman Midtrans.",
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { cart, getTotal, clearCart } = useCart();
  const { isAuthenticated, isCustomer, user } = useAuth();
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [addressMode, setAddressMode] = useState<"saved" | "new">("new");
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [shippingData, setShippingData] = useState<ShippingData>({
    fullName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    postalCode: "",
    notes: "",
    isDefault: false,
  });
  const [shippingMethod, setShippingMethod] = useState("regular");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<Promo | null>(null);
  const [promoMessage, setPromoMessage] = useState<string | null>(null);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderCode, setOrderCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const subtotal = getTotal();
  const shippingCost = shippingMethod === "regular" ? 25000 : 50000;
  const promoDiscount = appliedPromo ? Math.min(Number(appliedPromo.discount_amount), subtotal) : 0;
  const total = subtotal - promoDiscount + shippingCost;

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login?redirect=/checkout", { replace: true });
      return;
    }

    if (!isCustomer) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, isCustomer, navigate]);

  useEffect(() => {
    if (user) {
      setShippingData((prev) => ({
        ...prev,
        fullName: prev.fullName || user.name,
        email: prev.email || user.email,
      }));
    }
  }, [user]);

  const fetchAddresses = async () => {
    const response = await API.get("/addresses");
    const nextAddresses = extractApiList<SavedAddress>(response.data);
    setAddresses(nextAddresses);
    const defaultAddress = nextAddresses.find((address) => address.is_default) || nextAddresses[0];
    if (defaultAddress) {
      setAddressMode("saved");
      setSelectedAddressId((current) => current && nextAddresses.some((address) => address.id === current) ? current : defaultAddress.id);
    } else {
      setAddressMode("new");
      setSelectedAddressId(null);
    }
  };

  useEffect(() => {
    if (!isAuthenticated || !isCustomer) return;

    fetchAddresses().catch((err) => console.error("Failed to fetch addresses:", err));
  }, [isAuthenticated, isCustomer]);

  const selectedAddress = useMemo(
    () => addresses.find((address) => address.id === selectedAddressId) || null,
    [addresses, selectedAddressId]
  );

  if (!isAuthenticated || !isCustomer) {
    return null;
  }

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = event.target;
    const checked = type === "checkbox" ? (event.target as HTMLInputElement).checked : undefined;
    setShippingData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateCheckout = () => {
    if (cart.length === 0) {
      return "Keranjang kosong.";
    }

    if (addressMode === "saved" && !selectedAddressId) {
      return "Pilih alamat pengiriman.";
    }

    if (addressMode === "new") {
      if (!shippingData.fullName || !shippingData.phone || !shippingData.email || !shippingData.address || !shippingData.city || !shippingData.postalCode) {
        return "Mohon lengkapi alamat pengiriman baru.";
      }
    }

    if (paymentMethod !== "midtrans" && !paymentProof) {
      return "Upload bukti pembayaran terlebih dahulu agar pesanan bisa masuk ke admin.";
    }

    return null;
  };

  const applyPromoCode = async () => {
    const normalizedCode = promoCode.trim().toUpperCase();

    if (!normalizedCode) {
      setPromoMessage("Masukkan kode promo terlebih dahulu.");
      return;
    }

    try {
      const response = await API.post("/promos/validate", {
        promo_code: normalizedCode,
        subtotal,
      });
      const promo = response.data?.data as Omit<Promo, "promo_code">;
      setAppliedPromo({ ...promo, promo_code: normalizedCode });
      setPromoCode(normalizedCode);
      setPromoMessage("Kode promo berhasil digunakan.");
    } catch (err) {
      setAppliedPromo(null);
      setPromoMessage(getApiErrorMessage(err, "Kode promo tidak ditemukan atau sudah tidak aktif."));
    }
  };

  const syncCartToServer = async () => {
    const currentCart = await API.get("/cart");
    const serverItems = extractApiList<ApiCartItem>(currentCart.data);

    await Promise.all(serverItems.map((item) => API.delete(`/cart/remove/${item.id}`)));

    for (const item of cart) {
      const productId = Number(item.product_id ?? item.id);

      if (!productId || Number.isNaN(productId)) {
        throw new Error(`Produk ${item.product_name} tidak valid untuk checkout.`);
      }

      await API.post("/cart/add", {
        product_id: productId,
        variant_id: item.variant_id || undefined,
        quantity: item.quantity,
      });
    }
  };

  const deleteAddress = async (addressId: number) => {
    if (!confirm("Hapus alamat ini?")) return;

    try {
      await API.delete(`/addresses/${addressId}`);
      await fetchAddresses();
    } catch (err) {
      setError(getApiErrorMessage(err, "Alamat gagal dihapus."));
    }
  };

  const handleSubmitOrder = async (event: FormEvent) => {
    event.preventDefault();
    const validationError = validateCheckout();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      await syncCartToServer();

      const payload = new FormData();
      if (addressMode === "saved" && selectedAddressId) {
        payload.append("address_id", String(selectedAddressId));
      } else {
        payload.append("shipping[full_name]", shippingData.fullName);
        payload.append("shipping[phone]", shippingData.phone);
        payload.append("shipping[email]", shippingData.email);
        payload.append("shipping[address]", shippingData.address);
        payload.append("shipping[city]", shippingData.city);
        payload.append("shipping[postal_code]", shippingData.postalCode);
        payload.append("shipping[is_default]", shippingData.isDefault ? "1" : "0");
      }

      payload.append("shipping_method", shippingMethod);
      payload.append("payment_method", paymentMethod);
      payload.append("notes", shippingData.notes);
      if (appliedPromo) {
        payload.append("promo_code", appliedPromo.promo_code);
      }
      if (paymentProof) {
        payload.append("payment_proof", paymentProof);
      }

      const response = await API.post("/checkout", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const gatewayPaymentUrl = response.data?.data?.payment?.gateway_payment_url;
      setOrderCode(response.data?.data?.order_code ?? null);
      setOrderPlaced(true);
      clearCart();
      if (gatewayPaymentUrl) {
        window.location.href = gatewayPaymentUrl;
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Terjadi kesalahan saat memproses pesanan."));
    } finally {
      setIsProcessing(false);
    }
  };

  if (cart.length === 0 && !orderPlaced) {
    return (
      <div>
        <Navbar />
        <main className="min-h-screen bg-[#fbf7f2] py-12">
          <div className="mx-auto max-w-7xl px-4">
            <button onClick={() => navigate("/cart")} className="mb-4 flex items-center gap-2 font-semibold text-[#8f3d5b] hover:text-[#76304a]">
              <ArrowLeft className="h-5 w-5" />
              Kembali
            </button>
            <p className="text-gray-600">Keranjang kosong. Silakan tambah produk terlebih dahulu.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (orderPlaced) {
    return (
      <div>
        <Navbar />
        <main className="flex min-h-screen items-center justify-center bg-[#fbf7f2] px-4 py-12">
          <div className="max-w-lg rounded-[28px] border border-white/80 bg-white p-10 text-center shadow-xl shadow-stone-900/5">
            <CheckCircle2 className="mx-auto h-16 w-16 text-green-600" />
            <h1 className="mt-5 text-3xl font-bold text-stone-950">Pembayaran Diterima</h1>
            <p className="mt-3 text-stone-600">
              Pesanan sudah masuk ke admin dan menunggu verifikasi pembayaran.
            </p>
            {orderCode && <p className="mt-5 rounded-full bg-rose-50 px-4 py-2 text-sm font-bold text-[#8f3d5b]">Kode order: {orderCode}</p>}
            <button onClick={() => navigate("/orders")} className="mt-7 rounded-full bg-[#8f3d5b] px-6 py-3 font-semibold text-white hover:bg-[#76304a]">
              Lihat Pesanan Saya
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <main className="min-h-screen bg-[#fbf7f2] py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <button onClick={() => navigate("/cart")} className="mb-4 flex items-center gap-2 font-semibold text-[#8f3d5b] hover:text-[#76304a]">
              <ArrowLeft className="h-5 w-5" />
              Kembali ke Keranjang
            </button>
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-[#b9895e]">Checkout</p>
            <h1 className="text-4xl font-bold text-stone-950">Selesaikan Pembayaran</h1>
            <p className="mt-3 max-w-2xl text-stone-600">Pesanan baru masuk ke admin setelah alamat, metode pembayaran, dan bukti pembayaran lengkap.</p>
          </div>

          <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

              <section className="rounded-[24px] border border-white/80 bg-white p-6 shadow-xl shadow-stone-900/5">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <h2 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                    <MapPin className="h-6 w-6" />
                    Alamat Pengiriman
                  </h2>
                  {addresses.length > 0 ? (
                    <div className="flex rounded-full bg-stone-100 p-1 text-sm font-semibold">
                      <button type="button" onClick={() => setAddressMode("saved")} className={`rounded-full px-4 py-2 ${addressMode === "saved" ? "bg-white text-[#8f3d5b] shadow-sm" : "text-stone-600"}`}>
                        Alamat Lama
                      </button>
                      <button type="button" onClick={() => setAddressMode("new")} className={`rounded-full px-4 py-2 ${addressMode === "new" ? "bg-white text-[#8f3d5b] shadow-sm" : "text-stone-600"}`}>
                        Alamat Baru
                      </button>
                    </div>
                  ) : null}
                </div>

                {addressMode === "saved" && addresses.length > 0 ? (
                  <div className="grid gap-3">
                    {addresses.map((address) => (
                      <label key={address.id} className={`cursor-pointer rounded-2xl border p-4 transition ${selectedAddressId === address.id ? "border-[#8f3d5b] bg-rose-50" : "border-stone-200 hover:border-[#d9a66f]"}`}>
                        <input type="radio" className="sr-only" checked={selectedAddressId === address.id} onChange={() => setSelectedAddressId(address.id)} />
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-bold text-stone-950">{address.receiver_name}</p>
                            <p className="mt-1 text-sm text-stone-600">{address.receiver_phone}</p>
                            <p className="mt-2 leading-6 text-stone-700">{address.full_address}, {address.city} {address.postal_code}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            {address.is_default ? <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-[#8f3d5b]">Utama</span> : null}
                            <button
                              type="button"
                              onClick={(event) => {
                                event.preventDefault();
                                deleteAddress(address.id);
                              }}
                              className="rounded-full p-2 text-red-500 hover:bg-red-50"
                              aria-label="Hapus alamat"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">Nama Penerima *</label>
                      <input name="fullName" value={shippingData.fullName} onChange={handleInputChange} className="w-full rounded-xl border border-stone-300 px-4 py-3 focus:border-[#8f3d5b] focus:ring-2 focus:ring-rose-100" placeholder="Nama lengkap" />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700"><Phone className="mr-1 inline h-4 w-4" />Nomor HP *</label>
                        <input type="tel" name="phone" value={shippingData.phone} onChange={handleInputChange} className="w-full rounded-xl border border-stone-300 px-4 py-3 focus:border-[#8f3d5b] focus:ring-2 focus:ring-rose-100" placeholder="08xxxxxxxxxx" />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700"><Mail className="mr-1 inline h-4 w-4" />Email *</label>
                        <input type="email" name="email" value={shippingData.email} onChange={handleInputChange} className="w-full rounded-xl border border-stone-300 px-4 py-3 focus:border-[#8f3d5b] focus:ring-2 focus:ring-rose-100" placeholder="email@example.com" />
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">Alamat Lengkap *</label>
                      <textarea name="address" value={shippingData.address} onChange={handleInputChange} rows={3} className="w-full rounded-xl border border-stone-300 px-4 py-3 focus:border-[#8f3d5b] focus:ring-2 focus:ring-rose-100" placeholder="Jalan, nomor rumah, kelurahan, patokan, dll" />
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">Kota/Kabupaten *</label>
                        <input name="city" value={shippingData.city} onChange={handleInputChange} className="w-full rounded-xl border border-stone-300 px-4 py-3 focus:border-[#8f3d5b] focus:ring-2 focus:ring-rose-100" placeholder="Jakarta, Bandung, dll" />
                      </div>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-gray-700">Kode Pos *</label>
                        <input name="postalCode" value={shippingData.postalCode} onChange={handleInputChange} className="w-full rounded-xl border border-stone-300 px-4 py-3 focus:border-[#8f3d5b] focus:ring-2 focus:ring-rose-100" placeholder="12345" />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 text-sm font-semibold text-stone-700">
                      <input type="checkbox" name="isDefault" checked={shippingData.isDefault} onChange={handleInputChange} className="h-4 w-4 rounded border-stone-300 text-[#8f3d5b]" />
                      Simpan sebagai alamat utama
                    </label>
                  </div>
                )}
              </section>

              <section className="rounded-[24px] border border-white/80 bg-white p-6 shadow-xl shadow-stone-900/5">
                <h2 className="mb-5 text-2xl font-bold text-gray-900">Metode Pengiriman</h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { id: "regular", label: "Reguler", detail: "Estimasi 3-5 hari", cost: 25000 },
                    { id: "express", label: "Express", detail: "Estimasi 1-2 hari", cost: 50000 },
                  ].map((method) => (
                    <label key={method.id} className={`cursor-pointer rounded-2xl border p-4 transition ${shippingMethod === method.id ? "border-[#8f3d5b] bg-rose-50" : "border-stone-200 hover:border-[#d9a66f]"}`}>
                      <input type="radio" className="sr-only" checked={shippingMethod === method.id} onChange={() => setShippingMethod(method.id)} />
                      <p className="font-bold text-stone-950">{method.label}</p>
                      <p className="mt-1 text-sm text-stone-600">{method.detail}</p>
                      <p className="mt-3 font-bold text-[#8f3d5b]">Rp {method.cost.toLocaleString("id-ID")}</p>
                    </label>
                  ))}
                </div>
              </section>

              <section className="rounded-[24px] border border-white/80 bg-white p-6 shadow-xl shadow-stone-900/5">
                <h2 className="mb-5 flex items-center gap-2 text-2xl font-bold text-gray-900">
                  <CreditCard className="h-6 w-6" />
                  Pembayaran
                </h2>
                <div className="grid gap-3">
                  {paymentMethods.map((method) => (
                    <label key={method.id} className={`cursor-pointer rounded-2xl border p-4 transition ${paymentMethod === method.id ? "border-[#8f3d5b] bg-rose-50" : "border-stone-200 hover:border-[#d9a66f]"}`}>
                      <input type="radio" className="sr-only" checked={paymentMethod === method.id} onChange={() => setPaymentMethod(method.id)} />
                      <p className="font-bold text-stone-950">{method.label}</p>
                      <p className="mt-1 text-sm text-stone-600">{method.detail}</p>
                    </label>
                  ))}
                </div>
                <div className="mt-5 rounded-2xl bg-stone-950 p-4 text-white">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d9a66f]">Instruksi Pembayaran</p>
                  <p className="mt-2 font-semibold">{paymentInstructions[paymentMethod]}</p>
                  <p className="mt-3 text-sm text-stone-300">Nominal yang harus dibayar: Rp {total.toLocaleString("id-ID")}</p>
                </div>
                {paymentMethod !== "midtrans" ? (
                <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#d9a66f] bg-[#fbf7f2] p-6 text-center hover:bg-rose-50">
                  <Upload className="h-8 w-8 text-[#8f3d5b]" />
                  <span className="mt-2 font-bold text-stone-950">{paymentProof ? paymentProof.name : "Upload Bukti Pembayaran"}</span>
                  <span className="mt-1 text-sm text-stone-500">JPG, PNG, atau WEBP maksimal 5MB</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(event) => setPaymentProof(event.target.files?.[0] ?? null)} />
                </label>
                ) : (
                  <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                    Tidak perlu upload bukti. Setelah pembayaran Midtrans berhasil, status pesanan akan berubah otomatis.
                  </div>
                )}
              </section>

              <section className="rounded-[24px] border border-white/80 bg-white p-6 shadow-xl shadow-stone-900/5">
                <h2 className="mb-4 text-lg font-bold text-gray-900">Catatan Tambahan</h2>
                <textarea name="notes" value={shippingData.notes} onChange={handleInputChange} rows={3} className="w-full rounded-xl border border-stone-300 px-4 py-3 focus:border-[#8f3d5b] focus:ring-2 focus:ring-rose-100" placeholder="Catatan untuk penjual atau kurir..." />
              </section>
            </div>

            <aside className="lg:col-span-1">
              <div className="sticky top-24 rounded-[24px] border border-white/80 bg-white p-6 shadow-xl shadow-stone-900/5">
                <h2 className="mb-6 text-xl font-bold text-gray-900">Ringkasan Pesanan</h2>

                <div className="mb-6 space-y-3 border-b border-gray-200 pb-6">
                  {cart.map((item) => (
                    <div key={item.id} className="flex justify-between gap-3 text-sm">
                      <span className="text-gray-600">{item.product_name} x{item.quantity}</span>
                      <span className="font-medium text-gray-900">Rp {(item.base_price * item.quantity).toLocaleString("id-ID")}</span>
                    </div>
                  ))}
                </div>

                <div className="mb-6 space-y-3 border-b border-gray-200 pb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">Rp {subtotal.toLocaleString("id-ID")}</span>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-gray-700">Kode Promo</label>
                    <div className="flex gap-2">
                      <input
                        value={promoCode}
                        onChange={(event) => {
                          setPromoCode(event.target.value.toUpperCase());
                          setPromoMessage(null);
                        }}
                        className="min-w-0 flex-1 rounded-xl border border-stone-300 px-3 py-2 text-sm focus:border-[#8f3d5b] focus:outline-none focus:ring-2 focus:ring-rose-100"
                        placeholder="AUREVINA10"
                      />
                      <button type="button" onClick={applyPromoCode} className="rounded-xl bg-[#8f3d5b] px-3 py-2 text-sm font-bold text-white">
                        Pakai
                      </button>
                    </div>
                    {promoMessage ? <p className={`mt-2 text-xs ${appliedPromo ? "text-emerald-700" : "text-red-600"}`}>{promoMessage}</p> : null}
                  </div>
                  {promoDiscount > 0 ? (
                    <div className="flex justify-between text-[#8f3d5b]">
                      <span>Diskon Promo</span>
                      <span className="font-medium">- Rp {promoDiscount.toLocaleString("id-ID")}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pengiriman</span>
                    <span className="font-medium">Rp {shippingCost.toLocaleString("id-ID")}</span>
                  </div>
                </div>

                <div className="mb-6 flex items-center justify-between">
                  <span className="text-lg font-bold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-[#8f3d5b]">Rp {total.toLocaleString("id-ID")}</span>
                </div>

                {selectedAddress && addressMode === "saved" ? (
                  <div className="mb-5 rounded-2xl bg-[#fbf7f2] p-4 text-sm text-stone-700">
                    Dikirim ke <strong>{selectedAddress.receiver_name}</strong>, {selectedAddress.city}
                  </div>
                ) : null}

                <button type="submit" disabled={isProcessing} className="w-full rounded-xl bg-[#8f3d5b] py-4 text-lg font-bold text-white transition-colors hover:bg-[#76304a] disabled:cursor-not-allowed disabled:opacity-50">
                  {isProcessing ? "Memproses..." : "Bayar & Buat Pesanan"}
                </button>
              </div>
            </aside>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
