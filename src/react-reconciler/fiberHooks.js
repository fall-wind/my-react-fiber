import ReactSharedInternals from '../shared/ReactSharedInternals';
import { NoWork } from './expirationTime';

const { ReactCurrentDispatcher } = ReactSharedInternals;
let didScheduleRenderPhaseUpdate = false;

let renderExpirationTime = NoWork;
let currentlyRenderingFiber = null;

let currentHook = null
let nextCurrentHook = null;
let workInProgressHook = null;
let firstWorkInProgressHook = null;
let nextWorkInProgressHook = null;

let remainingExpirationTime = NoWork;
let componentUpdateQueue = null;
let sideEffectTag = 0;

function throwInvalidHookError() {
	console.error(
		'Invalid hook call. Hooks can only be called inside of the body of a function component',
	);
}

function readContext() {}

export function renderWithHooks(
	current,
	workInProgress,
	Component,
	props,
	refOrContext,
	nextRenderExpirationTime,
) {
	renderExpirationTime = nextRenderExpirationTime;
	currentlyRenderingFiber = workInProgress;
	nextCurrentHook = current !== null ? current.memoizedState : null;

    // TODO
	// ReactCurrentDispatcher.current =
	// 	nextCurrentHook === null
	// 		? HooksDispatcherOnMount
	// 		: HooksDispatcherOnUpdate;

	let children = Component(props, refOrContext);

	if (didScheduleRenderPhaseUpdate) {
		// TODO
	}
	ReactCurrentDispatcher.current = ContextOnlyDispatcher;
	const renderedWork = currentlyRenderingFiber;

	renderedWork.memoizedState = firstWorkInProgressHook;
	renderedWork.expirationTime = remainingExpirationTime;
	renderedWork.updateQueue = componentUpdateQueue;
	renderedWork.effectTag |= sideEffectTag;

	renderExpirationTime = NoWork;
	currentlyRenderingFiber = null;

	currentHook = null;
	nextCurrentHook = null;
	firstWorkInProgressHook = null;
	workInProgressHook = null;
	nextWorkInProgressHook = null;

	remainingExpirationTime = NoWork;
	componentUpdateQueue = null;
    sideEffectTag = 0;
    
    return children;
}

export const ContextOnlyDispatcher = {
	readContext,

	useCallback: throwInvalidHookError,
	useContext: throwInvalidHookError,
	useEffect: throwInvalidHookError,
	useImperativeHandle: throwInvalidHookError,
	useLayoutEffect: throwInvalidHookError,
	useMemo: throwInvalidHookError,
	useReducer: throwInvalidHookError,
	useRef: throwInvalidHookError,
	useState: throwInvalidHookError,
	useDebugValue: throwInvalidHookError,
	useResponder: throwInvalidHookError,
};
