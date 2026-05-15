import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import {
	ClientOnly,
	createRootRouteWithContext,
	HeadContent,
	Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { Footer } from "#/components/Footer";
import { LoadingScreen } from "#/components/LoadingScreen";
import { Navbar } from "#/components/Navbar";
import appCss from "../styles.css?url";

const OG_URL = "https://tentacles.dovydas.com";
const OG_TITLE = "Tentacles";
const OG_DESCRIPTION =
	"Personal energy dashboard - track bills and simulate tariffs.";
const OG_IMAGE = "/og.jpg";

export const Route = createRootRouteWithContext<{
	queryClient: QueryClient;
}>()({
	head: () => ({
		meta: [
			{
				charSet: "utf-8",
			},
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1",
			},
			{
				title: OG_TITLE,
			},
			{ property: "og:title", content: OG_TITLE },
			{ name: "description", content: OG_DESCRIPTION },
			{
				property: "og:description",
				content: OG_DESCRIPTION,
			},
			{ property: "og:type", content: "website" },
			{ property: "og:image", content: OG_IMAGE },
			{ property: "og:url", content: OG_URL },
			{ name: "twitter:card", content: "summary_large_image" },
			{ name: "twitter:title", content: OG_TITLE },
			{
				name: "twitter:description",
				content: OG_DESCRIPTION,
			},
			{ name: "twitter:image", content: OG_IMAGE },
			{ name: "twitter:url", content: OG_URL },
		],
		links: [
			{
				rel: "stylesheet",
				href: appCss,
			},
			{ rel: "manifest", href: "/manifest.json" },
			{ rel: "icon", href: "/favicon.ico" },
		],
	}),
	shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" className="dark" data-theme="dark">
			<head>
				<HeadContent />
			</head>
			<body className="bg-background text-foreground min-h-svh flex flex-col">
				<Navbar />
				<main className="px-4 sm:px-8 py-8 flex flex-col gap-2 flex-1">
					<ClientOnly fallback={<LoadingScreen>Setting up...</LoadingScreen>}>
						{children}
					</ClientOnly>
				</main>
				<Footer />
				<TanStackDevtools
					config={{
						position: "bottom-right",
					}}
					plugins={[
						{
							name: "Tanstack Router",
							render: <TanStackRouterDevtoolsPanel />,
						},
					]}
				/>
				<Scripts />
			</body>
		</html>
	);
}
