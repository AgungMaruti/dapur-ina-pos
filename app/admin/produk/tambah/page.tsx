import { PackagePlus } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ProdukForm } from "@/components/produk-form";
import { getKategori, getProduk } from "@/lib/data";

export default async function AdminTambahProdukPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
	const { id } = await searchParams;
	const [kategori, semua] = await Promise.all([getKategori(), getProduk()]);
	const produk = semua.find((p) => p.id === id);

	return (
		<main className="flex w-full flex-col gap-3.5 px-4 pb-6 pt-5 lg:mx-auto lg:max-w-[560px] lg:px-0 lg:pt-10">
			<PageHeader judul={produk ? "Ubah Produk" : "Tambah Produk"} subjudul="Gambar, harga, stok, kategori" Icon={PackagePlus} gelap />
			<ProdukForm key={produk?.id ?? "baru"} kategori={kategori} produk={produk} selesai="/admin/produk" />
		</main>
	);
}
