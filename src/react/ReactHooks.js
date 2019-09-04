import ReactCurrentDispatcher from './ReactCurrentDispatcher';

function resolveDispatcher() {
	const dispatcher = ReactCurrentDispatcher.current;

	return dispatcher;
}

export function useState(initState) {
	const dispatcher = resolveDispatcher();
	return dispatcher.useState(initState);
}

export function useReducer(reducer, initalArgs, init) {
	const dispatcher = resolveDispatcher();
	return dispatcher.useReducer(reducer, initalArgs, init);
}

export function useEffect(create, inputs) {
	const dispatcher = resolveDispatcher();
	return dispatcher.useEffect(create, inputs);
}
