import {
	unstable_getCurrentPriorityLevel as Scheduler_getCurrentPriorityLevel,
	ImmediatePriority as Scheduler_ImmediatePriority,
	UserBlockingPriority as Scheduler_UserBlockingPriority,
	NormalPriority as Scheduler_NormalPriority,
	IdlePriority as Scheduler_IdlePriority,
    LowPriority as Scheduler_LowPriority,
    unstable_runWithPriority as Scheduler_runWithPriority,
} from '../scheduler';

export const ImmediatePriority = 99;
export const UserBlockingPriority = 98;
export const NormalPriority = 97;
export const LowPriority = 96;
export const IdlePriority = 95;
// NoPriority is the absence of priority. Also React-only.
export const NoPriority = 90;

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
