import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { Camera, Mail, MapPin, Phone, Send } from "lucide-react";
import API, { getApiErrorMessage } from "../services/api";
import { defaultSettings } from "../types/settings";
import type { SiteSettings } from "../types/settings";

const productLinks = [
  { label: "Semua Produk", to: "/products" },
  { label: "Promo Spesial", to: "/products?promo=1" },
  { label: "Produk Baru", to: "/products?sort=new" },
  { label: "Best Seller", to: "/products?sort=best-seller" },
];

const companyLinks = [
  { label: "Tentang Kami", to: "/contact" },
  { label: "Blog", to: "/blog" },
  { label: "Kebijakan & Ketentuan", to: "/legal" },
  { label: "Cara Order", to: "/how-to-order" },
];

export default function Footer() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [email, setEmail] = useState("");
  const [subscribeStatus, setSubscribeStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    API.get("/settings")
      .then((response) => setSettings({ ...defaultSettings, ...(response.data?.data ?? {}) }))
      .catch((error) => console.error("Failed to load footer settings:", error));
  }, []);

  const handleSubscribe = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    setSubscribeStatus(null);
    try {
      await API.post("/contact", {
        name: "Newsletter Subscriber",
        email: email.trim(),
        subject: "Subscribe Promo Eksklusif",
        message: `Email ${email.trim()} ingin menerima promo eksklusif Aurevina.`,
      });
      setEmail("");
      setSubscribeStatus("Terima kasih, email kamu sudah terdaftar.");
    } catch (error) {
      setSubscribeStatus(getApiErrorMessage(error, "Gagal subscribe. Coba lagi nanti."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="bg-stone-950 text-stone-300">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <h3 className="mb-4 text-2xl font-bold text-white">{settings.store_name}</h3>
            <p className="mb-5 leading-7 text-stone-400">
              {settings.about_us}
            </p>
            <div className="flex gap-3">
              <a
                href={settings.instagram_url || "https://www.instagram.com/"}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-stone-200 transition-colors hover:bg-[#8f3d5b]"
                aria-label="Instagram Aurevina"
              >
                <Camera className="h-5 w-5" />
              </a>
              <a
                href={settings.telegram_url || settings.x_url || "https://t.me/"}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-stone-200 transition-colors hover:bg-[#8f3d5b]"
                aria-label="Telegram Aurevina"
              >
                <Send className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-lg font-semibold text-white">Produk</h4>
            <ul className="space-y-2">
              {productLinks.map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="text-stone-400 transition-colors hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-lg font-semibold text-white">Perusahaan</h4>
            <ul className="space-y-2">
              {companyLinks.map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="text-stone-400 transition-colors hover:text-white">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-lg font-semibold text-white">Hubungi Kami</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <Phone className="mt-1 h-5 w-5 flex-shrink-0 text-[#d9a66f]" />
                <div>
                  <a href={`tel:${settings.phone_primary.replace(/\s+/g, "")}`} className="block text-stone-400 transition-colors hover:text-white">{settings.phone_primary}</a>
                  <a href={`https://wa.me/${settings.whatsapp || settings.phone_secondary.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="block text-stone-400 transition-colors hover:text-white">{settings.phone_secondary}</a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="mt-1 h-5 w-5 flex-shrink-0 text-[#d9a66f]" />
                <a href={`mailto:${settings.email}`} className="text-stone-400 transition-colors hover:text-white">{settings.email}</a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-1 h-5 w-5 flex-shrink-0 text-[#d9a66f]" />
                <a href={settings.map_url || "#"} target="_blank" rel="noreferrer" className="text-stone-400 transition-colors hover:text-white">{settings.address}</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mb-12 rounded-2xl border border-white/10 bg-white/[0.06] p-8">
          <div className="mx-auto max-w-2xl">
            <h3 className="mb-4 text-center text-2xl font-bold text-white">Dapatkan Promo Eksklusif</h3>
            <p className="mb-6 text-center text-stone-400">
              Masukkan email untuk koleksi terbaru, restock warna favorit, dan penawaran khusus.
            </p>
            <form onSubmit={handleSubscribe} className="flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="Email Anda"
                required
                className="flex-1 rounded-full border border-white/10 bg-white/10 px-5 py-3 text-white placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#d9a66f]"
              />
              <button
                type="submit"
                disabled={submitting}
                className="rounded-full bg-[#d9a66f] px-8 py-3 font-semibold text-stone-950 transition-colors hover:bg-[#efbd86] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Mengirim..." : "Subscribe"}
              </button>
            </form>
            {subscribeStatus ? (
              <p className="mt-3 text-center text-sm text-stone-300">{subscribeStatus}</p>
            ) : null}
          </div>
        </div>

        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-sm text-stone-400">&copy; 2026 {settings.store_name}. Semua hak cipta dilindungi.</p>
            <div className="flex gap-6">
              <Link to="/legal" className="text-sm text-stone-400 transition-colors hover:text-white">
                Kebijakan & Ketentuan
              </Link>
              <Link to="/how-to-order" className="text-sm text-stone-400 transition-colors hover:text-white">
                Cara Order
              </Link>
              <Link to="/" className="text-sm text-stone-400 transition-colors hover:text-white">
                Sitemap
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
