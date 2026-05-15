import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Hero from "../components/Hero";
import FeaturedProducts from "../components/FeaturedProducts";
import CategoriesSection from "../components/CategoriesSection";
import PromoSection from "../components/PromoSection";

export default function Landing() {
  return (
    <div className="min-h-screen bg-white text-stone-950">
      <Navbar />
      <Hero />
      <PromoSection />
      <FeaturedProducts />
      <CategoriesSection />
      <Footer />
    </div>
  );
}
