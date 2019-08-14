export const ImmediatePriority = 1;
export const UserBlockingPriority = 2;
export const NormalPriority = 3;
export const LowPriority = 4;
export const IdlePriority = 5;

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
