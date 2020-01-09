let valueStack = [];

let index = -1;

let fiberStack;

function createCursor(defaultValue) {
	return {
		current: defaultValue,
	};
}

function pop(cursor) {
	if (index < 0) {
		return;
	}
	cursor.current = valueStack[index];

	valueStack[index] = null;

	index--;
}

function push(cursor, value, fiber) {
	index++;
	valueStack[index] = cursor.current;
	cursor.current = value;
}

export { pop, push, createCursor };
