import Link from "next/link";
import { Pencil, Plus, Search, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ProdukForm } from "@/components/produk-form";
import { getKategori, getProduk } from "@/lib/data";
import { formatRupiah } from "@/lib/format";

export default async function AdminProdukPage({ searchParams }: { searchParams: Promise<{ q?: string; edit?: string }> }) {
	const { q = "", edit } = await searchParams;
	const [semua, kategori] = await Promise.all([getProduk(), getKategori()]);
	const needle = q.trim().toLowerCase();
	const daftar = needle ? semua.filter((p) => p.nama_produk.toLowerCase().includes(needle)) : semua;
	const diedit = semua.find((p) => p.id === edit);

	return (
		<main className="flex w-full flex-col gap-3.5 px-4 pb-6 pt-5 lg:gap-5 lg:px-0 lg:pt-10">
			<PageHeader
				judul="Admin Produk"
				subjudul="CRUD menu dan kategori"
				judulDesktop="Produk & Kategori"
				subjudulDesktop="CRUD menu, kategori, harga, dan status produk."
				Icon={ShieldCheck}
				gelap
				aksi={
					<Link href="/admin/produk" className="flex h-[52px] items-center gap-2 rounded-[99px] border border-primary bg-surface px-6 text-[14px] font-black text-primary transition-opacity hover:opacity-80">
						<Plus aria-hidden className="size-[18px]" strokeWidth={2} />
						Buka Form Tambah
					</Link>
				}
			/>

			{/* Pencarian + tambah (mobile) */}
			<div className="flex h-[52px] w-full items-center gap-2.5 lg:hidden">
				<form action="/admin/produk" className="flex h-full min-w-0 flex-1 items-center gap-2 rounded-[18px] border border-border bg-surface px-3">
					<Search aria-hidden className="size-5 shrink-0 text-muted" strokeWidth={2} />
					<input type="search" name="q" defaultValue={q} placeholder="Cari produk" aria-label="Cari produk" className="min-w-0 flex-1 bg-transparent text-[13px]/[15px] font-semibold text-primary outline-none placeholder:text-muted" />
				</form>
				<Link href="/admin/produk/tambah" aria-label="Tambah produk" className="flex size-[52px] shrink-0 items-center justify-center rounded-[18px] bg-primary text-white transition-opacity hover:opacity-85">
					<Plus aria-hidden className="size-5" strokeWidth={2.5} />
				</Link>
			</div>

			{/* Ringkasan kategori (mobile) */}
			<div className="flex w-full items-start gap-2.5 lg:hidden">
				{kategori.map((k) => (
					<div key={k.id} className="flex min-w-0 flex-1 flex-col gap-[5px] rounded-[20px] border border-border bg-surface p-3">
						<p className="font-heading text-[22px]/[26px] font-black text-primary">{semua.filter((p) => p.id_kategori === k.id).length}</p>
						<p className="truncate text-[10px]/[12px] font-bold text-muted">{k.nama_kategori}</p>
					</div>
				))}
			</div>

			<div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-5">
				<section className="flex min-w-0 flex-1 flex-col gap-2 lg:gap-3 lg:rounded-[30px] lg:border lg:border-border lg:bg-surface lg:p-[18px]">
					<div className="hidden items-center justify-between px-1 pb-1 lg:flex">
						<h2 className="text-[18px] font-black text-primary">Daftar produk</h2>
						<span className="text-[13px] font-bold text-muted">{daftar.length} item</span>
					</div>
					{daftar.length === 0 ? (
						<p className="rounded-[20px] border border-border bg-surface px-4 py-10 text-center text-[13px] font-bold text-muted lg:border-0">
							{q ? `Tidak ada produk untuk “${q}”` : "Belum ada produk"}
						</p>
					) : (
						daftar.map((p) => (
							<div key={p.id} className={`flex min-h-[66px] w-full shrink-0 items-center gap-2.5 rounded-[20px] border p-3 lg:rounded-[22px] lg:border-0 lg:bg-bg lg:px-4 ${p.id === edit ? "border-primary bg-surface" : "border-border bg-surface"}`}>
								<div className="flex min-w-0 flex-1 flex-col gap-[3px]">
									<p className="truncate text-[13px]/[15px] font-black text-primary lg:text-[15px]">{p.nama_produk}</p>
									<p className="truncate text-[11px]/[13px] font-semibold text-muted">
										{p.kategori} • {formatRupiah(p.harga)}
									</p>
								</div>
								<span className="hidden h-9 min-w-[60px] items-center justify-center rounded-[99px] border border-border bg-surface text-[12px] font-black tabular-nums text-primary xl:flex">{p.jumlah}</span>
								<span className={`hidden h-9 w-[84px] items-center justify-center rounded-[99px] text-[11px] font-black text-white xl:flex ${p.jumlah > 0 ? "bg-success" : "bg-primary"}`}>{p.jumlah > 0 ? "Aktif" : "Habis"}</span>
								<Link href={`/admin/produk/tambah?id=${p.id}`} aria-label={`Ubah ${p.nama_produk}`} className="flex size-9 shrink-0 items-center justify-center rounded-[14px] bg-bg text-primary transition-opacity hover:opacity-80 lg:hidden">
									<Pencil aria-hidden className="size-5" strokeWidth={2} />
								</Link>
								<Link href={`/admin/produk?edit=${p.id}`} aria-label={`Ubah ${p.nama_produk}`} className="hidden size-9 shrink-0 items-center justify-center rounded-[14px] border border-border bg-surface text-primary transition-opacity hover:opacity-80 lg:flex">
									<Pencil aria-hidden className="size-[18px]" strokeWidth={2} />
								</Link>
							</div>
						))
					)}
				</section>

				{/* Panel form (desktop) */}
				<aside className="hidden w-[340px] shrink-0 xl:w-[420px] rounded-[30px] border border-border bg-surface p-[22px] lg:block">
					<ProdukForm key={diedit?.id ?? "baru"} kategori={kategori} produk={diedit} panel selesai="/admin/produk" />
				</aside>
			</div>
		</main>
	);
}
