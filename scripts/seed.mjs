// Seed awal: kategori, akun kasir + admin, bucket gambar, (opsional) menu contoh.
//   node --env-file=.env.local scripts/seed.mjs          → kategori + akun + bucket
//   node --env-file=.env.local scripts/seed.mjs --menu   → + 12 menu contoh (hanya jika tabel produk kosong)
// Aman dijalankan ulang. Butuh SUPABASE_SERVICE_ROLE_KEY (server-only).
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const db = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL,
	process.env.SUPABASE_SERVICE_ROLE_KEY,
	{ auth: { persistSession: false } },
);
const must = ({ error, data }, ctx) => {
	if (error) throw new Error(`${ctx}: ${error.message}`);
	return data;
};

const KATEGORI = ["Makanan Utama", "Appetizer", "Minuman"];
const AKUN = [
	{ email: "kasir@dapurina.test", nama: "Kasir Ina", peran: "kasir" },
	{ email: "admin@dapurina.test", nama: "Admin Ina", peran: "administrator" },
];
const img = (id) => `https://images.unsplash.com/photo-${id}?w=640&q=80&auto=format&fit=crop`;
const MENU = [
	["Nasi Ayam Sambal", "Makanan Utama", 18000, 12, "1704713925120-06d75e70a395"],
	["Mie Goreng Ina", "Makanan Utama", 16000, 4, "1654340211862-0a2db44a34dc"],
	["Nasi Goreng Kampung", "Makanan Utama", 17000, 15, "1645696329525-8ec3bee460a9"],
	["Ayam Geprek", "Makanan Utama", 19000, 9, "1701856626195-0d535ca8487c"],
	["Tahu Crispy", "Appetizer", 10000, 0, "1762305195963-735f8bf9cad1"],
	["Tempe Mendoan", "Appetizer", 9000, 5, "1571162437205-8889ff2fee26"],
	["Pisang Goreng", "Appetizer", 8000, 22, "1619683257375-2b3aea9a4333"],
	["Kentang Goreng", "Appetizer", 12000, 15, "1639744210631-209fce3e256c"],
	["Es Teh Manis", "Minuman", 5000, 31, "1591947474123-588ae58c071f"],
	["Es Jeruk", "Minuman", 7000, 28, "1650460069032-3c410224fe55"],
	["Kopi Susu", "Minuman", 10000, 16, "1533651131910-36d95c33b6c5"],
	["Air Mineral", "Minuman", 4000, 50, "1621314449762-542c8391ca06"],
];

// 1. kategori
const adaKat = must(await db.from("kategori").select("nama_kategori"), "kategori").map((k) => k.nama_kategori);
const kurang = KATEGORI.filter((n) => !adaKat.includes(n));
if (kurang.length) must(await db.from("kategori").insert(kurang.map((nama_kategori) => ({ nama_kategori }))), "insert kategori");
console.log(`kategori: +${kurang.length}`);

// 2. akun
const { data: list } = await db.auth.admin.listUsers({ perPage: 200 });
for (const a of AKUN) {
	let user = list.users.find((u) => u.email === a.email);
	let password = null;
	if (!user) {
		password = randomBytes(9).toString("base64url");
		user = must(
			await db.auth.admin.createUser({
				email: a.email,
				password,
				email_confirm: true,
				user_metadata: { nama: a.nama },
				app_metadata: { peran: a.peran },
			}),
			`createUser ${a.email}`,
		).user;
	} else {
		await db.auth.admin.updateUserById(user.id, { app_metadata: { peran: a.peran } });
	}
	// trigger handle_new_user membuat profil (default pelanggan) → naikkan ke peran sebenarnya
	const { data: prof } = await db.from("profil").select("id").eq("id", user.id).maybeSingle();
	if (prof) must(await db.from("profil").update({ peran: a.peran, nama: a.nama }).eq("id", user.id), "update profil");
	else must(await db.from("profil").insert({ id: user.id, nama: a.nama, peran: a.peran }), "insert profil");
	console.log(`akun ${a.peran}: ${a.email} ${password ? `password=${password}` : "(sudah ada, password tidak diubah)"}`);
}

// 3. bucket gambar produk (public read; upload hanya lewat server action)
const { error: bErr } = await db.storage.createBucket("produk", { public: true, fileSizeLimit: 1_000_000 });
console.log(bErr && !/already exists/i.test(bErr.message) ? `bucket: ${bErr.message}` : "bucket produk: ok");

// 4. menu contoh
if (process.argv.includes("--menu")) {
	const { count } = await db.from("produk").select("id", { count: "exact", head: true });
	if (count) console.log(`menu: dilewati (produk sudah berisi ${count} baris)`);
	else {
		const kat = Object.fromEntries(must(await db.from("kategori").select("id,nama_kategori"), "kategori").map((k) => [k.nama_kategori, k.id]));
		for (const [nama, k, harga, stok, foto] of MENU) {
			const p = must(await db.from("produk").insert({ nama_produk: nama, harga, id_kategori: kat[k] }).select("id").single(), `produk ${nama}`);
			must(await db.from("stok").insert({ id_produk: p.id, jumlah: stok, status: stok > 0 ? "tersedia" : "habis" }), `stok ${nama}`);
			try {
				const res = await fetch(img(foto));
				if (!res.ok) throw new Error(String(res.status));
				const up = await db.storage.from("produk").upload(`${p.id}.jpg`, await res.arrayBuffer(), { contentType: "image/jpeg", upsert: true });
				if (up.error) throw up.error;
			} catch (e) {
				console.log(`  gambar ${nama} dilewati: ${e.message}`);
			}
		}
		console.log(`menu: ${MENU.length} produk`);
	}
}
