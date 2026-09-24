"use client";

import { Printer, Share2 } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import type { Struk } from "@/lib/types";

function teks(r: Struk): string {
	return [
		"Dapur Ina Aina",
		`No. ${r.kode}`,
		`Kasir: ${r.kasir}`,
		r.nama_pelanggan ? `Pelanggan: ${r.nama_pelanggan}` : null,
		...r.items.map((i) => `${i.nama} x${i.jumlah} — ${formatRupiah(i.subtotal)}`),
		`Total: ${formatRupiah(r.total)}`,
		r.metode === "tunai"
			? `Tunai: ${formatRupiah(r.jumlah_bayar)} • Kembalian: ${formatRupiah(r.kembalian ?? 0)}`
			: `Non-tunai • Ref: ${r.nomor_referensi ?? "-"}`,
	]
		.filter(Boolean)
		.join("\n");
}

async function bagikan(r: Struk) {
	const text = teks(r);
	try {
		if (navigator.share) return await navigator.share({ title: `Struk ${r.kode}`, text });
		await navigator.clipboard.writeText(text);
		alert("Struk disalin ke clipboard.");
	} catch {
		/* dibatalkan pengguna */
	}
}

/** `besar` = varian desktop (h-14). Disembunyikan saat print. */
export function StrukActions({ struk, besar = false, labelBagikan = "Bagikan" }: { struk: Struk; besar?: boolean; labelBagikan?: string }) {
	const h = besar ? "h-14 text-[14px]/[17px]" : "h-[52px] flex-1 text-[13px]/[15px]";
	return (
		<div className={`flex w-full print:hidden ${besar ? "flex-col gap-3.5" : "gap-2.5"}`}>
			<button type="button" onClick={() => window.print()} className={`${h} flex items-center justify-center gap-2 rounded-[99px] bg-primary font-black text-white transition-opacity hover:opacity-90`}>
				<Printer aria-hidden className="size-[17px]" strokeWidth={2} />
				{besar ? "Cetak Struk" : "Cetak"}
			</button>
			<button type="button" onClick={() => void bagikan(struk)} className={`${h} flex items-center justify-center gap-2 rounded-[99px] border border-border bg-surface font-black text-primary transition-opacity hover:opacity-80`}>
				<Share2 aria-hidden className="size-[17px]" strokeWidth={2} />
				{labelBagikan}
			</button>
		</div>
	);
}
