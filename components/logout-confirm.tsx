import Link from "next/link";
import { LogOut, ReceiptText } from "lucide-react";
import { logout } from "@/lib/actions";
import { beranda } from "@/lib/auth";
import type { Peran } from "@/lib/types";

const foto = (id: string) => `https://images.unsplash.com/photo-${id}?w=1080&q=80&auto=format&fit=crop`;

const KONTEN = {
	kasir: {
		gambar: foto("1671780310422-ebdc4c7cd37d"),
		sesi: "Kasir session selesai",
		judul: "Keluar dari kasir?",
		teks: "Pastikan semua pesanan, pembayaran, dan struk terakhir sudah tersimpan sebelum keluar.",
	},
	administrator: {
		gambar: foto("1786788684912-eee0edc0b347"),
		sesi: "Admin session selesai",
		judul: "Keluar dari admin?",
		teks: "Pastikan perubahan produk, stok, dan laporan sudah tersimpan sebelum keluar.",
	},
} as const;

/** Layar konfirmasi logout (desain: "Keluar dari kasir/admin?"). */
export function LogoutConfirm({ peran }: { peran: Peran }) {
	const k = KONTEN[peran];
	return (
		<div className="flex flex-col gap-5 p-5 lg:min-h-[640px] lg:flex-row lg:items-center lg:justify-center lg:gap-16 lg:p-0">
			<div
				className="relative flex h-[260px] items-center justify-center overflow-hidden rounded-[30px] bg-cover bg-center lg:size-[420px] lg:shrink-0 lg:rounded-[36px]"
				style={{ backgroundImage: `url(${k.gambar})` }}
			>
				<div aria-hidden className="absolute inset-0 bg-black/55" />
				<div className="relative z-10 flex flex-col items-center gap-2 text-center text-white lg:items-start lg:px-10 lg:text-left">
					<p className="text-[36px]/[34px] font-black tracking-tight lg:text-[52px]/[52px]">
						Dapur Ina
						<br />
						Aina
					</p>
					<p className="text-[12px] font-extrabold tracking-[1.1px] text-white/80 lg:text-[14px] lg:tracking-normal">{k.sesi}</p>
				</div>
			</div>

			<section className="flex w-full flex-col items-center gap-3 rounded-[30px] border border-border bg-surface p-5 text-center shadow-[0px_14px_34px_0px_#17171718] lg:w-[520px] lg:gap-4 lg:p-8">
				{peran === "kasir" ? (
					<span className="flex items-center gap-2 rounded-[99px] border border-border bg-bg px-3.5 py-2 text-[12px] font-black text-primary">
						<ReceiptText aria-hidden className="size-4" strokeWidth={2} />
						Shift kasir aman
					</span>
				) : null}
				<h1 className="text-[26px]/[30px] font-black text-primary lg:text-[32px]/[38px]">{k.judul}</h1>
				<p className="max-w-[420px] text-[14px]/[18px] font-semibold text-muted">{k.teks}</p>
				<form action={logout} className="w-full">
					<button
						type="submit"
						className="flex h-[54px] w-full items-center justify-center gap-2 rounded-[99px] bg-primary text-[14px] font-black text-white transition-opacity hover:opacity-90 lg:h-[56px]"
					>
						<LogOut aria-hidden className="size-[18px]" strokeWidth={2} />
						Ya, Log Out
					</button>
				</form>
				<Link
					href={beranda(peran)}
					className="flex h-[54px] w-full items-center justify-center rounded-[99px] border border-border bg-bg text-[14px] font-black text-primary transition-opacity hover:opacity-80 lg:h-[56px]"
				>
					Batal
				</Link>
			</section>
		</div>
	);
}
