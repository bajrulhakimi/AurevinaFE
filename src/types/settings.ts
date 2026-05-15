export interface SiteSettings {
  store_name: string;
  phone_primary: string;
  phone_secondary: string;
  whatsapp: string;
  email: string;
  address: string;
  map_url: string;
  instagram_url: string;
  x_url: string;
  telegram_url: string;
  business_hours: string;
  about_headline: string;
  about_image_url: string;
  about_us: string;
  privacy_policy: string;
  terms_conditions: string;
  how_to_order_title: string;
  how_to_order_description: string;
  how_to_order_steps: string;
}

export const defaultSettings: SiteSettings = {
  store_name: "Aurevina",
  phone_primary: "+62 823 8730 1257",
  phone_secondary: "+62 858 1774 4916",
  whatsapp: "6281298765432",
  email: "info@aurevina.com",
  address: "Bogor, Indonesia",
  map_url: "https://www.google.com/maps/search/?api=1&query=Jakarta%2C%20Indonesia",
  instagram_url: "https://www.instagram.com/",
  x_url: "",
  telegram_url: "https://t.me/",
  business_hours: "Senin - Jumat: 09:00 - 18:00\nSabtu: 10:00 - 16:00\nMinggu: Libur",
  about_headline: "Hijab premium yang dibuat untuk keseharian yang anggun, nyaman, dan percaya diri.",
  about_image_url: "",
  about_us: "Koleksi hijab dan busana muslim premium dengan warna elegan, bahan nyaman, dan desain modern untuk keseharian.",
  privacy_policy: "Kebijakan Privasi\n\nKami menjaga data pelanggan hanya untuk kebutuhan layanan toko.",
  terms_conditions: "Syarat & Ketentuan\n\nDengan berbelanja di Aurevina, pelanggan menyetujui ketentuan toko.",
  how_to_order_title: "Cara Order di Aurevina",
  how_to_order_description: "Ikuti langkah berikut agar pesanan, pembayaran, dan pengiriman berjalan rapi dari website.",
  how_to_order_steps:
    "Pilih Produk|Buka halaman produk, pilih hijab atau busana yang kamu suka, lalu lihat detail warna, harga, stok, dan ulasan.\nMasukkan Keranjang|Di halaman detail produk, pilih varian warna dan jumlah. Setelah itu klik Tambah ke Keranjang.\nCheckout & Pilih Alamat|Login terlebih dahulu. Kamu bisa memakai alamat tersimpan atau membuat alamat pengiriman baru.\nBayar dan Upload Bukti|Pilih metode pembayaran, transfer sesuai total belanja, lalu upload bukti pembayaran di halaman checkout.\nPantau Pesanan|Setelah pembayaran dikirim, pesanan masuk ke admin. Status pesanan bisa dilihat di halaman Pesanan Saya.",
};
