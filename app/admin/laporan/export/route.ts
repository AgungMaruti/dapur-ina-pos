import { getSesi } from "@/lib/auth";
import { getTransaksiLunas } from "@/lib/data";
import { formatWaktu, wib } from "@/lib/format";
import { agregasiLaporan, awalBulan, type Periode } from "@/lib/laporan";

// Cegah CSV/formula injection saat dibuka di Excel (nama pelanggan berasal dari input kasir).
const sel = (v: string | number) => {
	const s = String(v);
	return `"${(/^[=+\-@\t\r]/.test(s) ? `'${s}` : s).replaceAll('"', '""')}"`;
};

/** Rincian transaksi lunas periode berjalan sebagai CSV (dibuka langsung di Excel). Hanya admin. */
export async function GET(req: Request) {
	if ((await getSesi())?.peran !== "administrator") return new Response("Forbidden", { status: 403 });
	const periode: Periode = new URL(req.url).searchParams.get("periode") === "minggu" ? "minggu" : "bulan";
	const now = new Date();
	const trx = await getTransaksiLunas(awalBulan(now, 1).toISOString());
	const { terbaru, total } = agregasiLaporan(trx, periode, now);

	const baris = [
		["Waktu (WIB)", "Kode", "Pelanggan", "Total (Rp)"],
		...terbaru.map((t) => [formatWaktu(t.tanggal), `TRX-${t.id.slice(0, 8).toUpperCase()}`, t.nama ?? "Walk-in", t.total]),
		["", "", "TOTAL", total],
	];
	return new Response("﻿" + baris.map((r) => r.map(sel).join(",")).join("\r\n"), {
		headers: {
			"Content-Type": "text/csv; charset=utf-8",
			"Content-Disposition": `attachment; filename="laporan-${periode === "minggu" ? "mingguan" : "bulanan"}-${wib(now).toISOString().slice(0, 10)}.csv"`,
		},
	});
}
