import { Spinner } from "@heroui/react";
import type { ComponentProps } from "react";

export function LoadingScreen(props: ComponentProps<"h1">) {
	return (
		<div className="w-full flex items-center justify-center gap-5 flex-col m-auto">
			<h1 className="text-2xl font-bold">{props.children}</h1>
			<Spinner size="xl" />
		</div>
	);
}
