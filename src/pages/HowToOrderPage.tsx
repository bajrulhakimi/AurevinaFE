import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CreditCard, PackageCheck, ShoppingBag, Truck } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import heroImage from "../assets/hero.png";
import API from "../services/api";
import { defaultSettings } from "../types/settings";
import type { SiteSettings } from "../types/settings";

const fallbackSteps = [
  {
    title: "Pilih Produk",
    description: "Buka halaman produk, pilih hijab atau busana yang kamu suka, lalu lihat detail warna, harga, stok, dan ulasan.",
    icon: ShoppingBag,
  },
  {
    title: "Masukkan Keranjang",
    description: "Di halaman detail produk, pilih varian warna dan jumlah. Setelah itu klik Tambah ke Keranjang.",
    icon: PackageCheck,
  },
  {
    title: "Checkout & Pilih Alamat",
    description: "Login terlebih dahulu. Kamu bisa memakai alamat tersimpan atau membuat alamat pengiriman baru.",
    icon: Truck,
  },
  {
    title: "Bayar dan Upload Bukti",
    description: "Pilih metode pembayaran, transfer sesuai total belanja, lalu upload bukti pembayaran di halaman checkout.",
    icon: CreditCard,
  },
  {
    title: "Pantau Pesanan",
    description: "Setelah pembayaran dikirim, pesanan masuk ke admin. Status pesanan bisa dilihat di halaman Pesanan Saya.",
    icon: CheckCircle2,
  },
];

export default function HowToOrderPage() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await API.get("/settings");
        setSettings({ ...defaultSettings, ...(response.data?.data ?? {}) });
      } catch {
        setSettings(defaultSettings);
      }
    };

    fetchSettings();
  }, []);

  const steps = useMemo(() => {
    const parsedSteps = settings.how_to_order_steps
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => {
        const [title, ...descriptionParts] = line.split("|");
        return {
          title: title?.trim() || fallbackSteps[index]?.title || `Langkah ${index + 1}`,
          description: descriptionParts.join("|").trim() || fallbackSteps[index]?.description || "",
          icon: fallbackSteps[index]?.icon || CheckCircle2,
        };
      });

    return parsedSteps.length ? parsedSteps : fallbackSteps;
  }, [settings.how_to_order_steps]);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <section className="bg-[#fbf7f2] py-16">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
            <div className="flex flex-col justify-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-[#b9895e]">Panduan Belanja</p>
              <h1 className="text-4xl font-bold leading-tight text-stone-950 sm:text-5xl">{settings.how_to_order_title}</h1>
              <p className="mt-5 max-w-xl text-lg leading-8 text-stone-600">
                {settings.how_to_order_description}
              </p>
              <Link to="/products" className="mt-7 inline-flex w-fit rounded-full bg-[#8f3d5b] px-6 py-3 font-bold text-white hover:bg-[#76304a]">
                Mulai Belanja
              </Link>
            </div>
            <div className="overflow-hidden rounded-[28px] border border-white bg-white p-3 shadow-2xl shadow-stone-900/10">
              <img src={heroImage} alt="Aurevina modest fashion" className="aspect-square w-full rounded-[22px] object-cover" />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
            {steps.map((step, index) => (
              <article key={step.title} className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
                <div className="relative aspect-[4/3] overflow-hidden bg-[#fbf7f2]">
                  <img src={heroImage} alt={step.title} className="h-full w-full object-cover opacity-75" />
                  <div className="absolute inset-0 bg-stone-950/25" />
                  <div className="absolute left-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#8f3d5b] shadow-sm">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <span className="absolute bottom-4 left-4 rounded-full bg-[#8f3d5b] px-3 py-1 text-xs font-bold text-white">
                    Langkah {index + 1}
                  </span>
                </div>
                <div className="p-5">
                  <h2 className="text-lg font-bold text-stone-950">{step.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-600">{step.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
