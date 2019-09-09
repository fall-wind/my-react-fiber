import accumulateInto from './accumulateInto';
import forEachAccumulated from './forEachAccumulated'
import { executeDispatchesInOrder } from './EventPluginUtils'

let eventQueue = null;

const executeDispatchesAndRelease = function(event) {
	if (event) {
		executeDispatchesInOrder(event);

		if (!event.isPersistent()) {
			event.constructor.release(event);
		}
	}
};

const executeDispatchesAndReleaseTopLevel = function(e) {
	return executeDispatchesAndRelease(e);
};

export function runEventsInBatch(events) {
	if (events !== null) {
		eventQueue = accumulateInto(eventQueue, events);
	}

	const processingEventQueue = eventQueue;
	eventQueue = null;

	if (!processingEventQueue) {
		return;
	}
	forEachAccumulated(
		processingEventQueue,
		executeDispatchesAndReleaseTopLevel,
	);
}
