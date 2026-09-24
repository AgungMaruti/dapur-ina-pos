# Product Requirements Document (PRD) — Sistem Website POS "Dapur Ina Aina"

> **Tujuan dokumen:** sumber acuan tunggal (source of truth) untuk **agent membangun** sistem, bukan dokumen submission.
> **Lingkup:** seluruh sistem end-to-end (analisa s/d pengujian), fokus **kebutuhan fungsional & teknis**.
> **Di luar lingkup:** design UI/UX visual (mockup, layout, warna, komponen) — dibuat pada dokumen terpisah.

**Meta**
- Proyek: Restoran Dapur Ina Aina
- Stack: Next.js (App Router, TypeScript) + Supabase (PostgreSQL + Supabase Auth)
- Metode: Waterfall

> **STATUS IMPLEMENTASI SAAT INI**
> Skema database **sudah diimplementasi dan berhasil dijalankan di Supabase** (9 tabel + enum + trigger auth). Agent **tidak perlu membuat ulang skema** — cukup terhubung ke database yang ada. Yang belum: aktivasi RLS (bertahap) dan seluruh kode aplikasi (Fase 0–7).

---

## 1. Executive Summary

**Problem Statement**
Restoran Dapur Ina Aina masih mencatat pemesanan, transaksi penjualan, stok, dan laporan secara manual, sehingga rawan salah hitung, stok tidak terpantau real-time, dan laporan penjualan lambat disusun.

**Proposed Solution**
Sistem website POS terkomputerisasi berbasis Next.js + Supabase yang menangani pemesanan, transaksi penjualan, manajemen stok, pembayaran (tunai/non tunai), dan laporan penjualan berkala dalam satu alur terintegrasi.

**Success Criteria (akademik + terukur)**
- Seluruh 4 fungsi inti berjalan sesuai skenario tugas: pemesanan, transaksi penjualan, informasi stok, laporan penjualan berkala.
- Alur pesanan → billing → pembayaran → struk selesai tanpa error pada uji coba.
- Stok berkurang otomatis 100% akurat setiap pesanan dikonfirmasi, dan tidak pernah bernilai negatif.
- Pembayaran tunai menghitung kembalian dengan benar; pembayaran non tunai menyimpan nomor referensi.
- Laporan mingguan & bulanan menampilkan total yang cocok dengan penjumlahan manual data transaksi lunas.
- Unit test lolos untuk fungsi kritis (hitung total, hitung kembalian, kurang stok, agregasi laporan) dengan target **≥ 80% pass** pada modul inti.

---

## 2. Ruang Lingkup & Fungsionalitas

### 2.1 Aktor

| Aktor | Deskripsi | Akses |
|---|---|---|
| **Kasir** | Input pesanan (+ nama pelanggan), proses transaksi, pembayaran, cetak struk | Login |
| **Administrator** | Kelola produk, kategori, stok; lihat laporan penjualan | Login, hak penuh |
| **Pelanggan** | Konseptual — tidak punya akun login; identitasnya dicatat kasir via field `nama_pelanggan` | Tanpa login |

### 2.2 User Stories & Acceptance Criteria (per modul)

| Modul | User Story | Acceptance Criteria (definisi "selesai") |
|---|---|---|
| **A. Autentikasi & Peran** | Sebagai pengguna, saya ingin login agar akses sesuai peran. | Login via Supabase Auth. Setelah login, Kasir diarahkan ke `/kasir/*` dan Administrator ke `/admin/*` — **dua route group & dua navigation shell yang terpisah total**, bukan satu shell bersama. Navigasi Kasir HANYA berisi: Menu, Pesanan, Bayar (**tidak ada** item/tab Admin dalam bentuk apa pun). Navigasi Admin HANYA berisi: Produk, Stok, Laporan (**tidak ada** item transaksi Kasir). Proteksi wajib dua lapis: (1) UI — item nav peran lain tidak dirender sama sekali (bukan disembunyikan via CSS/disabled); (2) Server — middleware/server action menolak (redirect/403) akses ke `/admin/*` dari sesi berperan Kasir dan sebaliknya, termasuk saat URL diketik langsung. |
| **B. Produk & Kategori (Admin)** | Sebagai admin, saya ingin CRUD produk & kategori agar menu selalu update. | Tambah/ubah/hapus produk; setiap produk wajib 1 kategori (3 kategori tetap); harga ≥ 0. |
| **C. Stok (Admin)** | Sebagai admin, saya ingin kelola stok agar ketersediaan akurat. | Set jumlah stok; status otomatis tersedia/habis; jumlah tidak boleh negatif. |
| **D. Pemesanan (Kasir)** | Sebagai kasir, saya ingin membuat pesanan atas nama pelanggan agar tercatat. | Pilih produk + jumlah; isi nama pelanggan (opsional); produk habis tidak bisa dipesan; subtotal & total dihitung otomatis; pesanan tersimpan status `menunggu`. |
| **E. Transaksi & Billing (Kasir)** | Sebagai kasir, saya ingin memproses pesanan jadi transaksi + billing agar tagihan jelas. | 1 pesanan → 1 transaksi; total tagihan = jumlah subtotal detail; stok berkurang otomatis saat pesanan dikonfirmasi. |
| **F. Pembayaran (Kasir)** | Sebagai kasir, saya ingin memproses pembayaran tunai/non tunai agar transaksi lunas. | Tunai: input uang diterima, hitung kembalian. Non Tunai: input nomor referensi (dari EDC eksternal, manual). Status jadi `lunas`; struk dicetak. |
| **G. Laporan (Admin)** | Sebagai admin, saya ingin laporan penjualan berkala agar tahu performa. | Pilih periode mingguan/bulanan; sistem hitung **on-demand** dari transaksi lunas; tampilkan total penjualan & rincian. |

