import { Button } from "@refeat/ui/components/button";
import PixelScene from "@/components/pixel-scene";
import { authClient } from "@/lib/auth-client";

export default function LoginForm() {
	return (
		<div className="panel reveal w-full max-w-sm overflow-hidden !shadow-[6px_6px_0_0_var(--pine)]">
			<PixelScene />

			<div className="border-t-2 border-pine px-6 pt-6 pb-7 text-center">
				<h1 className="font-display text-6xl leading-none text-foreground">
					refeat
				</h1>
				<p className="mt-2 font-pixel text-[10px] tracking-widest text-muted-foreground uppercase">
					where calm meets consistency
				</p>

				<Button
					variant="outline"
					className="btn-pixel mt-7 w-full !border-pine bg-lime !font-pixel text-[11px] text-pine uppercase hover:bg-lime-deep"
					onClick={() =>
						authClient.signIn.social({ provider: "google", callbackURL: "/" })
					}
				>
					▶ Continue with Google
				</Button>

				<p className="mt-6 font-pixel text-[9px] text-muted-foreground/70">
					accept a quest · grow your streak
				</p>
			</div>
		</div>
	);
}
