var ImmediatePriority = 1;
var UserBlockingPriority = 2;
var NormalPriority = 3;
var LowPriority = 4;
var IdlePriority = 5;

let currentPriorityLevel = NormalPriority;

function unstable_getCurrentPriorityLevel() {
	return currentPriorityLevel;
}