### 2.3 Non-Goals (di luar lingkup)
- Design UI/UX visual (mockup, layout, warna, komponen) — dibuat pada dokumen terpisah.
- Integrasi payment gateway online — Non Tunai hanya mencatat nomor referensi manual dari mesin EDC eksternal.
- Akun login untuk pelanggan (pelanggan tidak mendaftar/login sendiri).
- Manajemen multi-cabang / multi-outlet.
- Fitur reservasi meja, loyalty/poin, dan diskon otomatis.

---

## 3. AI System Requirements

**Tidak berlaku (N/A).** Sistem POS ini bersifat rule-based dan tidak menggunakan komponen AI/ML.

---

## 4. Technical Specifications

### 4.1 Architecture Overview
- Frontend + Backend: **Next.js (App Router)** — UI dan API/server action dalam satu proyek.
- Bahasa: **TypeScript**; Runtime: **Node.js LTS**.
- Database: **PostgreSQL** (dijalankan di **Supabase**).
- Autentikasi: **Supabase Auth** (session/JWT).
- Alur data: Browser (kasir/admin) → Next.js (halaman + API/server action) → Supabase client → PostgreSQL.
- **Struktur route (WAJIB terpisah per peran):** `/kasir/*` (layout + nav khusus Kasir: Menu, Pesanan, Bayar) dan `/admin/*` (layout + nav khusus Admin: Produk, Stok, Laporan). Tidak boleh ada satu shared layout/bottom-nav yang menampilkan tab kedua peran sekaligus. Lihat AC Modul A untuk detail proteksi.

### 4.2 Integration Points — Database (SUDAH diimplementasi di Supabase)

Skema berikut **sudah dibuat dan berjalan di Supabase**. Agent cukup memakainya.

**9 tabel:** `profil`, `kategori`, `produk`, `stok`, `pesanan`, `detail_pesanan`, `transaksi`, `pembayaran`, `laporan`.

**Enum types:** `peran_enum`, `status_pesanan_enum`, `status_stok_enum`, `metode_bayar_enum`, `status_bayar_enum`.

**Auth:** Supabase Auth (`auth.users`) terhubung ke tabel `profil` lewat trigger otomatis `handle_new_user` (default peran `pelanggan`).

**Catatan skema penting untuk build:**
- `pesanan.id_pengguna` (uuid, FK → `profil(id)`) = **id akun Kasir** yang menginput pesanan (untuk audit), **bukan** pelanggan.
- `pesanan.nama_pelanggan` (varchar(100), nullable) = **nama pelanggan walk-in** yang diketik kasir, dipakai untuk label struk.
- `transaksi.id_kasir` (uuid, FK → `profil(id)`) = kasir pemroses; `transaksi.id_pesanan` unique (1:1).
- `pembayaran` punya CHECK: `tunai` → `kembalian` wajib & `nomor_referensi` null; `non_tunai` → `nomor_referensi` wajib & `kembalian` null.
- `kategori.nama_kategori` dibatasi 3 nilai: `Makanan Utama`, `Appetizer`, `Minuman` (seed sudah dimasukkan).
- Semua primary key `uuid` (`gen_random_uuid()`), kecuali `profil.id` yang mereferensikan `auth.users(id)`.

### 4.3 Security & Privacy
- Akses berbasis peran: Kasir vs Administrator.
- **Row Level Security (RLS)** di Supabase — **belum diaktifkan**, akan diaktifkan bertahap setelah tabel inti stabil (policy per peran diuji dulu).
- Password dikelola & di-hash penuh oleh Supabase Auth (tidak disimpan di tabel aplikasi).
- Endpoint API / server action divalidasi sesuai peran pengguna.

### 4.4 Deployment (TBD)
- Development & demo: **localhost** (`npm run dev`).
- Target produksi: **belum ditentukan** — kandidat **Vercel** (frontend/API) + Supabase cloud (sudah dipakai). Ditandai TBD; sistem dirancang **Vercel-ready** (env var terpisah, hindari path lokal).

---

## 5. Risks & Roadmap

### 5.1 Phased Rollout (urutan build)

