function forEachAccumulated(arr, cb, scope) {
	if (Array.isArray(arr)) {
		arr.forEach(cb, scope);
	} else if (arr) {
		cb.call(scope, arr);
	}
}

export default forEachAccumulated;
