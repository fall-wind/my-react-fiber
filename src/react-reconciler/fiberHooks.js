import ReactSharedInternals from '../shared/ReactSharedInternals';
import {
	Update as UpdateEffect,
    Passive as PassiveEffect,
    NoEffect as NoHookEffect,
} from '../shared/ReactSideEffectTags';
import { NoWork } from './expirationTime';
import {
	requestCurrentTime,
	computeExpirationForFiber,
	scheduleWork,
} from './ReactFiberWorkLoop';
import { markWorkInProgressReceivedUpdate } from './fiberBeginWork';
import { UnmountPassive, MountPassive } from './ReactHookEffectTags';

const { ReactCurrentDispatcher } = ReactSharedInternals;
let didScheduleRenderPhaseUpdate = false;

let renderExpirationTime = NoWork;
let currentlyRenderingFiber = null;
let renderPhaseUpdates = null;

let currentHook = null;
let nextCurrentHook = null;
let workInProgressHook = null;
let firstWorkInProgressHook = null;
let nextWorkInProgressHook = null;

let remainingExpirationTime = NoWork;
let componentUpdateQueue = null;
let sideEffectTag = 0;

let numberOfReRenders = 0;

function is(x, y) {
	return (
		(x === y && (x !== 0 || 1 / x === 1 / y)) || (x !== x && y !== y) // eslint-disable-line no-self-compare
	);
}

function throwInvalidHookError() {
	console.error(
		'Invalid hook call. Hooks can only be called inside of the body of a function component',
	);
}

function readContext() {}

function mountWorkInProgressHook() {
	const hook = {
		memoizedState: null,
		baseState: null,
		queue: null,
		baseUpdate: null,

		next: null,
	};

	if (workInProgressHook === null) {
		firstWorkInProgressHook = workInProgressHook = hook;
	} else {
		// Append to the end of the list
		workInProgressHook = workInProgressHook.next = hook;
	}
	return workInProgressHook;
}

function basicStateReducer(state, action) {
	return typeof action === 'function' ? action(state) : action;
}

function dispatchAction(fiber, queue, action) {
	const alternate = fiber.alternate;
	if (
		fiber === currentlyRenderingFiber ||
		(alternate !== null && alternate === currentlyRenderingFiber)
	) {
		didScheduleRenderPhaseUpdate = true;
		const update = {
			expirationTime: renderExpirationTime,
			suspenseConfig: null,
			action,
			eagerReducer: null,
			eagerState: null,
			next: null,
		};

		if (renderPhaseUpdates) {
			renderPhaseUpdates = new Map();
		}

		const firstRenderPhaseUpdate = renderPhaseUpdates.get(queue);

		if (firstRenderPhaseUpdate === undefined) {
			renderPhaseUpdates.set(queue, update);
		} else {
			let lastRenderPhaseUpdate = firstRenderPhaseUpdate;
			while (lastRenderPhaseUpdate.next !== null) {
				lastRenderPhaseUpdate = lastRenderPhaseUpdate.next;
			}
			lastRenderPhaseUpdate.next = update;
		}
	} else {
		const currentTime = requestCurrentTime();
		const suspenseConfig = {};
		const expirationTime = computeExpirationForFiber(
			currentTime,
			fiber,
			suspenseConfig,
		);

		const update = {
			expirationTime,
			suspenseConfig,
			action,
			eagerReducer: null,
			eagerState: null,
			next: null,
		};

		const last = queue.last;

		if (last === null) {
			update.next = update;
		} else {
			const first = last.next;
			if (fiber !== null) {
				update.next = first;
			}
			last.next = update;
		}
		queue.last = update;

		if (
			fiber.expirationTime === NoWork &&
			(alternate === null || alternate.expirationTime === NoWork)
		) {
			// fiber.expirationTime = expirationTime
			const lastRenderedReducer = queue.lastRenderedReducer;
			if (lastRenderedReducer !== null) {
				try {
					const currentState = queue.lastRenderedState;
					const eagerState = lastRenderedReducer(
						currentState,
						action,
					);

					update.eagerReducer = lastRenderedReducer;
					update.eagerState = eagerState;
					if (is(eagerState, currentState)) {
						return;
					}
				} catch (error) {
					//
				} finally {
					// dev code
				}
			}
		}
		scheduleWork(fiber, expirationTime);
	}
}

function mountState(initialState) {
	const hook = mountWorkInProgressHook();
	if (typeof initialState === 'function') {
		initialState = initialState();
	}
	hook.memoizedState = hook.baseState = initialState;
	const queue = (hook.queue = {
		last: null,
		dispatch: null,
		lastRenderedReducer: basicStateReducer,
		lastRenderedState: initialState,
	});

	const dispatch = (queue.dispatch = dispatchAction.bind(
		null,
		currentlyRenderingFiber,
		queue,
	));

	return [hook.memoizedState, dispatch];
}

function updateWorkInProgressHook() {
	if (nextWorkInProgressHook !== null) {
		workInProgressHook = nextWorkInProgressHook;
		nextWorkInProgressHook = workInProgressHook.next;

		currentHook = nextCurrentHook;

		nextCurrentHook = currentHook !== null ? currentHook.next : null;
	} else {
		currentHook = nextCurrentHook;

		const newHook = {
			memoizedState: currentHook.memoizedState,

			baseState: currentHook.baseState,
			queue: currentHook.queue,
			baseUpdate: currentHook.baseUpdate,

			next: null,
		};

		if (workInProgressHook === null) {
			workInProgressHook = firstWorkInProgressHook = newHook;
		} else {
			workInProgressHook = workInProgressHook.next = newHook;
		}
		nextCurrentHook = currentHook.next;
	}
	return workInProgressHook;
}

