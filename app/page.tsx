import { redirect } from "next/navigation";
import { beranda, getSesi } from "@/lib/auth";

export default async function Home() {
	const sesi = await getSesi();
	redirect(sesi ? beranda(sesi.peran) : "/login");
}
