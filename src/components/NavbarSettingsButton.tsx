import { Button } from "@heroui/react";
import { UserCircleIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { SettingsModal } from "./SettingsModal";

export function NavbarSettingsButton() {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<>
			<Button
				onPress={() => setIsOpen(true)}
				isIconOnly
				variant="ghost"
				size="lg"
				className="animate-in fade-in zoom-in-75 duration-300"
			>
				<UserCircleIcon className="flex-none size-8" weight="light" />
			</Button>
			<SettingsModal isOpen={isOpen} setIsOpen={setIsOpen} />
		</>
	);
}
