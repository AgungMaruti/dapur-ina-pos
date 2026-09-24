import { redirect } from "next/navigation";
import { beranda, getSesi } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
	const sesi = await getSesi();
	if (sesi) redirect(beranda(sesi.peran));
	return <LoginForm />;
}
