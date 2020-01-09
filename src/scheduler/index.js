import { getCurrentTime } from './SchedulerHostConfig';
import { push, peek } from './SchedulerMinHeap';

// Max 31 bit integer. The max integer size in V8 for 32-bit systems.
// Math.pow(2, 30) - 1
// 0b111111111111111111111111111111
var maxSigned31BitInt = 1073741823;

// Tasks are stored on a min heap
var taskQueue = [];
var timerQueue = [];
// Incrementing id counter. Used to maintain insertion order.
var taskIdCounter = 0;

// This is set while performing work, to prevent re-entrancy.
var isPerformingWork = false;

var isHostCallbackScheduled = false;
var isHostTimeoutScheduled = false;

export const ImmediatePriority = 1;
export const UserBlockingPriority = 2;
export const NormalPriority = 3;
export const LowPriority = 4;
export const IdlePriority = 5;

var IMMEDIATE_PRIORITY_TIMEOUT = -1;
// Eventually times out
var USER_BLOCKING_PRIORITY = 250;
var NORMAL_PRIORITY_TIMEOUT = 5000;
var LOW_PRIORITY_TIMEOUT = 10000;

var IDLE_PRIORITY = maxSigned31BitInt;

let currentPriorityLevel = NormalPriority;

export function unstable_getCurrentPriorityLevel() {
	return currentPriorityLevel;
}

export function unstable_runWithPriority(priorityLevel, eventHandler) {
	switch (priorityLevel) {
		case ImmediatePriority:
		case UserBlockingPriority:
		case NormalPriority:
		case LowPriority:
		case IdlePriority:
			break;
		default:
			priorityLevel = NormalPriority;
	}

	var previousPriorityLevel = currentPriorityLevel;
	currentPriorityLevel = priorityLevel;

	try {
		return eventHandler();
	} finally {
		currentPriorityLevel = previousPriorityLevel;
	}
}

function timeoutForPriorityLevel(priorityLevel) {
	switch (priorityLevel) {
		case ImmediatePriority:
			return IMMEDIATE_PRIORITY_TIMEOUT;
		case UserBlockingPriority:
			return USER_BLOCKING_PRIORITY;
		case IdlePriority:
			return IDLE_PRIORITY;
		case LowPriority:
			return LOW_PRIORITY_TIMEOUT;
		case NormalPriority:
		default:
			return NORMAL_PRIORITY_TIMEOUT;
	}
}

export function unstable_cancelCallback(task) {
	task.callback = null;
}

export function unstable_scheduleCallback(priorityLevel, callback, options) {
	var currentTime = getCurrentTime();

	var startTime;
	var timeout;

	if (typeof options === 'object' && options !== null) {
		const { delay } = options;
		if (typeof delay === 'number' && delay > 0) {
			startTime = currentTime + delay;
		} else {
			startTime = currentTime;
		}

		timeout = timeoutForPriorityLevel(priorityLevel);
	} else {
		startTime = currentTime;
		timeout = timeoutForPriorityLevel(priorityLevel);
	}

	var expirationTime = startTime + timeout;

	var newTask = {
		id: taskIdCounter++,
		callback,
		priorityLevel,
		startTime,
		expirationTime,
		sortIndex: -1,
	};

	if (startTime > currentTime) {
		// // TODO
		// newTask.sortIndex = startTime;
		// push(timerQueue, newTask)
		// //
		// if (peek(taskQueue) === null && newTask === peek(timerQueue)) {
		// }
	} else {
		//
		newTask.sortIndex = expirationTime;
		push(taskQueue, newTask);
		if (!isHostCallbackScheduled && !isPerformingWork) {
			// TODO
		}
	}

	return newTask;
}
