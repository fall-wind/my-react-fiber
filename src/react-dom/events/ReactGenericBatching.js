// Defaults
let batchedUpdatesImpl = function(fn, bookkeeping) {
	return fn(bookkeeping);
};
let discreteUpdatesImpl = function(fn, a, b, c) {
	return fn(a, b, c);
};
let flushDiscreteUpdatesImpl = function() {};
let batchedEventUpdatesImpl = batchedUpdatesImpl;

let isInsideEventHandler = false;


export function batchedEventUpdates(fn, a, b) {
	if (isInsideEventHandler) {
		return fn(a, b);
	}
	isInsideEventHandler = true;
	try {
		return batchedEventUpdatesImpl(fn, a, b);
	} finally {
		isInsideEventHandler = false;
	}
}

export function discreteUpdates(fn, a, b, c) {
	const preIsInsideEventHandler = isInsideEventHandler;
	isInsideEventHandler = true;
	try {
		return discreteUpdatesImpl(fn, a, b, c);
	} finally {
		isInsideEventHandler = preIsInsideEventHandler;
	}
}

export function setBatchingImplementation(
	_batchedUpdatesImpl,
	_discreteUpdatesImpl,
	_flushDiscreteUpdatesImpl,
	_batchedEventUpdatesImpl,
) {
	batchedUpdatesImpl = _batchedUpdatesImpl;
	discreteUpdatesImpl = _discreteUpdatesImpl;
	flushDiscreteUpdatesImpl = _flushDiscreteUpdatesImpl;
	batchedEventUpdatesImpl = _batchedEventUpdatesImpl;
}
