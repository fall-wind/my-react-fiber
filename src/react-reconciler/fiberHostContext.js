import { createCursor } from './fiberStack';

const NO_CONTEXT = {};

let rootInstanceStackCursor = createCursor(NO_CONTEXT);
let contextStackCursor = createCursor(NO_CONTEXT);

export function getRootHostContainer() {
	const rootInstance = rootInstanceStackCursor.current;
	return rootInstance;
}

export function getHostContext() {
	// const context = requiredContext(contextStackCursor.current);
    // return context;
    return {
        current: {},
    }
}
