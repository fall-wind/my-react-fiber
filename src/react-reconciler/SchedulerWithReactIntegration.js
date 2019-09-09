import {
	unstable_getCurrentPriorityLevel as Scheduler_getCurrentPriorityLevel,
	ImmediatePriority as Scheduler_ImmediatePriority,
	UserBlockingPriority as Scheduler_UserBlockingPriority,
	NormalPriority as Scheduler_NormalPriority,
	IdlePriority as Scheduler_IdlePriority,
	LowPriority as Scheduler_LowPriority,
	unstable_runWithPriority as Scheduler_runWithPriority,
	unstable_scheduleCallback as Scheduler_scheduleCallback,
	unstable_cancelCallback as Scheduler_cancelCallback,
} from '../scheduler';

export const ImmediatePriority = 99;
export const UserBlockingPriority = 98;
export const NormalPriority = 97;
export const LowPriority = 96;
export const IdlePriority = 95;
// NoPriority is the absence of priority. Also React-only.
export const NoPriority = 90;

let immediateQueueCallbackNode = null;
let isFlushingSyncQueue = false;

let syncQueue = null;

const fakeCallbackNode = {};

export function scheduleCallback(reactPriorityLevel, callback, options) {
    const priorityLevel = reactPriorityToSchedulerPriority(reactPriorityLevel)
    return Scheduler_runWithPriority(priorityLevel, callback, options)
}

export function getCurrentPriorityLevel() {
	switch (Scheduler_getCurrentPriorityLevel()) {
		case Scheduler_ImmediatePriority:
			return ImmediatePriority;
		case Scheduler_UserBlockingPriority:
			return UserBlockingPriority;
		case Scheduler_NormalPriority:
			return NormalPriority;
		case Scheduler_LowPriority:
			return LowPriority;
		case Scheduler_IdlePriority:
			return IdlePriority;
		default:
			invariant(false, 'Unknown priority level.');
	}
}

function reactPriorityToSchedulerPriority(reactPriorityLevel) {
	switch (reactPriorityLevel) {
		case ImmediatePriority:
			return Scheduler_ImmediatePriority;
		case UserBlockingPriority:
			return Scheduler_UserBlockingPriority;
		case NormalPriority:
			return Scheduler_NormalPriority;
		case LowPriority:
			return Scheduler_LowPriority;
		case IdlePriority:
			return Scheduler_IdlePriority;
		default:
			invariant(false, 'Unknown priority level.');
	}
}

export function runWithPriority(reactPriorityLevel, fn) {
	const priorityLevel = reactPriorityToSchedulerPriority(reactPriorityLevel);
	return Scheduler_runWithPriority(priorityLevel, fn);
}

export function flushSyncCallbackQueueImpl() {
	if (!isFlushingSyncQueue && syncQueue !== null) {
		isFlushingSyncQueue = true;
		let i = 0;
		try {
			let isSync = true;
			let queue = syncQueue;
			runWithPriority(ImmediatePriority, () => {
				for (; i < queue.length; i++) {
					let callback = queue[i];
					do {
						callback = callback(isSync);
					} while (callback !== null);
				}
			});
			syncQueue = null;
		} catch (error) {
			// error status
			console.error(error, 'error...');
		} finally {
			isFlushingSyncQueue = false;
		}
	}
}

export function flushSyncCallbackQueue() {
	if (immediateQueueCallbackNode !== null) {
		Scheduler_cancelCallback(immediateQueueCallbackNode);
	}
	flushSyncCallbackQueueImpl();
}

export function scheduleSyncCallback(callback) {
	if (syncQueue === null) {
		syncQueue = [callback];
		immediateQueueCallbackNode = Scheduler_scheduleCallback(
			Scheduler_ImmediatePriority,
			flushSyncCallbackQueueImpl,
		);
	} else {
		syncQueue.push(callback);
	}

	return fakeCallbackNode;
}
