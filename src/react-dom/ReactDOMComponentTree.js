import { HostComponent, HostText } from '../shared/ReactWorkTags';

const randomKey = Math.random()
	.toString(36)
	.slice(2);
const internalInstanceKey = '__reactInternalInstance$' + randomKey;
const internalEventHandlersKey = '__reactEventHandlers$' + randomKey;

export function precacheFiberNode(hostInst, node) {
	node[internalInstanceKey] = hostInst;
}

export function updateFiberProps(node, props) {
    node[internalEventHandlersKey] = props;
}