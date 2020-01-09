import ReactCurrentDispatcher from './ReactCurrentDispatcher';

function resolveDispatcher() {
	const dispatcher = ReactCurrentDispatcher.current;

	return dispatcher;
}

export function useState(initState) {
	const dispatcher = resolveDispatcher();
	return dispatcher.useState(initState);
}

export function useMemo(create, inputs) {
	const dispatcher = resolveDispatcher();
	return dispatcher.useMemo(create, inputs);
}

export function useCallback(callback, inputs) {
	const dispatcher = resolveDispatcher();
	return dispatcher.useCallback(callback, inputs);
}

export function useReducer(reducer, initalArgs, init) {
	const dispatcher = resolveDispatcher();
	return dispatcher.useReducer(reducer, initalArgs, init);
}

export function useEffect(create, inputs) {
	const dispatcher = resolveDispatcher();
	return dispatcher.useEffect(create, inputs);
}
