import { getPublicInstance } from './fiberHostConfig';
import { unbatchedUpdates, requestCurrentTime, computeExpirationForFiber } from './fiberScheduler';
import { createUpdate, enqueueUpdate } from './updateQueue';

export function createContainer(containerInfo) {
	return createFiberRoot(containerInfo);
}

function scheduleRootUpdate(
    current,
    element,
    expirationTime,
    callback,
) {
    const update = createUpdate(expirationTime)
    update.payload = { element }
    callback = callback === undefined ? null : callback
    enqueueUpdate(current, update);
    scheduleWork(current, expirationTime);
}

function updateContainerAtExpirationTime(
    element, // children
    container,
    parentComponent,
    expirationTime,
    callback,
) {
    const current = container.current
    return scheduleRootUpdate(current, element, expirationTime, callback);
}

export function updateContainer(
	element,
	container,
	parentComponent,
	callback,
) {
    const current = container.current // current 是fiber container是fiberRoot
    const currentTime = requestCurrentTime()
    
    const expirationTime = computeExpirationForFiber(currentTime, current)
    return updateContainerAtExpirationTime(
        element,
        container,
        parentComponent,
        expirationTime,
        callback,
    )
}

export function getPublicRootInstance(container) {
	const containerFiber = container.current;
	if (!containerFiber.child) {
		return null;
	}
	switch (containerFiber.child.tag) {
		case HostComponent:
			return getPublicInstance(containerFiber.child.stateNode);
		default:
			// 默认为child的stateNode
			return containerFiber.child.stateNode;
	}
}

export { unbatchedUpdates };
