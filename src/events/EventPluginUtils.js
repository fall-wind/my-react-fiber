export let getFiberCurrentPropsFromNode = null;
export let getInstanceFromNode = null;
export let getNodeFromInstance = null;

export function setComponentTree(
    getFiberCurrentPropsFromNodeImpl,
    getInstanceFromNodeImpl,
    getNodeFromInstanceImpl,
) {
    getFiberCurrentPropsFromNode = getFiberCurrentPropsFromNodeImpl;
    getInstanceFromNode = getInstanceFromNodeImpl;
    getNodeFromInstance = getNodeFromInstanceImpl;
}

export function executeDispatch(event, listener, inst) {
	const type = event.type || 'unknown-event';
    event.currentTarget = getNodeFromInstance(inst);
    // TODO
    // invokeGuardedCallbackAndCatchFirstError(type, listener, undefined, event);
    try {
        listener(type, undefined, event)
    } catch (error) {
        console.error(error)
    }
	event.currentTarget = null;
}

export function executeDispatchesInOrder(event) {
	const dispatchListeners = event._dispatchListeners;
	const dispatchInstances = event._dispatchInstances;
	if (Array.isArray(dispatchListeners)) {
		for (let i = 0; i < dispatchListeners.length; i++) {
			if (event.isPropagationStopped()) {
				break;
			}
			// Listeners and Instances are two parallel arrays that are always in sync.
			executeDispatch(event, dispatchListeners[i], dispatchInstances[i]);
		}
	} else if (dispatchListeners) {
		executeDispatch(event, dispatchListeners, dispatchInstances);
	}
	event._dispatchListeners = null;
	event._dispatchInstances = null;
}