function updateReducer(reducer, initialArg, init) {
	const hook = updateWorkInProgressHook();
	const queue = hook.queue;

	queue.lastRenderedReducer = reducer;

	if (numberOfReRenders > 0) {
		// TODO
	}
	const last = queue.last;

	const baseUpdate = hook.baseUpdate;
	const baseState = hook.baseState;

	let first;

	if (baseUpdate !== null) {
		// TOOD
		if (last !== null) {
			last.next = null;
		}
		first = baseUpdate.next;
	} else {
		first = last !== null ? last.next : null;
	}

	if (first !== null) {
		let newState = baseState;
		let newBaseState = null;
		let newBaseUpdate = null;
		let pervUpdate = baseUpdate;
		let update = first;
		let didSkip = false;

		do {
			const updateExpirationTime = update.expirationTime;
			if (updateExpirationTime < renderExpirationTime) {
				// TODO
			} else {
				// TODO

				// markRenderEventTimeAndConfig(
				// 	updateExpirationTime,
				// 	update.suspenseConfig,
				// );
				if (update.eagerReducer === reducer) {
					newState = update.eagerReducer;
				} else {
					const action = update.action;
					newState = reducer(newState, action);
				}
			}
			pervUpdate = update;
			update = update.next;
		} while (update !== null && update !== first);

		if (!didSkip) {
			newBaseUpdate = pervUpdate;
			newBaseState = newState;
		}

		if (!is(newState, hook.memoizedState)) {
			markWorkInProgressReceivedUpdate();
		}

		hook.memoizedState = newState;
		hook.baseUpdate = newBaseUpdate;
		hook.baseState = newBaseState;

		queue.lastRenderedState = newState;
	}

	const dispatch = queue.dispatch;

	return [hook.memoizedState, dispatch];
}

function updateState(initialState) {
	return updateReducer(basicStateReducer, initialState);
}

function createFunctionComponentUpdateQueue() {
	return {
		lastEffect: null,
	};
}

function pushEffect(tag, create, destroy, deps) {
	const effect = {
		tag,
		create,
		destroy,
		deps,
		next: null,
	};

	if (componentUpdateQueue === null) {
		componentUpdateQueue = createFunctionComponentUpdateQueue();
		componentUpdateQueue.lastEffect = effect.next = effect;
	} else {
		const lastEffect = componentUpdateQueue.lastEffect;
		if (lastEffect === null) {
			componentUpdateQueue.lastEffect = effect.next = effect;
		} else {
			// 插入effect
			const firstEffect = lastEffect.next;
			lastEffect.next = effect;
			effect.next = firstEffect;
			componentUpdateQueue.lastEffect = effect;
		}
	}
	return effect;
}

function mountEffectImpl(fiberEffectTag, hookEffectTag, create, deps) {
	const hook = mountWorkInProgressHook();
	const nextDeps = deps === undefined ? null : deps;

	sideEffectTag |= fiberEffectTag;
	hook.memoizedState = pushEffect(hookEffectTag, create, undefined, nextDeps);
}

function mountEffect(create, deps) {
	return mountEffectImpl(
		UpdateEffect | PassiveEffect,
		UnmountPassive | MountPassive,
		create,
		deps,
	);
}

function areHookInputsEqual(nextDeps, prevDeps) {
	if (prevDeps === null) {
		return false;
	}

	for (let i = 0; i < prevDeps.length && i < nextDeps.length; i++) {
		if (is(nextDeps[i], prevDeps[i])) {
			continue;
		}
		return false;
	}
	return true;
}

function updateEffectImpl(fiberEffectTag, hookEffectTag, create, deps) {
	const hook = updateWorkInProgressHook();
	const nextDeps = deps === undefined ? null : deps;

	let destroy = undefined;

	if (currentHook !== null) {
		const prevEffect = currentHook.memoizedState;
		destroy = prevEffect.destroy;
		if (nextDeps !== null) {
			const prevDeps = prevEffect.deps;
			if (areHookInputsEqual(nextDeps, prevDeps)) {
				pushEffect(NoHookEffect, create, destroy, nextDeps);
				return;
			}
		}
	}

	sideEffectTag |= fiberEffectTag;
	hook.memoizedState = pushEffect(hookEffectTag, create, destroy, nextDeps);
}

function updateEffect(create, deps) {
	return updateEffectImpl(
		UpdateEffect | PassiveEffect,
		UnmountPassive | MountPassive,
		create,
		deps,
	);
}

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

	// console.error(nextCurrentHook, 'nextCurrentHook')

	if (didScheduleRenderPhaseUpdate) {
		// TODO
	}
	ReactCurrentDispatcher.current =
		nextCurrentHook === null
			? HooksDispatcherOnMount
			: HooksDispatcherOnUpdate;

	let children = Component(props, refOrContext);
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

const HooksDispatcherOnMount = {
	readContext,
	useState: mountState,
	useEffect: mountEffect,
};

const HooksDispatcherOnUpdate = {
	readContext,
	useState: updateState,
	useEffect: updateEffect,
};
