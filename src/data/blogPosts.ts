export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  date: string;
  image: string;
  category: string;
  readTime: string;
  sections: Array<{
    heading: string;
    body: string;
  }>;
}

export const blogPosts: BlogPost[] = [
  {
    id: 1,
    title: "Tips Memilih Hijab yang Tepat untuk Bentuk Wajah Anda",
    slug: "tips-memilih-hijab",
    excerpt: "Pelajari cara memilih hijab yang paling cocok sesuai dengan bentuk wajah Anda untuk tampil maksimal.",
    content: "Memilih hijab yang tepat bukan hanya tentang gaya, tetapi juga kenyamanan dan rasa percaya diri sepanjang hari.",
    author: "Sarah Aurevina",
    date: "2026-05-10",
    image: "✨",
    category: "Tips & Trik",
    readTime: "5 menit",
    sections: [
      {
        heading: "Kenali bentuk wajah terlebih dahulu",
        body: "Setiap bentuk wajah memiliki karakter yang berbeda. Wajah bulat biasanya cocok dengan hijab yang memberi ilusi memanjang, sementara wajah oval lebih fleksibel dengan banyak gaya. Untuk wajah kotak, pilih bahan yang jatuh lembut agar garis wajah terlihat lebih halus.",
      },
      {
        heading: "Pilih bahan yang mendukung gaya",
        body: "Bahan voal memberi hasil yang rapi dan ringan untuk aktivitas harian. Jersey cocok untuk tampilan praktis, sedangkan pashmina viscose atau tencel memberi kesan flowy dan elegan untuk acara yang lebih formal.",
      },
      {
        heading: "Perhatikan warna dan outfit",
        body: "Warna netral seperti cream, mocca, black, dan navy mudah dipadukan. Jika outfit sudah ramai, pilih hijab polos. Jika outfit sederhana, hijab dengan warna statement bisa menjadi fokus tampilan.",
      },
    ],
  },
  {
    id: 2,
    title: "Tren Warna Hijab 2026 yang Sedang Viral",
    slug: "tren-warna-hijab-2026",
    excerpt: "Warna lembut, earthy, dan clean look masih jadi favorit untuk tampilan modest yang modern.",
    content: "Tren warna hijab 2026 bergerak ke arah warna yang lembut namun tetap berkarakter.",
    author: "Fira Designs",
    date: "2026-05-08",
    image: "🎨",
    category: "Tren Fashion",
    readTime: "4 menit",
    sections: [
      {
        heading: "Earth tone tetap kuat",
        body: "Mocca, taupe, olive, dan sand masih menjadi warna yang paling mudah masuk ke berbagai outfit. Warna ini memberi kesan calm, dewasa, dan premium tanpa terlihat berlebihan.",
      },
      {
        heading: "Pastel yang lebih matang",
        body: "Dusty pink, powder blue, dan lavender lembut mulai banyak dipakai karena memberi sentuhan feminin yang tetap elegan. Pilih pastel yang sedikit muted agar lebih mudah dipadukan.",
      },
      {
        heading: "Navy dan black untuk daily hero",
        body: "Navy dan black tetap menjadi warna penyelamat untuk tampilan cepat. Dua warna ini cocok untuk kerja, kuliah, maupun acara semi formal.",
      },
    ],
  },
  {
    id: 3,
    title: "Cara Merawat Hijab Agar Tahan Lama dan Tetap Indah",
    slug: "cara-merawat-hijab",
    excerpt: "Panduan lengkap untuk merawat hijab agar warna, bentuk, dan teksturnya tetap cantik.",
    content: "Hijab yang dirawat dengan benar akan lebih awet, tidak mudah kusut, dan tetap nyaman dipakai.",
    author: "Dina Beauty",
    date: "2026-05-05",
    image: "💎",
    category: "Tips & Trik",
    readTime: "6 menit",
    sections: [
      {
        heading: "Cuci dengan lembut",
        body: "Gunakan deterjen lembut dan hindari mengucek terlalu keras. Untuk bahan yang ringan seperti voal atau viscose, cuci manual lebih disarankan agar serat kain tetap terjaga.",
      },
      {
        heading: "Jemur tanpa matahari langsung",
        body: "Sinar matahari terlalu kuat bisa membuat warna cepat pudar. Jemur hijab di tempat teduh dengan sirkulasi udara baik agar tetap segar dan warnanya awet.",
      },
      {
        heading: "Simpan sesuai bahan",
        body: "Hijab yang mudah kusut sebaiknya digantung atau dilipat rapi. Pisahkan warna gelap dan terang untuk menjaga tampilan koleksi tetap bersih.",
      },
    ],
  },
  {
    id: 4,
    title: "Kombinasi Hijab dan Outfit untuk Acara Formal",
    slug: "kombinasi-hijab-formal",
    excerpt: "Panduan styling hijab untuk acara formal agar tampil anggun, rapi, dan percaya diri.",
    content: "Acara formal membutuhkan kombinasi hijab dan outfit yang terasa rapi namun tetap nyaman.",
    author: "Emma Style",
    date: "2026-05-01",
    image: "👑",
    category: "Style Guide",
    readTime: "5 menit",
    sections: [
      {
        heading: "Pilih siluet yang clean",
        body: "Untuk formal look, pilih hijab dengan styling yang minim jarum dan tidak terlalu banyak layer. Siluet clean membuat wajah terlihat lebih segar dan outfit lebih mahal.",
      },
      {
        heading: "Samakan tone warna",
        body: "Gunakan warna hijab yang masih satu tone dengan outfit. Misalnya dress champagne cocok dengan hijab cream atau taupe, sementara outfit navy cocok dengan hijab silver grey.",
      },
      {
        heading: "Tambahkan detail seperlunya",
        body: "Bros kecil, inner rapi, atau pin sederhana cukup untuk memberi aksen. Hindari detail berlebihan jika outfit sudah memiliki motif atau embellishment.",
      },
    ],
  },
  {
    id: 5,
    title: "Busana Muslim Modern: Menggabungkan Tradisi dan Kontemporer",
    slug: "busana-muslim-modern",
    excerpt: "Cara memadukan nilai modest wear dengan gaya kontemporer yang tetap nyaman dipakai.",
    content: "Busana muslim modern memberi ruang untuk tampil sopan, ekspresif, dan praktis.",
    author: "Lia Fashion",
    date: "2026-04-28",
    image: "🌟",
    category: "Fashion",
    readTime: "4 menit",
    sections: [
      {
        heading: "Utamakan kenyamanan",
        body: "Modest fashion yang baik dimulai dari bahan yang nyaman. Pilih bahan yang tidak menerawang, tidak terlalu panas, dan mudah bergerak mengikuti aktivitas.",
      },
      {
        heading: "Mainkan layering",
        body: "Outer ringan, tunic, dan rok atau celana wide leg bisa menjadi kombinasi modern yang tetap sopan. Pastikan proporsinya seimbang agar tampilan tidak berat.",
      },
      {
        heading: "Gunakan aksesori minimal",
        body: "Tas structured, sepatu clean, dan hijab polos bisa membuat tampilan terlihat modern tanpa kehilangan kesan anggun.",
      },
    ],
  },
  {
    id: 6,
    title: "Bahan Hijab Terbaik untuk Iklim Tropis",
    slug: "bahan-hijab-tropis",
    excerpt: "Rekomendasi bahan hijab yang adem dan cocok untuk cuaca Indonesia.",
    content: "Cuaca tropis membutuhkan hijab yang ringan, menyerap, dan tidak mudah membuat gerah.",
    author: "Maya Material",
    date: "2026-04-25",
    image: "🌴",
    category: "Tips & Trik",
    readTime: "5 menit",
    sections: [
      {
        heading: "Voal untuk harian",
        body: "Voal populer karena ringan, mudah dibentuk, dan cukup breathable. Bahan ini cocok untuk kegiatan panjang dari pagi sampai sore.",
      },
      {
        heading: "Jersey untuk praktis",
        body: "Jersey terasa lembut dan elastis, cocok untuk pengguna yang ingin hijab instan atau styling cepat. Pilih jersey yang tidak terlalu tebal agar tetap adem.",
      },
      {
        heading: "Tencel dan viscose untuk flowy look",
        body: "Bahan ini jatuh cantik dan memberi kesan elegan. Cocok untuk pashmina dengan gaya effortless, terutama jika ingin tampilan yang lebih feminin.",
      },
    ],
  },
];
