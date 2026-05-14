/** Formats date using user's locale (English only) */
export function formatDate(
	date: string | Date,
	options?: {
		/** Shows the year, even if it's current one */
		forceYear?: boolean;
	},
) {
	const forceYear = options?.forceYear ?? false;
	const dateObj = typeof date === "string" ? new Date(date) : date;

	const showYear =
		forceYear || dateObj.getFullYear() !== new Date().getFullYear();

	// Use user's locale if English - otherwise en-US
	const currentLocale = new Intl.DateTimeFormat().resolvedOptions().locale;
	const locale = currentLocale.startsWith("en") ? currentLocale : "en-US";

	return new Intl.DateTimeFormat(locale, {
		day: "numeric",
		month: "short",
		year: showYear ? "numeric" : undefined,
	}).format(dateObj);
}
