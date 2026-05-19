import { useEffect, useState } from "react";
import { Clock, Heart, Mail, MapPin, MessageCircle, Phone, ShieldCheck, Sparkles, Truck } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import API from "../services/api";
import { defaultSettings } from "../types/settings";
import type { SiteSettings } from "../types/settings";
import logoImage from "../assets/logo.png";

export default function ContactPage() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);

  useEffect(() => {
    API.get("/settings")
      .then((response) => setSettings({ ...defaultSettings, ...(response.data?.data ?? {}) }))
      .catch((err) => console.error("Failed to load contact settings:", err));
  }, []);

  const contactCards = [
    {
      title: "Email",
      value: settings.email,
      href: `mailto:${settings.email}`,
      icon: Mail,
    },
    {
      title: "Telepon & WhatsApp",
      value: `${settings.phone_primary}\n${settings.phone_secondary}`,
      href: `https://wa.me/${settings.whatsapp || settings.phone_secondary.replace(/\D/g, "")}`,
      icon: Phone,
    },
    {
      title: "Alamat",
      value: settings.address,
      href: settings.map_url || "#",
      icon: MapPin,
    },
    {
      title: "Jam Kerja",
      value: settings.business_hours,
      href: null,
      icon: Clock,
    },
  ];

  const values = [
    {
      title: "Bahan Nyaman",
      description: "Kami memilih material yang lembut, ringan, dan nyaman untuk aktivitas harian.",
      icon: Heart,
    },
    {
      title: "Warna Elegan",
      description: "Setiap koleksi dikurasi agar mudah dipadukan dengan gaya modest yang rapi.",
      icon: Sparkles,
    },
    {
      title: "Belanja Aman",
      description: "Pesanan, pembayaran, chat, dan status pengiriman dibuat jelas dari website.",
      icon: ShieldCheck,
    },
  ];

  return (
    <div className="min-h-screen bg-[#fbf7f2]">
      <Navbar />
      <main>
        <section className="relative overflow-hidden bg-[#fbf7f2] py-16 lg:py-20">
          <div className="absolute inset-0 opacity-50">
            <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-[#f4e5dd] blur-3xl" />
            <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[#ead5bf] blur-3xl" />
          </div>
          <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-[#b9895e]">Tentang Kami</p>
              <h1 className="text-4xl font-bold leading-tight text-stone-950 sm:text-5xl">
                {settings.store_name}
              </h1>
              <p className="mt-5 max-w-2xl text-xl font-semibold leading-8 text-[#8f3d5b]">
                {settings.about_headline}
              </p>
              <p className="mt-5 max-w-2xl whitespace-pre-line text-lg leading-8 text-stone-600">
                {settings.about_us}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="/products" className="inline-flex items-center justify-center rounded-full bg-[#8f3d5b] px-6 py-3 font-bold text-white shadow-lg shadow-[#8f3d5b]/20 hover:bg-[#76304a]">
                  Lihat Koleksi
                </a>
                <a href="/chat" className="inline-flex items-center justify-center gap-2 rounded-full border border-[#8f3d5b] bg-white/70 px-6 py-3 font-bold text-[#8f3d5b] hover:bg-white">
                  <MessageCircle className="h-5 w-5" />
                  Tanya Admin
                </a>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 rounded-[2rem] bg-[#8f3d5b]/10 blur-2xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white bg-white p-3 shadow-2xl shadow-stone-900/10">
                <div className="aspect-[4/3] overflow-hidden rounded-[1.5rem] bg-[#fbf7f2] p-6">
                  <img
                    src={logoImage}
                    alt={`Tentang ${settings.store_name}`}
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="absolute bottom-7 left-7 right-7 rounded-3xl bg-stone-950/82 p-5 text-white backdrop-blur">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#d9b17c]">Aurevina Modest Fashion</p>
                  <p className="mt-2 text-lg font-bold">Koleksi yang terasa rapi dari detail pertama.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
          <div className="grid gap-5 md:grid-cols-3">
            {values.map((item) => {
              const Icon = item.icon;
              return (
                <article key={item.title} className="rounded-[28px] border border-white/80 bg-white p-6 shadow-xl shadow-stone-900/5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f4e5dd] text-[#8f3d5b]">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h2 className="mt-5 text-xl font-bold text-stone-950">{item.title}</h2>
                  <p className="mt-3 leading-7 text-stone-600">{item.description}</p>
                </article>
              );
            })}
          </div>

          <div className="mt-8 rounded-[28px] border border-white/80 bg-white p-6 shadow-xl shadow-stone-900/5 lg:p-8">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b9895e]">Cerita Toko</p>
                <h2 className="mt-3 text-3xl font-bold text-stone-950">Dibuat untuk pengalaman belanja yang dekat dan jelas.</h2>
                <p className="mt-4 leading-8 text-stone-600">
                  {settings.store_name} menghadirkan pilihan hijab dan busana muslim dengan tampilan modern, proses belanja yang mudah,
                  serta komunikasi yang rapi lewat fitur chat. Dari melihat detail produk, memilih warna, checkout, sampai memantau pesanan,
                  semuanya dibuat supaya pelanggan merasa tenang.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-[#fbf7f2] p-5">
                  <Sparkles className="h-7 w-7 text-[#8f3d5b]" />
                  <p className="mt-5 text-3xl font-black text-stone-950">Premium</p>
                  <p className="mt-2 text-sm leading-6 text-stone-600">Pilihan koleksi dengan warna dan material yang dikurasi.</p>
                </div>
                <div className="rounded-3xl bg-[#15110f] p-5 text-white">
                  <Truck className="h-7 w-7 text-[#d9b17c]" />
                  <p className="mt-5 text-3xl font-black">Terpantau</p>
                  <p className="mt-2 text-sm leading-6 text-stone-300">Status pesanan bisa dilihat oleh customer dari halaman profil.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="mb-5">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#b9895e]">Informasi Toko</p>
              <h2 className="mt-2 text-3xl font-bold text-stone-950">Kontak & Lokasi</h2>
            </div>
          <div className="grid gap-5 md:grid-cols-2">
            {contactCards.map((item) => {
              const Icon = item.icon;
              const content = (
                <article className="h-full rounded-[28px] border border-white/80 bg-white p-6 shadow-xl shadow-stone-900/5 transition hover:-translate-y-1 hover:shadow-2xl">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8f3d5b] text-white">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h2 className="mt-5 text-xl font-bold text-stone-950">{item.title}</h2>
                  <p className="mt-3 whitespace-pre-line leading-7 text-stone-600">{item.value}</p>
                </article>
              );

              return item.href ? (
                <a key={item.title} href={item.href} target={item.href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
                  {content}
                </a>
              ) : (
                <div key={item.title}>{content}</div>
              );
            })}
          </div>
          </div>

          <div className="mt-8 rounded-[28px] border border-white/80 bg-stone-950 p-8 text-white shadow-xl shadow-stone-900/10">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#d9b17c]">Butuh Bantuan?</p>
                <h2 className="mt-3 text-3xl font-bold text-[#fbf7f2]">Chat langsung dengan admin</h2>
                <p className="mt-3 max-w-2xl leading-7 text-stone-300">
                  Tanya stok, warna, pesanan, atau pembayaran lewat fitur chat agar percakapan tersimpan rapi.
                </p>
              </div>
              <a href="/chat" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-bold text-[#8f3d5b]">
                <MessageCircle className="h-5 w-5" />
                Buka Chat
              </a>
            </div>
          </div>

          <a
            href={settings.map_url || "#"}
            target="_blank"
            rel="noreferrer"
            className="mt-8 flex h-80 items-center justify-center rounded-[28px] border border-white/80 bg-white transition-colors hover:bg-rose-50"
          >
            <div className="text-center">
              <MapPin className="mx-auto mb-4 h-16 w-16 text-[#8f3d5b]" />
              <p className="font-bold text-stone-950">Buka lokasi toko di Google Maps</p>
              <p className="mt-2 text-stone-600">{settings.address}</p>
            </div>
          </a>
        </section>
      </main>
      <Footer />
    </div>
  );
}
