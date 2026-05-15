import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, Mail, Phone, ShieldCheck, Sparkles, User, UserPlus } from "lucide-react";
import API, { getApiErrorMessage } from "../services/api";
import heroImage from "../assets/hero.png";

export default function Signup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    verificationCode: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const sendVerificationCode = async () => {
    setSendingCode(true);
    setError(null);
    setSuccessMessage(null);

    try {
      await API.post("/auth/send-register-code", {
        email: formData.email,
      });
      setCodeSent(true);
      setSuccessMessage("Kode verifikasi sudah dikirim ke email. Masukkan kode 6 digit untuk lanjut membuat password.");
    } catch (err) {
      setError(getApiErrorMessage(err, "Kode verifikasi gagal dikirim."));
    } finally {
      setSendingCode(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (formData.password !== formData.confirmPassword) {
        throw new Error("Password dan konfirmasi password tidak sama.");
      }

      await API.post("/auth/register", {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || undefined,
        verification_code: formData.verificationCode,
        password: formData.password,
        password_confirmation: formData.confirmPassword,
      });

      setSuccessMessage("Akun berhasil dibuat dan email sudah terverifikasi. Silakan login.");
      setCodeSent(false);
      setFormData({
        name: "",
        email: "",
        phone: "",
        verificationCode: "",
        password: "",
        confirmPassword: "",
      });
    } catch (err) {
      setError(getApiErrorMessage(err, "Pendaftaran gagal. Silakan coba lagi."));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fbf7f2]">
      <div className="absolute inset-0">
        <img src={heroImage} alt="" className="h-full w-full object-cover opacity-10" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,#fbf7f2_0%,rgba(251,247,242,0.96)_45%,rgba(143,61,91,0.14)_100%)]" />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <section className="hidden h-[calc(100vh-80px)] min-h-[680px] flex-col justify-between overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(160deg,#2a111b_0%,#12090c_52%,#3d1b27_100%)] p-10 text-white shadow-2xl shadow-rose-950/10 lg:flex">
          <Link to="/" className="inline-flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#8f3d5b]">
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="text-2xl font-bold">Aurevina</span>
          </Link>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#d9a66f]">Akun Pelanggan</p>
            <h1 className="!mb-0 !mt-5 !text-5xl font-bold leading-tight !text-white">Buat akun dulu, checkout jadi lebih cepat.</h1>
            <p className="mt-5 max-w-md leading-7 text-stone-100">
              Simpan identitas pelanggan untuk checkout web, riwayat pesanan, dan proses pembayaran yang lebih rapi.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/20 bg-white/15 p-4 shadow-lg shadow-black/10">
              <ShieldCheck className="mb-3 h-5 w-5 text-[#d9a66f]" />
              <p className="text-sm font-semibold text-white">Data tersimpan</p>
              <p className="mt-1 text-xs leading-5 text-stone-200">Checkout dan pesanan lebih rapi.</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/15 p-4 shadow-lg shadow-black/10">
              <UserPlus className="mb-3 h-5 w-5 text-[#d9a66f]" />
              <p className="text-sm font-semibold text-white">Untuk pelanggan</p>
              <p className="mt-1 text-xs leading-5 text-stone-200">Akun baru otomatis customer.</p>
            </div>
          </div>
        </section>

        <main className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-10">
          <div className="w-full max-w-md">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#6f5135] hover:text-[#8f3d5b]"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali
            </button>

            <div className="rounded-[1.75rem] border border-white/80 bg-white/90 p-8 shadow-2xl shadow-rose-950/10 backdrop-blur">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#8f3d5b] text-white shadow-lg shadow-rose-900/20">
                <UserPlus className="h-7 w-7" />
              </div>

              <h1 className="!m-0 !text-3xl font-bold !text-stone-950">Daftar Akun Pelanggan</h1>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                Verifikasi email dengan kode 6 digit, lalu buat password akun.
              </p>

              {error && (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}
              {successMessage && (
                <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {successMessage}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-stone-700">Nama Lengkap</label>
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 h-5 w-5 text-stone-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-stone-200 bg-[#fbf7f2] py-3.5 pl-12 pr-4 text-stone-950 outline-none transition focus:border-[#8f3d5b] focus:bg-white focus:ring-4 focus:ring-rose-100"
                      placeholder="Nama lengkap"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-stone-700">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 h-5 w-5 text-stone-400" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-stone-200 bg-[#fbf7f2] py-3.5 pl-12 pr-4 text-stone-950 outline-none transition focus:border-[#8f3d5b] focus:bg-white focus:ring-4 focus:ring-rose-100"
                      placeholder="email@example.com"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={sendVerificationCode}
                    disabled={sendingCode || !formData.email}
                    className="mt-3 w-full rounded-2xl border border-[#8f3d5b] px-4 py-3 text-sm font-bold text-[#8f3d5b] transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {sendingCode ? "Mengirim kode..." : codeSent ? "Kirim Ulang Kode" : "Kirim Kode Verifikasi"}
                  </button>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-stone-700">Nomor HP</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-3.5 h-5 w-5 text-stone-400" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-stone-200 bg-[#fbf7f2] py-3.5 pl-12 pr-4 text-stone-950 outline-none transition focus:border-[#8f3d5b] focus:bg-white focus:ring-4 focus:ring-rose-100"
                      placeholder="08xxxxxxxxxx"
                    />
                  </div>
                </div>

                {codeSent ? (
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-stone-700">Kode Verifikasi</label>
                    <input
                      type="text"
                      name="verificationCode"
                      value={formData.verificationCode}
                      onChange={handleChange}
                      maxLength={6}
                      className="w-full rounded-2xl border border-stone-200 bg-[#fbf7f2] px-4 py-3.5 text-center text-2xl font-bold tracking-[0.35em] text-stone-950 outline-none transition focus:border-[#8f3d5b] focus:bg-white focus:ring-4 focus:ring-rose-100"
                      placeholder="000000"
                      required
                    />
                  </div>
                ) : null}

                {codeSent ? <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-stone-700">Password</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-stone-200 bg-[#fbf7f2] px-4 py-3.5 text-stone-950 outline-none transition focus:border-[#8f3d5b] focus:bg-white focus:ring-4 focus:ring-rose-100"
                      placeholder="Minimal 6 karakter"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-stone-700">Konfirmasi</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-stone-200 bg-[#fbf7f2] px-4 py-3.5 text-stone-950 outline-none transition focus:border-[#8f3d5b] focus:bg-white focus:ring-4 focus:ring-rose-100"
                      placeholder="Ulangi password"
                      required
                    />
                  </div>
                </div> : null}

                <button
                  type="submit"
                  disabled={loading || !codeSent}
                  className="w-full rounded-2xl bg-[#8f3d5b] px-4 py-3.5 font-bold text-white shadow-lg shadow-rose-900/10 transition hover:bg-[#76304a] disabled:cursor-not-allowed disabled:bg-stone-400"
                >
                  {loading ? "Mendaftarkan..." : "Buat Akun"}
                </button>
              </form>

              <p className="mt-5 text-center text-sm text-stone-600">
                Sudah punya akun?{" "}
                <Link to={`/login?redirect=${encodeURIComponent(redirectTo)}`} className="font-bold text-[#8f3d5b] hover:underline">
                  Masuk di sini
                </Link>
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
