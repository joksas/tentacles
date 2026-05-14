import { Button } from "@heroui/react";
import { useState } from "react";
import { SettingsModal } from "./SettingsModal";

export function Welcome() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className="flex flex-col items-center justify-center gap-6 m-auto text-center">
			<div className="flex flex-col gap-2">
				<h1 className="text-3xl font-bold">Personal energy dashboard</h1>
				<p className="text-muted max-w-sm">
					View your Octopus Energy bills and explore how much you'd pay on
					different tariffs.
				</p>
			</div>
			<Button onPress={() => setIsOpen(true)} variant="primary" size="lg">
				Connect Octopus
			</Button>
			<SettingsModal isOpen={isOpen} setIsOpen={setIsOpen} />
		</div>
	);
}
