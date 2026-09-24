import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Lapis 1: refresh token Supabase + tolak akses tanpa login ke /kasir & /admin.
 * Lapis 2 (peran salah → redirect) ada di layout server via wajibPeran().
 */
export async function middleware(req: NextRequest) {
	let res = NextResponse.next({ request: req });
	const supabase = createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			cookies: {
				getAll: () => req.cookies.getAll(),
				setAll: (list) => {
					for (const { name, value } of list) req.cookies.set(name, value);
					res = NextResponse.next({ request: req });
					for (const { name, value, options } of list) res.cookies.set(name, value, options);
				},
			},
		},
	);
	const {
		data: { user },
	} = await supabase.auth.getUser();
	if (!user) {
		const to = req.nextUrl.clone();
		to.pathname = "/login";
		to.search = "";
		return NextResponse.redirect(to);
	}
	return res;
}

export const config = { matcher: ["/kasir/:path*", "/admin/:path*"] };
