const COFFEE_SLUG_NERO = "caffe-nero";
const COFFEE_SLUG_GREGGS = "greggs";
export const COFFEE_SLUGS = [COFFEE_SLUG_NERO, COFFEE_SLUG_GREGGS];

// Mon (1), Tue (2), and Wed (3): caffe-nero only; all other days: both
export function getCoffeeSlugsForDay(utcDay: number): string[] {
	if (utcDay === 1 || utcDay === 2) return [COFFEE_SLUG_NERO];
	return COFFEE_SLUGS;
}
