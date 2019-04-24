export const NoWork = 0;
export const Never = 1;
export const Sync = MAX_SIGNED_31_BIT_INT;

const MAX_SIGNED_31_BIT_INT = 1073741823;

const UNIT_SIZE = 10;
const MAGIC_NUMBER_OFFSET = MAX_SIGNED_31_BIT_INT - 1;

const LOW_PRIORITY_EXPIRATION = 5000;
const LOW_PRIORITY_BATCH_SIZE = 250;

export function msToExpirationTime(ms) {
	// Always add an offset so that we don't clash with the magic number for NoWork.
	return MAGIC_NUMBER_OFFSET - ((ms / UNIT_SIZE) | 0);
}

function ceiling(num, precision) {
	return (((num / precision) | 0) + 1) * precision;
}

function computeExpirationBucket(currentTime, expirationInMs, bucketSizeMs) {
	return (
		MAGIC_NUMBER_OFFSET -
		ceiling(
			currentTime,
			MAGIC_NUMBER_OFFSET - currentTime + expirationInMs / UNIT_SIZE,
			bucketSizeMs,
		)
	);
}

export function computeAsyncExpiration(currentTime) {
	return computeExpirationBucket(
		currentTime,
		LOW_PRIORITY_EXPIRATION,
		LOW_PRIORITY_BATCH_SIZE,
	);
}