| Fase | Modul | Output |
|---|---|---|
| **Fase 0** | Setup | Init Next.js, koneksi Supabase, uji koneksi berhasil. |
| **Fase 1** | Auth & Peran | Login berfungsi, proteksi halaman per peran. |
| **Fase 2** | Produk, Kategori, Stok (Admin) | CRUD produk/kategori + kelola stok. |
| **Fase 3** | Pemesanan (Kasir) | Buat pesanan + nama pelanggan, validasi stok. |
| **Fase 4** | Transaksi & Billing | Konfirmasi pesanan, kurang stok, hitung total tagihan. |
| **Fase 5** | Pembayaran | Tunai (kembalian) & Non Tunai (referensi), cetak struk. |
| **Fase 6** | Laporan | Laporan on-demand mingguan/bulanan. |
| **Fase 7** | Unit Testing & Dokumentasi | Test fungsi kritis + dokumentasi hasil uji. |

### 5.2 Technical Risks

| Risiko | Mitigasi |
|---|---|
| Race condition stok saat 2 pesanan masuk bersamaan | Gunakan database transaction / update atomik saat mengurangi stok. |
| Total tagihan tidak konsisten dengan detail pesanan | Hitung total di sisi server dari data detail, bukan input manual. |
| Pembayaran salah isi (kembalian vs referensi tertukar) | Sudah dijaga CHECK constraint di tabel `pembayaran`. |
| Salah konfigurasi RLS membuat data tidak terbaca | Aktifkan RLS bertahap; uji tiap policy per peran sebelum lanjut. |
| Deployment belum final (TBD) | Rancang Vercel-ready sejak awal; simpan env var terpisah; hindari path lokal. |
| Kasir & Admin memakai satu shared navigation shell (nav Admin ikut muncul di sesi Kasir) | **Sudah terjadi di implementasi awal.** Wajib dipisah jadi `/kasir/*` dan `/admin/*` dengan layout & nav masing-masing + guard server-side (lihat AC Modul A & 4.1). |

---

## 6. Strategi Unit Testing

Tools: **Jest** (opsional React Testing Library untuk komponen). Setiap fungsi diuji dengan kasus normal + kasus batas.

| Fungsi | Kasus Normal | Kasus Batas (harus ditolak/ditangani) |
|---|---|---|
| `hitungTotal(detail)` | Total = jumlah semua subtotal | Detail kosong → total 0 |
| `hitungKembalian(uang, total)` | Kembalian = uang − total | Uang < total → ditolak |
| `kurangiStok(produk, jumlah)` | Stok berkurang sesuai jumlah | Jumlah > stok → ditolak; stok tidak negatif |
| `agregasiLaporan(transaksi, periode)` | Total sesuai penjumlahan transaksi lunas | Tidak ada transaksi → total 0 |

Target: fungsi inti bisnis lolos **≥ 80%**. Dokumentasi pengujian disusun sebagai tabel test case (input, expected, hasil, status) untuk lampiran Sesi 4.

---

## 7. Ringkasan
- PRD ini menjadi source of truth untuk agent membangun sistem POS Dapur Ina Aina end-to-end.
- Fokus kebutuhan fungsional & teknis; design UI/UX dibuat terpisah.
- **Database sudah live di Supabase** — build langsung konsumsi skema yang ada.
- KPI akademik namun terukur, siap diverifikasi saat demo/sidang.
- Roadmap 8 fase (Fase 0–7) menjadi urutan implementasi tahap coding.
- **Kasir dan Admin WAJIB punya route group, layout, dan navigation shell yang terpisah total** (`/kasir/*` vs `/admin/*`), dijaga di UI maupun server — lihat AC Modul A.

---

## 8. Catatan Revisi

| Tanggal | Perubahan | Alasan |
|---|---|---|
| 2026-09-23 | AC Modul A diperjelas: navigasi Kasir & Admin wajib route group + layout terpisah total, bukan satu shell bersama. Ditambahkan ke 4.1 (struktur route) dan 5.2 (risiko). | Implementasi awal ternyata menyatukan bottom-nav Kasir & Admin dalam satu shell (tab "Admin" tetap muncul di sesi Kasir) — melanggar maksud AC awal yang masih terlalu umum ("tidak bisa akses halaman lain"). Diperjelas agar tidak ambigu lagi untuk sisa build. |
| 2026-09-25 | Koreksi terhadap DB Supabase yang **live** (dibaca langsung via API): (1) tabel kosong — kategori TIDAK ter-seed, belum ada akun auth → dibuat lewat `npm run seed`; (2) **RLS sudah nyala tanpa policy** (bukan "belum diaktifkan") → seluruh akses data lewat server (service role) setelah peran diverifikasi, browser tidak menyentuh DB; (3) skema beda dari catatan awal: `produk` tanpa gambar/status (status = turunan `stok.status`, gambar di Storage bucket `produk/<id>.jpg`), `transaksi.total_tagihan`, `pembayaran.jumlah_bayar` + `status` (lunas/gagal), `pesanan.status` (menunggu/diproses/lunas/batal) + `tanggal`, `detail_pesanan` tanpa `harga_satuan`, peran DB `administrator`; (4) tidak ada mock data — build langsung terhubung Supabase. | PRD awal tidak cocok dengan database sebenarnya; agent lama membangun di atas skema tebakan + data mock. |
