import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import API from "../services/api";
import { defaultSettings } from "../types/settings";
import type { SiteSettings } from "../types/settings";

export default function LegalPage() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await API.get("/settings");
        setSettings({ ...defaultSettings, ...(response.data?.data ?? {}) });
      } catch (error) {
        console.error("Failed to load site settings:", error);
      }
    };

    fetchSettings();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <section className="bg-[#fbf7f2] py-14">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-[#b9895e]">
              {settings.store_name}
            </p>
            <h1 className="text-4xl font-bold text-stone-950">Kebijakan & Ketentuan</h1>
            <p className="mt-3 text-stone-600">Informasi privasi pelanggan dan ketentuan belanja di {settings.store_name}.</p>
          </div>
        </section>

        <section className="mx-auto grid max-w-5xl gap-6 px-4 py-12 sm:px-6 lg:px-8">
          <article className="prose max-w-none whitespace-pre-line rounded-2xl border border-stone-200 bg-white p-8 leading-8 text-stone-700 shadow-sm">
            {settings.privacy_policy}
          </article>
          <article className="prose max-w-none whitespace-pre-line rounded-2xl border border-stone-200 bg-white p-8 leading-8 text-stone-700 shadow-sm">
            {settings.terms_conditions}
          </article>
        </section>
      </main>
      <Footer />
    </div>
  );
}
