import { useState } from "react";
import type { FormEvent, ChangeEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Lock, LogIn, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "../context/useAuth";
import API, { getApiErrorMessage } from "../services/api";
import heroImage from "../assets/hero.png";

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const redirectTo = searchParams.get("redirect") || "/";
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setNotice(null);

    try {
      // Hubungkan ke backend API untuk login
      const response = await API.post("/auth/login", {
        email: formData.email,
        password: formData.password,
      });

      const { data } = response.data;

      if (!data.user || !data.token) {
        throw new Error("Invalid response from server");
      }

      const backendRole = data.user.role as "admin" | "customer";

      // Simpan ke context dan localStorage
      login(data.token, {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: backendRole,
      });

      // Redirect berdasarkan role
      if (backendRole === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate(redirectTo, { replace: true });
      }
    } catch (err) {
      setError(getApiErrorMessage(err, "Login gagal. Periksa email dan password."));
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
        <section className="hidden h-[calc(100vh-80px)] min-h-[620px] flex-col justify-between overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(160deg,#2a111b_0%,#12090c_52%,#3d1b27_100%)] p-10 text-white shadow-2xl shadow-rose-950/10 lg:flex">
          <div>
            <Link to="/" className="inline-flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#8f3d5b]">
                <Sparkles className="h-5 w-5" />
              </span>
              <span className="text-2xl font-bold">Aurevina</span>
            </Link>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-[#d9a66f]">Masuk Akun</p>
            <h1 className="!mb-0 !mt-5 !text-5xl font-bold leading-tight !text-white">Belanja modest fashion jadi lebih rapi.</h1>
            <p className="mt-5 max-w-md leading-7 text-stone-100">
              Login untuk melanjutkan checkout, melihat pesanan, dan menyimpan pengalaman belanja Aurevina.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/20 bg-white/15 p-4 shadow-lg shadow-black/10">
              <ShieldCheck className="mb-3 h-5 w-5 text-[#d9a66f]" />
              <p className="text-sm font-semibold text-white">Akun aman</p>
              <p className="mt-1 text-xs leading-5 text-stone-200">Role dibaca otomatis dari email.</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/15 p-4 shadow-lg shadow-black/10">
              <LogIn className="mb-3 h-5 w-5 text-[#d9a66f]" />
              <p className="text-sm font-semibold text-white">Checkout cepat</p>
              <p className="mt-1 text-xs leading-5 text-stone-200">Keranjang langsung lanjut pesanan.</p>
            </div>
          </div>
        </section>

        <main className="flex items-center justify-center">
          <div className="w-full max-w-md">
            <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-[#6f5135] hover:text-[#8f3d5b]">
              <ArrowLeft className="h-4 w-4" />
              Kembali ke beranda
            </Link>

            <div className="rounded-[1.75rem] border border-white/80 bg-white/90 p-8 shadow-2xl shadow-rose-950/10 backdrop-blur">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#8f3d5b] text-white shadow-lg shadow-rose-900/20">
                <LogIn className="h-7 w-7" />
              </div>

              <h1 className="!m-0 !text-3xl font-bold !text-stone-950">Masuk ke akun</h1>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                Gunakan email dan password. Sistem otomatis masuk sesuai role akun.
              </p>

              {error && (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              )}
              {notice && (
                <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  {notice}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
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
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-stone-700">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 h-5 w-5 text-stone-400" />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full rounded-2xl border border-stone-200 bg-[#fbf7f2] py-3.5 pl-12 pr-4 text-stone-950 outline-none transition focus:border-[#8f3d5b] focus:bg-white focus:ring-4 focus:ring-rose-100"
                      placeholder="Masukkan password"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-2xl bg-[#8f3d5b] px-4 py-3.5 font-bold text-white shadow-lg shadow-rose-900/10 transition hover:bg-[#76304a] disabled:cursor-not-allowed disabled:bg-stone-400"
                >
                  {loading ? "Sedang masuk..." : "Masuk"}
                </button>
              </form>

              <p className="mt-5 text-center text-sm text-stone-600">
                Belum punya akun pelanggan?{" "}
                <Link to={`/signup?redirect=${encodeURIComponent(redirectTo)}`} className="font-bold text-[#8f3d5b] hover:underline">
                  Daftar dulu
                </Link>
              </p>

              <p className="mt-5 rounded-2xl bg-[#fbf7f2] px-4 py-3 text-center text-xs leading-5 text-stone-500">
                Admin dan pelanggan tidak perlu memilih role. Untuk akun baru, verifikasi email dilakukan dengan kode sebelum password dibuat.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
