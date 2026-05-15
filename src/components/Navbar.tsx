import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, ShoppingCart, LogIn, UserPlus, UserRound } from "lucide-react";
import { useCart } from "../context/useCart";
import { useAuth } from "../context/useAuth";
import logo1 from "../assets/logo1.png";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { cart } = useCart();
  const { user, isAuthenticated, logout } = useAuth();

  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  const isActive = (path: string) =>
    location.pathname === path
      ? "text-[#8f3d5b] font-semibold"
      : "text-stone-700 hover:text-[#8f3d5b]";

  return (
    <nav className="sticky top-0 z-50 border-b border-rose-100/80 bg-white/90 shadow-sm backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-18 min-h-[72px]">
          {/* Logo */}
          <Link to="/" className="group flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-rose-100 bg-white shadow-sm transition-transform group-hover:scale-105">
              <img src={logo1} alt="Aurevina Logo" className="h-10 w-10 object-contain" />
            </span>
            <div>
              <div className="text-2xl font-bold leading-none tracking-normal text-stone-950">
                Aurevina
              </div>
              <div className="mt-1 text-[11px] font-semibold uppercase leading-none tracking-[0.22em] text-[#b9895e]">
                Modest Fashion
              </div>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className={`transition-colors ${isActive("/")}`}>
              Beranda
            </Link>
            <Link to="/products" className={`transition-colors ${isActive("/products")}`}>
              Produk
            </Link>
            <Link to="/blog" className={`transition-colors ${isActive("/blog")}`}>
              Blog
            </Link>
            <Link to="/contact" className={`transition-colors ${isActive("/contact") || isActive("/about")}`}>
              Tentang Kami
            </Link>
          </div>

          {/* Right side - Cart & Login */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/cart"
              className="relative flex items-center gap-2 text-stone-700 transition-colors hover:text-[#8f3d5b]"
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="text-sm font-semibold">Keranjang</span>
              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#d15f73] text-xs font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 rounded-full bg-[#fbf7f2] px-3 py-2 text-sm font-semibold text-stone-800 transition hover:bg-[#f4e5dd] hover:text-[#8f3d5b]"
                >
                  <UserRound className="h-4 w-4" />
                  {user?.name}
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-50"
                >
                  Keluar
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="flex items-center gap-2 rounded-full border border-[#8f3d5b] px-4 py-2 text-[#8f3d5b] transition-colors hover:bg-rose-50"
                >
                  <LogIn className="h-4 w-4" />
                  <span className="text-sm font-semibold">Login</span>
                </Link>
                <Link
                  to="/signup"
                  className="flex items-center gap-2 rounded-full bg-[#8f3d5b] px-4 py-2 text-white shadow-sm transition-colors hover:bg-[#76304a]"
                >
                  <UserPlus className="h-4 w-4" />
                  <span className="text-sm font-semibold">Daftar</span>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-stone-700 hover:text-[#8f3d5b] md:hidden"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="space-y-2 border-t border-rose-100 bg-white py-4 md:hidden">
            <Link
              to="/"
              className="block rounded px-4 py-2 text-stone-700 transition-colors hover:bg-rose-50 hover:text-[#8f3d5b]"
              onClick={() => setIsOpen(false)}
            >
              Beranda
            </Link>
            <Link
              to="/products"
              className="block rounded px-4 py-2 text-stone-700 transition-colors hover:bg-rose-50 hover:text-[#8f3d5b]"
              onClick={() => setIsOpen(false)}
            >
              Produk
            </Link>
            <Link
              to="/blog"
              className="block rounded px-4 py-2 text-stone-700 transition-colors hover:bg-rose-50 hover:text-[#8f3d5b]"
              onClick={() => setIsOpen(false)}
            >
              Blog
            </Link>
            <Link
              to="/contact"
              className="block rounded px-4 py-2 text-stone-700 transition-colors hover:bg-rose-50 hover:text-[#8f3d5b]"
              onClick={() => setIsOpen(false)}
            >
              Tentang Kami
            </Link>
            {isAuthenticated && (
              <Link
                to="/profile"
                className="block rounded px-4 py-2 text-stone-700 transition-colors hover:bg-rose-50 hover:text-[#8f3d5b]"
                onClick={() => setIsOpen(false)}
              >
                Profil
              </Link>
            )}
            <div className="mt-4 space-y-2 border-t border-rose-100 pt-4">
              <Link
                to="/cart"
                className="relative flex w-full items-center justify-center gap-2 rounded px-4 py-2 text-stone-700 transition-colors hover:bg-rose-50 hover:text-[#8f3d5b]"
                onClick={() => setIsOpen(false)}
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="text-sm font-semibold">Keranjang</span>
                {cartCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#d15f73] text-xs font-bold text-white">
                    {cartCount}
                  </span>
                )}
              </Link>
              {isAuthenticated ? (
                <button
                  type="button"
                  className="w-full rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-50"
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
                >
                  Keluar
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-[#8f3d5b] px-4 py-2 text-[#8f3d5b] transition-colors hover:bg-rose-50"
                    onClick={() => setIsOpen(false)}
                  >
                    <LogIn className="h-4 w-4" />
                    <span className="text-sm font-semibold">Login</span>
                  </Link>
                  <Link
                    to="/signup"
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-[#8f3d5b] px-4 py-2 text-white transition-colors hover:bg-[#76304a]"
                    onClick={() => setIsOpen(false)}
                  >
                    <UserPlus className="h-4 w-4" />
                    <span className="text-sm font-semibold">Daftar</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
