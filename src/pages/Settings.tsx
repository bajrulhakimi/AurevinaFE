import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Save } from "lucide-react";
import API, { getApiErrorMessage } from "../services/api";
import { defaultSettings } from "../types/settings";
import type { SiteSettings } from "../types/settings";

const textFields: Array<{ name: keyof SiteSettings; label: string; placeholder?: string }> = [
  { name: "store_name", label: "Nama Toko" },
  { name: "phone_primary", label: "No HP Utama" },
  { name: "phone_secondary", label: "No HP Kedua" },
  { name: "whatsapp", label: "Nomor WhatsApp", placeholder: "62812..." },
  { name: "email", label: "Email Toko" },
  { name: "address", label: "Alamat Toko" },
  { name: "map_url", label: "Tautan Google Maps" },
  { name: "instagram_url", label: "Tautan Instagram" },
  { name: "x_url", label: "Tautan X / Twitter" },
  { name: "telegram_url", label: "Tautan Telegram" },
  { name: "business_hours", label: "Jam Kerja", placeholder: "Senin - Jumat: 09:00 - 18:00" },
];

export default function Settings() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await API.get("/admin/settings");
        setSettings({ ...defaultSettings, ...(response.data?.data ?? {}) });
      } catch (err) {
        setError(getApiErrorMessage(err, "Pengaturan toko gagal dimuat."));
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const updateField = (name: keyof SiteSettings, value: string) => {
    setSettings((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const response = await API.put("/admin/settings", settings);
      setSettings({ ...defaultSettings, ...(response.data?.data ?? {}) });
      setMessage("Pengaturan toko berhasil disimpan.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Pengaturan toko gagal disimpan."));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#8f3d5b]" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-[2rem] border border-white bg-[#15110f] p-6 text-white shadow-xl shadow-stone-300/40">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#d9b17c]">Identitas Toko</p>
        <h2 className="mt-2 text-3xl font-bold tracking-normal">Pengaturan Toko</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-stone-300">
          Atur kontak, alamat, sosial media, tentang kami, kebijakan privasi, dan syarat ketentuan yang tampil di halaman customer.
        </p>
      </div>

      {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{message}</div> : null}
      {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div> : null}

      <section className="rounded-[2rem] border border-white bg-white/95 p-6 shadow-sm ring-1 ring-slate-900/5">
        <h3 className="text-lg font-semibold text-slate-950">Kontak & Sosial Media</h3>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {textFields.map((field) => (
            <label key={field.name} className="block">
              <span className="text-sm font-medium text-slate-700">{field.label}</span>
              <input
                value={settings[field.name]}
                onChange={(event) => updateField(field.name, event.target.value)}
                placeholder={field.placeholder}
                className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-slate-900 focus:border-[#8f3d5b] focus:outline-none focus:ring-2 focus:ring-[#8f3d5b]/15"
              />
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-[2rem] border border-white bg-white/95 p-6 shadow-sm ring-1 ring-slate-900/5">
        <h3 className="text-lg font-semibold text-slate-950">Tentang Kami</h3>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Judul / Headline Tentang Kami</span>
            <input
              value={settings.about_headline}
              onChange={(event) => updateField("about_headline", event.target.value)}
              placeholder="Kalimat utama di halaman Tentang Kami"
              className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-slate-900 focus:border-[#8f3d5b] focus:outline-none focus:ring-2 focus:ring-[#8f3d5b]/15"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">URL Gambar Tentang Kami</span>
            <input
              value={settings.about_image_url}
              onChange={(event) => updateField("about_image_url", event.target.value)}
              placeholder="https://..."
              className="mt-2 w-full rounded-2xl border border-stone-300 px-4 py-3 text-slate-900 focus:border-[#8f3d5b] focus:outline-none focus:ring-2 focus:ring-[#8f3d5b]/15"
            />
          </label>
        </div>
        <textarea
          value={settings.about_us}
          onChange={(event) => updateField("about_us", event.target.value)}
          rows={6}
          className="mt-4 w-full rounded-2xl border border-stone-300 px-4 py-3 text-slate-900 focus:border-[#8f3d5b] focus:outline-none focus:ring-2 focus:ring-[#8f3d5b]/15"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-white bg-white/95 p-6 shadow-sm ring-1 ring-slate-900/5">
          <h3 className="text-lg font-semibold text-slate-950">Kebijakan Privasi</h3>
          <textarea
            value={settings.privacy_policy}
            onChange={(event) => updateField("privacy_policy", event.target.value)}
            rows={14}
            className="mt-4 w-full rounded-2xl border border-stone-300 px-4 py-3 text-slate-900 focus:border-[#8f3d5b] focus:outline-none focus:ring-2 focus:ring-[#8f3d5b]/15"
          />
        </div>
        <div className="rounded-[2rem] border border-white bg-white/95 p-6 shadow-sm ring-1 ring-slate-900/5">
          <h3 className="text-lg font-semibold text-slate-950">Syarat & Ketentuan</h3>
          <textarea
            value={settings.terms_conditions}
            onChange={(event) => updateField("terms_conditions", event.target.value)}
            rows={14}
            className="mt-4 w-full rounded-2xl border border-stone-300 px-4 py-3 text-slate-900 focus:border-[#8f3d5b] focus:outline-none focus:ring-2 focus:ring-[#8f3d5b]/15"
          />
        </div>
      </section>

      <div className="sticky bottom-4 flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-2xl bg-[#8f3d5b] px-6 py-3 font-semibold text-white shadow-lg shadow-[#8f3d5b]/20 hover:bg-[#78304b] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-5 w-5" />
          {saving ? "Menyimpan..." : "Simpan Pengaturan"}
        </button>
      </div>
    </form>
  );
}
