"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";
import { login } from "@/lib/actions";
import type { Peran } from "@/lib/types";

const foto = (id: string) => `https://images.unsplash.com/photo-${id}?w=1080&q=80&auto=format&fit=crop`;

const roleBtn = "flex flex-1 items-center justify-center rounded-[99px] text-[12px] font-black transition-colors lg:rounded-[15px] lg:text-[14px]";
const field =
	"flex h-[54px] shrink-0 items-center gap-2.5 rounded-[18px] bg-bg px-3.5 outline outline-border -outline-offset-px lg:h-[58px] lg:gap-3 lg:px-4";
const input =
	"min-w-0 flex-1 bg-transparent text-[14px]/[17px] font-semibold text-primary outline-none placeholder:text-muted lg:text-[15px]/[18px] lg:font-bold";

export function LoginForm() {
	const [error, kirim, proses] = useActionState(login, null);
	const [peran, setPeran] = useState<Peran>("kasir");
	const [lihat, setLihat] = useState(false);
	const [email, setEmail] = useState(""); // controlled: React 19 mereset field uncontrolled setelah action

	return (
		<main className="mx-auto min-h-dvh max-w-[600px] bg-bg lg:grid lg:max-w-none lg:grid-cols-[720px_1fr]">
			{/* Hero */}
			<div className="relative m-5 flex h-[300px] flex-col items-center justify-center gap-2.5 overflow-hidden rounded-[30px] outline outline-border -outline-offset-px lg:m-0 lg:h-full lg:gap-0 lg:rounded-none lg:p-12">
				<div
					aria-hidden
					className="absolute inset-0 bg-cover bg-center lg:hidden"
					style={{ backgroundImage: `url(${foto("1740953846896-b3acd846fa61")})` }}
				/>
				<div
					aria-hidden
					className="absolute inset-0 hidden bg-cover bg-center lg:block"
					style={{ backgroundImage: `url(${foto("1635831233800-abaae2910c39")})` }}
				/>
				<div aria-hidden className="absolute inset-0 bg-[#00000066]" />
				<p className="relative z-10 w-[260px] text-center font-heading text-[36px]/[33px] font-black tracking-[-1.4px] text-white [filter:drop-shadow(0px_2px_6px_#00000055)] lg:w-[360px] lg:text-left lg:font-body lg:text-[64px]/[76px] lg:tracking-normal lg:[filter:none]">
					Dapur Ina
					<br />
					Aina
				</p>
				<p className="relative z-10 text-[12px] font-extrabold tracking-[1.1px] text-[#FFFFFFCC] lg:hidden">Pilih role lalu masuk ke POS</p>
				<p className="relative z-10 hidden text-[18px]/[21px] font-bold text-[#FFFFFFCC] lg:block">
					Sistem POS restoran — kasir dan administrator
				</p>
			</div>

			{/* Form */}
			<div className="flex flex-col items-start justify-center gap-7 px-5 pb-8 lg:px-[110px] lg:py-[140px]">
				<div className="hidden w-[520px] flex-col gap-2 lg:flex">
					<p className="text-[12px] font-black tracking-[1.4px] text-muted">DAPUR INA AINA POS</p>
					<h1 className="text-[42px]/[44px] font-black text-primary">Masuk ke POS</h1>
					<p className="text-[15px]/[20px] font-semibold text-muted">Pilih masuk sebagai Kasir atau Admin, lalu gunakan akun yang sesuai.</p>
				</div>

				<form
					action={kirim}
					className="flex w-full flex-col gap-3.5 rounded-[28px] bg-surface p-[18px] shadow-[0px_14px_34px_0px_#17171718] outline outline-border -outline-offset-px lg:w-[520px] lg:rounded-[30px] lg:p-5"
				>
					<label className={field}>
						<Mail aria-hidden className="size-5 shrink-0 text-muted lg:size-[18px]" strokeWidth={2} />
						<span className="sr-only">Email</span>
						<input type="email" name="email" required autoComplete="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className={input} />
					</label>

					<label className={field}>
						<LockKeyhole aria-hidden className="size-5 shrink-0 text-muted lg:size-[18px]" strokeWidth={2} />
						<span className="sr-only">Kata sandi</span>
						<input
							type={lihat ? "text" : "password"}
							name="password"
							required
							autoComplete="current-password"
							placeholder="Kata sandi"
							className={input}
						/>
						<button
							type="button"
							onClick={() => setLihat((v) => !v)}
							aria-label={lihat ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
							className="ml-auto shrink-0 text-muted"
						>
							{lihat ? <EyeOff aria-hidden className="size-5 lg:size-[18px]" /> : <Eye aria-hidden className="size-5 lg:size-[18px]" />}
						</button>
					</label>

					<input type="hidden" name="peran" value={peran} />
					<div
						role="radiogroup"
						aria-label="Pilih role"
						className="flex h-[52px] shrink-0 gap-2 rounded-[20px] bg-bg p-1.5 outline outline-border -outline-offset-px lg:h-[56px]"
					>
						{(["kasir", "administrator"] as const).map((p) => (
							<button
								key={p}
								type="button"
								role="radio"
								aria-checked={peran === p}
								onClick={() => setPeran(p)}
								className={`${roleBtn} ${peran === p ? "bg-primary text-white" : "bg-white text-primary outline outline-border -outline-offset-px"}`}
							>
								{p === "kasir" ? "Kasir" : "Admin"}
							</button>
						))}
					</div>

					{error ? (
						<p role="alert" className="text-[13px] font-semibold text-danger">
							{error}
						</p>
					) : null}

					<button
						type="submit"
						disabled={proses}
						className="flex h-[54px] shrink-0 items-center justify-center rounded-[99px] bg-primary text-[15px]/[18px] font-extrabold text-white shadow-[0px_12px_22px_0px_#17171733] transition-opacity hover:opacity-90 disabled:opacity-60 lg:h-[56px] lg:font-black"
					>
						{proses ? "Memproses…" : <><span className="lg:hidden">Masuk ke POS</span><span className="hidden lg:inline">Masuk</span></>}
					</button>
				</form>
			</div>
		</main>
	);
}
