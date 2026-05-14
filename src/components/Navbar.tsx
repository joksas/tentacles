import { Button } from "@heroui/react";
import { ListIcon, WavesIcon, XIcon } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useSettings } from "#/lib/auth";
import { NavbarSettingsButton } from "./NavbarSettingsButton";

const NAV_LINK_CLASS =
	"text-sm text-muted hover:text-foreground transition-colors [&.active]:text-foreground [&.active]:font-medium";

const NAV_LINKS = [
	{ to: "/", label: "Bills" },
	{ to: "/simulator", label: "Tariff simulator" },
] as const;

export function Navbar() {
	const apiKey = useSettings().apiKey;
	const [isMenuOpen, setIsMenuOpen] = useState(false);

	return (
		<nav className="sticky top-0 z-40 w-full border-b border-separator bg-background/70 backdrop-blur-lg">
			<header className="flex h-16 items-center justify-between px-4 sm:px-8">
				<Link to="/" className="flex items-center gap-1">
					<WavesIcon size={30} className="text-accent sm:hidden" />
					<WavesIcon size={40} className="text-accent hidden sm:block" />
					<span className="text-xl sm:text-3xl font-semibold">Tentacles</span>
				</Link>

				{apiKey && (
					<>
						{/* Desktop nav */}
						<ul className="hidden sm:flex items-center gap-4">
							{NAV_LINKS.map(({ to, label }) => (
								<li key={to}>
									<Link to={to} className={NAV_LINK_CLASS}>
										{label}
									</Link>
								</li>
							))}
							<li>
								<NavbarSettingsButton />
							</li>
						</ul>

						{/* Mobile: settings + hamburger */}
						<div className="flex sm:hidden items-center gap-1">
							<NavbarSettingsButton />
							<Button
								isIconOnly
								variant="ghost"
								onPress={() => setIsMenuOpen((open) => !open)}
								aria-label={isMenuOpen ? "Close menu" : "Open menu"}
							>
								{isMenuOpen ? (
									<XIcon className="size-7" />
								) : (
									<ListIcon className="size-7" />
								)}
							</Button>
						</div>
					</>
				)}
			</header>

			{/* Mobile dropdown */}
			{apiKey && isMenuOpen && (
				<div className="sm:hidden border-t border-separator px-4 py-5">
					<ul className="flex flex-col gap-5">
						{NAV_LINKS.map(({ to, label }) => (
							<li key={to}>
								<Link
									to={to}
									className={NAV_LINK_CLASS}
									onClick={() => setIsMenuOpen(false)}
								>
									{label}
								</Link>
							</li>
						))}
					</ul>
				</div>
			)}
		</nav>
	);
}
