import { HostComponent, HostText } from '../shared/ReactWorkTags';

const randomKey = Math.random()
	.toString(36)
	.slice(2);
const internalInstanceKey = '__reactInternalInstance$' + randomKey;
const internalEventHandlersKey = '__reactEventHandlers$' + randomKey;

export function precacheFiberNode(hostInst, node) {
	node[internalInstanceKey] = hostInst;
}

export function getFiberCurrentPropsFromNode(node) {
	return node[internalEventHandlersKey] || null;
}

export function getNodeFromInstance(inst) {
	if (inst.tag === HostComponent || inst.tag === HostText) {
		// In Fiber this, is just the state node right now. We assume it will be
		// a host component or host text.
		return inst.stateNode;
	}

	// Without this first invariant, passing a non-DOM-component triggers the next
	// invariant for a missing parent, which is super confusing.
	// invariant(false, 'getNodeFromInstance: Invalid argument.');
}

export function getInstanceFromNode(node) {
	const inst = node[internalInstanceKey];
	if (inst) {
		if (inst.tag === HostComponent || inst.tag === HostText) {
			return inst;
		} else {
			return null;
		}
	}
	return null;
}

export function updateFiberProps(node, props) {
	node[internalEventHandlersKey] = props;
}

export function getClosestInstanceFromNode(node) {
	if (node[internalInstanceKey]) {
		return node[internalInstanceKey];
	}

	while (!node[internalInstanceKey]) {
		if (node.parentNode) {
			node = node.parentNode;
		} else {
			return null;
		}
	}

	let inst = node[internalInstanceKey];
	if (inst.tag === HostComponent || inst.tag === HostText) {
		return inst;
	}

	return null;
}
