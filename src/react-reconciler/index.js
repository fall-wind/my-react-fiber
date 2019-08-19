import { getPublicInstance } from './fiberHostConfig';
import { unbatchedUpdates, requestCurrentTime, computeExpirationForFiber } from './ReactFiberWorkLoop';
import { createUpdate, enqueueUpdate } from './updateQueue';
import { emptyContextObject } from './fiberContext'
import { scheduleUpdateOnFiber as scheduleWork } from './ReactFiberWorkLoop'
import { createFiberRoot } from './fiberRoot'
import { HostComponent } from '../shared/ReactWorkTags';

export function createContainer(containerInfo, tag) {
	return createFiberRoot(containerInfo, tag);
}

function getContextForSubtree(parentComponent) {
    if (!parentComponent) {
        return emptyContextObject
    }

    // TODO
}

function scheduleRootUpdate(
    current,
    element,
    expirationTime,
    suspenseConfig,
    callback,
) {
    const update = createUpdate(expirationTime, suspenseConfig)
    update.payload = { element }
    callback = callback === undefined ? null : callback
    update.callback = callback
    enqueueUpdate(current, update);
    scheduleWork(current, expirationTime);
}

function updateContainerAtExpirationTime(
    element, // children
    container,
    parentComponent,
    expirationTime,
    suspenseConfig,
    callback,
) {
    const current = container.current

    const context = getContextForSubtree(parentComponent)
    if (container.context === null) { // 默认为undefind
        container.context = context
    } else {
        container.pendingContext = context
    }
    return scheduleRootUpdate(current, element, expirationTime, suspenseConfig, callback);
}

export function updateContainer(
	element,
	container,
	parentComponent,
	callback,
) {
    const current = container.current // current 是fiber container是fiberRoot
    const currentTime = requestCurrentTime()
    const suspenseConfig = {}
    const expirationTime = computeExpirationForFiber(currentTime, current, suspenseConfig)
    return updateContainerAtExpirationTime(
        element,
        container,
        parentComponent,
        expirationTime,
        suspenseConfig,
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
