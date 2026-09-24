import { getProduk } from "@/lib/data";
import { MenuView } from "./menu-view";

export default async function KasirMenuPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
	const { category } = await searchParams;
	return <MenuView produk={await getProduk()} slug={category === "appetizer" || category === "minuman" ? category : "makanan"} />;
}
