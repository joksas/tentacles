import { useLocalStorage } from "usehooks-ts";
import { z } from "zod";

const USER_SETTINGS_ID = "settings";
export const API_KEY_PREFIX = "sk_live_";

export const ApiKey = z.string().trim().startsWith(API_KEY_PREFIX).optional();
export const Settings = z.object({
	apiKey: ApiKey,
});
export type Settings = z.infer<typeof Settings>;
const DEFAULT_USER_SETTINGS: Settings = {};

export function useSettings() {
	const [value] = useLocalStorage<Settings>(
		USER_SETTINGS_ID,
		DEFAULT_USER_SETTINGS,
	);
	return value;
}

export function useUpdateAPIKey(): (newAPIKey: string | undefined) => void {
	const [_, setValue] = useLocalStorage<Settings>(
		USER_SETTINGS_ID,
		DEFAULT_USER_SETTINGS,
	);
	return (newAPIKey: string | undefined) =>
		setValue((prev) => ({
			...prev,
			apiKey: newAPIKey,
		}));
}
