import { Link } from "@heroui/react";
import { DotIcon, GithubLogoIcon } from "@phosphor-icons/react";

export function Footer() {
	return (
		<footer className="border-t border-separator px-4 sm:px-8 py-6 flex flex-col gap-3 text-muted">
			<div className="flex items-center gap-1 text-sm">
				<span>
					Made by{" "}
					<Link
						href="https://dovydas.com"
						target="_blank"
						rel="noopener noreferrer"
						className="hover:text-foreground transition-colors underline underline-offset-2 text-[length:inherit] text-muted"
					>
						Dovydas Joksas
					</Link>
				</span>
				<DotIcon size={20} weight="bold" />
				<Link
					href="https://github.com/joksas/tentacles"
					target="_blank"
					rel="noopener noreferrer"
					className="hover:text-foreground transition-colors underline underline-offset-2 flex items-center gap-1 text-[length:inherit] text-muted"
				>
					<GithubLogoIcon size={20} />
					<span>Source code</span>
				</Link>
			</div>
			<p className="text-xs text-muted">
				This tool is not affiliated with or endorsed by Octopus Energy. Figures
				shown are calculated by this app and may contain inaccuracies — use them
				for informational purposes only. We accept no responsibility for errors
				or decisions made based on this data.
			</p>
		</footer>
	);
}
