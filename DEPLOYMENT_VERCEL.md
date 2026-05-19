# Deploy Frontend Aurevina ke Vercel

## Repository

Gunakan repository frontend:

```text
https://github.com/bajrulhakimi/AurevinaFE
```

## Setting Project Vercel

- Framework Preset: `Vite`
- Root Directory: biarkan kosong jika repo hanya berisi frontend
- Build Command:

```bash
npm run build
```

- Output Directory:

```text
dist
```

## Environment Variables

Isi di Vercel melalui menu Project Settings -> Environment Variables:

```env
VITE_API_BASE_URL=https://api-domain-anda.com/api/v1
```

Ganti `https://api-domain-anda.com` dengan domain/subdomain backend di DomaiNesia.

Contoh:

```env
VITE_API_BASE_URL=https://api.aurevina.com/api/v1
```

## Catatan Penting

File `vercel.json` sudah disiapkan agar semua route React diarahkan ke `index.html`.
Ini mencegah error 404 ketika halaman seperti `/products/1`, `/blog`, atau `/profile` di-refresh.

Setelah backend DomaiNesia aktif, redeploy frontend di Vercel agar `VITE_API_BASE_URL` ikut terbaca saat build.
