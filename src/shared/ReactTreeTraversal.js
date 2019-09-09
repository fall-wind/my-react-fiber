import { HostComponent } from './ReactWorkTags'

function getParent(inst) {
	do {
		inst = inst.return;
	} while (inst && inst.tag !== HostComponent);
	if (inst) {
		return inst;
	}
	return null;
}

export function traverseTwoPhase(inst, fn, arg) {
	const path = [];
	while (inst) {
		path.push(inst);
		inst = getParent(inst);
	}
	let i;
	for (i = path.length; i-- > 0; ) {
		fn(path[i], 'captured', arg);
	}
	for (i = 0; i < path.length; i++) {
		fn(path[i], 'bubbled', arg);
	}
}
