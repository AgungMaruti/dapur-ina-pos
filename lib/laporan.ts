import { WIB_MS, wib } from "./format";
import type { Trx } from "./types";

export type Periode = "minggu" | "bulan";

const HARI_MS = 86_400_000;
const HARI = ["S", "S", "R", "K", "J", "S", "M"]; // Senin → Minggu
const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

/** Semua perhitungan kalender dalam WIB (restoran di Indonesia), bukan zona server. */
const hariKe = (d: Date | string) => Math.floor(wib(d).getTime() / HARI_MS);
const mingguKe = (d: Date | string) => Math.floor((hariKe(d) + 3) / 7); // minggu mulai Senin
const bulanKe = (d: Date | string) => {
	const w = wib(d);
	return w.getUTCFullYear() * 12 + w.getUTCMonth();
};

/** Awal bulan (00:00 WIB) `mundur` bulan sebelum `now`, sebagai Date UTC nyata untuk query DB. */
export function awalBulan(now: Date, mundur: number): Date {
	const w = wib(now);
	return new Date(Date.UTC(w.getUTCFullYear(), w.getUTCMonth() - mundur, 1) - WIB_MS);
}

export const persenNaik = (sekarang: number, lalu: number): number | null =>
	lalu > 0 ? Math.round(((sekarang - lalu) / lalu) * 100) : null;

const jumlahkan = (list: Trx[]) => list.reduce((s, t) => s + t.total, 0);

/** Total penjualan on-demand dari transaksi lunas (PRD Modul G). Tanpa data → semua 0. */
export function agregasiLaporan(trx: Trx[], periode: Periode, now: Date = new Date()) {
	const kunci = periode === "minggu" ? mingguKe : bulanKe;
	const sekarang = kunci(now);
	const kini = trx.filter((t) => kunci(t.tanggal) === sekarang);
	const lalu = trx.filter((t) => kunci(t.tanggal) === sekarang - 1);
	const total = jumlahkan(kini);

	const bars: { label: string; total: number }[] =
		periode === "minggu"
			? HARI.map((label) => ({ label, total: 0 }))
			: Array.from({ length: 7 }, (_, i) => ({
					label: BULAN[(((bulanKe(now) - 6 + i) % 12) + 12) % 12],
					total: 0,
				}));
	for (const t of trx) {
		const i = periode === "minggu" ? hariKe(t.tanggal) - (sekarang * 7 - 3) : 6 - (sekarang - bulanKe(t.tanggal));
		if (i >= 0 && i < 7) bars[i].total += t.total;
	}

	const hariBerjalan = periode === "minggu" ? hariKe(now) - (sekarang * 7 - 3) + 1 : wib(now).getUTCDate();
	return {
		total,
		jumlah: kini.length,
		rataRata: Math.round(total / hariBerjalan),
		persen: persenNaik(total, jumlahkan(lalu)),
		bars,
		terbaru: kini,
	};
}

/** Ringkasan dashboard stok: hari ini vs kemarin + total bulan ini. */
export function ringkasHariIni(trx: Trx[], now: Date = new Date()) {
	const h = hariKe(now);
	const hariIni = trx.filter((t) => hariKe(t.tanggal) === h);
	const kemarin = trx.filter((t) => hariKe(t.tanggal) === h - 1);
	return {
		hari: { total: jumlahkan(hariIni), jumlah: hariIni.length },
		kemarin: { total: jumlahkan(kemarin), jumlah: kemarin.length },
		bulan: jumlahkan(trx.filter((t) => bulanKe(t.tanggal) === bulanKe(now))),
	};
}
