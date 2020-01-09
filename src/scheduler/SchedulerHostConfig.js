const clearTimeout = window.clearTimeout;

export let cancelHostTimeout;

let taskTimeoutID = -1

export function getCurrentTime() {
	typeof performance === 'object' && typeof performance.now === 'function'
		? () => performance.now()
		: () => Date.now();
}

cancelHostTimeout = function() {
	clearTimeout(taskTimeoutID);
	taskTimeoutID = -1;
};
