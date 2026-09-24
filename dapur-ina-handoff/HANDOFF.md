# Dapur Ina Aina POS — Design Handoff

Source design: `dapur-ina-design.pen`  
HTML export: `dapur-ina-design.html`  
PNG screens: `screens/*.png`

## Stack target
- Next.js App Router + TypeScript
- Tailwind CSS
- Supabase-ready data model from PRD
- Responsive: mobile-first screens plus desktop web layouts

## Visual direction
Minimal neutral POS UI:
- Background: warm neutral `#F7F5F2`
- Surface: `#FFFFFF`
- Primary/action: `#171717`
- Border: `#E5E0DA`
- Muted text: `#73706C`
- Success: `#2F6F4E`
- Warning: `#8A6A2F`
- Font heading/body: Plus Jakarta Sans / Inter style, bold hierarchy, compact POS density

## Important implementation notes
- Kasir and Admin must be visually distinct.
- Mobile Kasir uses bottom navigation: `Menu`, `Pesanan`, `Bayar`, `Log Out`.
- Mobile Admin uses bottom navigation: `Stok`, `Produk`, `Laporan`, `Akun`.
- Desktop Kasir uses top horizontal navigation, not admin sidebar.
- Desktop Admin uses left sidebar.
- Login on mobile and desktop has role selector: `Kasir` / `Admin`.
- Menu screen should not go directly to payment. Flow is: Menu → Pesanan → Pembayaran → Struk.
- QR payment is demo-only; no real gateway.
- Product add form requires image, name, price, stock, category, status.

## Screen map

### Mobile Kasir flow
1. `Mobile 00 - Login` — file `screens/RxPbw.png`
2. `Mobile Kasir 01 - Menu Makanan` — file `screens/YqZs1.png`
3. `Mobile Kasir 02 - Menu Appetizer` — file `screens/YhDjV.png`
4. `Mobile Kasir 03 - Menu Minuman` — file `screens/yBF66.png`
5. `Mobile Kasir 04 - Pesanan Aktif` — file `screens/F9cmkf.png`
6. `Mobile Kasir 05 - Pembayaran Tunai` — file `screens/Zg9e8.png`
7. `Mobile Kasir 06 - Pembayaran QR` — file `screens/VZDDo.png`
8. `Mobile Kasir 07 - Struk Pembayaran` — file `screens/e0isV.png`
9. `Mobile Kasir 08 - Logout` — file `screens/vVAb8.png`

### Mobile Admin flow
1. `Mobile Admin 01 - Stok Dashboard` — file `screens/p2S1Da.png`
2. `Mobile Admin 02 - Produk & Kategori` — file `screens/Hm4rM.png`
3. `Mobile Admin 03 - Tambah Produk` — file `screens/pZClj.png`
4. `Mobile Admin 04 - Laporan Penjualan` — file `screens/Z1XH3.png`
5. `Mobile Admin 05 - Akun & Akses` — file `screens/BLFWx.png`
6. `Mobile Admin 06 - Logout` — file `screens/WgVtk.png`

### Desktop Kasir flow
1. `Desktop 00 - Login` — file `screens/lUddd.png`
2. `Desktop Kasir 01 - Menu` — file `screens/LlfSS.png`
3. `Desktop Kasir 02 - Pesanan Aktif` — file `screens/n9IiY.png`
4. `Desktop Kasir 03 - Pembayaran` — file `screens/V7FqF.png`
5. `Desktop Kasir 04 - Struk Pembayaran` — file `screens/Q5w62m.png`
6. `Desktop Kasir 05 - Logout` — file `screens/aTasO.png`

### Desktop Admin flow
1. `Desktop Admin 01 - Stok Dashboard` — file `screens/mOd5A.png`
2. `Desktop Admin 02 - Produk & Tambah Produk` — file `screens/KEkxv.png`
3. `Desktop Admin 03 - Laporan Penjualan` — file `screens/WjTF4.png`
4. `Desktop Admin 04 - Logout` — file `screens/rtVSf.png`

## Suggested routes

```txt
/login
/kasir/menu?category=makanan
/kasir/menu?category=appetizer
/kasir/menu?category=minuman
/kasir/pesanan
/kasir/pembayaran?method=tunai
/kasir/pembayaran?method=qr
/kasir/struk/[id]
/kasir/logout
/admin/stok
/admin/produk
/admin/produk/tambah
/admin/laporan
/admin/akun
/admin/logout
```

## Data assumptions from PRD
- Categories: `Makanan Utama`, `Appetizer`, `Minuman`
- Payment methods: `tunai`, `non_tunai`
- Payment status: paid/lunas after confirmation
- Customer is walk-in via `nama_pelanggan`, not an account
- Cash payment: input received cash, calculate change
- QR payment: demo manual confirmation only

## Developer prompt for Claude Code

Use this prompt:

```txt
Read docs/design/HANDOFF.md and inspect docs/design/screens plus docs/design/dapur-ina-design.html.
Implement the Dapur Ina Aina POS frontend following the exported design.

Requirements:
- Next.js App Router + TypeScript + Tailwind
- Responsive mobile and desktop layouts
- Same visual system as screenshots
- Implement Kasir flow: Login → Menu → Pesanan → Pembayaran Tunai/QR → Struk → Logout
- Implement Admin flow: Login → Stok → Produk → Tambah Produk → Laporan → Akun → Logout
- Use mock data first but structure for Supabase integration
- Keep role selector on login
- Do not make Kasir desktop use admin sidebar; use top navigation
- Keep mobile bottom nav consistent
```
