export function addEventBubbleListener(element, eventType, listener) {
	element.addEventListener(eventType, listener, false);
}

export function addEventCaptureListener(element, eventType, listener) {
	element.addEventListener(eventType, listener, true);
}
