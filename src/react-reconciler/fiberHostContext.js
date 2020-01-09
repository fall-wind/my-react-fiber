import { createCursor, pop, push } from './fiberStack';
import { getRootHostContext } from './ReactDOMHostConfig'

const NO_CONTEXT = {};

let rootInstanceStackCursor = createCursor(NO_CONTEXT);
let contextStackCursor = createCursor(NO_CONTEXT);
let contextFiberStackCursor = createCursor(NO_CONTEXT);

export function getRootHostContainer() {
	const rootInstance = rootInstanceStackCursor.current;
	return rootInstance;
}

//
export function pushHostContainer(fiber, nextRootInstance) {
	push(rootInstanceStackCursor, nextRootInstance, fiber);
	push(contextFiberStackCursor, fiber, fiber);

	push(contextStackCursor, NO_CONTEXT, fiber);

	const nextRootContext = getRootHostContext(nextRootInstance);

	pop(contextStackCursor, fiber);
	push(contextStackCursor, nextRootContext, fiber);
}

export function getHostContext() {
	// const context = requiredContext(contextStackCursor.current);
	return contextStackCursor.current;
}

export function popHostContext(fiber) {
	if (contextFiberStackCursor.current !== fiber) {
		return;
	}

	pop(contextStackCursor, fiber);
	pop(contextFiberStackCursor, fiber);
}

export function popHostContainer(fiber) {
	pop(contextStackCursor, fiber);
	pop(contextFiberStackCursor, fiber);
	pop(rootInstanceStackCursor, fiber);
}
