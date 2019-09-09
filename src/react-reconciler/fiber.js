import { HostRoot, IndeterminateComponent, ClassComponent } from './workTags';
import { ConcurrentRoot, BatchedRoot } from '../shared/ReactRootTags';
import { HostComponent, HostText } from '../shared/ReactWorkTags';
import { NoMode } from '../shared/ReactTypeOfMode';
import { NoWork } from './expirationTime';
import { NoEffect } from '../shared/ReactSideEffectTags';

function shouldConstruct(Component) {
	const prototype = Component.prototype;
	return !!(prototype && prototype.isReactComponent);
}

function FiberNode(tag, pendingProps, key, mode) {
	// Instance
	this.tag = tag;
	this.key = key;
	this.elementType = null;
	this.type = null;
	this.stateNode = null;

	// Fiber
	this.return = null;
	this.child = null;
	this.sibling = null;
	this.index = 0;

	this.ref = null;

	this.pendingProps = pendingProps;
	this.memoizedProps = null;
	this.updateQueue = null;
	this.memoizedState = null;
	this.dependencies = null;

	this.mode = mode;

	// Effects
	this.effectTag = NoEffect;
	this.nextEffect = null;

	this.firstEffect = null;
	this.lastEffect = null;

	this.expirationTime = NoWork;
	this.childExpirationTime = NoWork;

	this.alternate = null;
}

function createFiber(tag, pendingProps, key, mode) {
	return new FiberNode(tag, pendingProps, key, mode);
}

export function createHostRootFiber(tag) {
	let mode;
	if (tag === ConcurrentRoot) {
		mode = ConcurrentMode | BatchedMode | StrictMode;
	} else if (tag === BatchedRoot) {
		mode = BatchedMode | StrictMode;
	} else {
		mode = NoMode;
	}
	return createFiber(HostRoot, null, null, mode);
}

export function createWorkInProgress(current, pendingProps, expirationTime) {
	let workInProgress = current.alternate;
	if (workInProgress === null) {
		// We use a double buffering pooling technique because we know that we'll
		// only ever need at most two versions of a tree. We pool the "other" unused
		// node that we're free to reuse. This is lazily created to avoid allocating
		// extra objects for things that are never updated. It also allow us to
		// reclaim the extra memory if needed.
		workInProgress = createFiber(
			current.tag,
			pendingProps,
			current.key,
			current.mode,
		);
		workInProgress.elementType = current.elementType;
		workInProgress.type = current.type;
		workInProgress.stateNode = current.stateNode;

		workInProgress.alternate = current;
		current.alternate = workInProgress;
	} else {
		workInProgress.pendingProps = pendingProps;

		// We already have an alternate.
		// Reset the effect tag.
		workInProgress.effectTag = NoEffect;

		// The effect list is no longer valid.
		workInProgress.nextEffect = null;
		workInProgress.firstEffect = null;
		workInProgress.lastEffect = null;

		// if (enableProfilerTimer) {
		// 	// We intentionally reset, rather than copy, actualDuration & actualStartTime.
		// 	// This prevents time from endlessly accumulating in new commits.
		// 	// This has the downside of resetting values for different priority renders,
		// 	// But works for yielding (the common case) and should support resuming.
		// 	workInProgress.actualDuration = 0;
		// 	workInProgress.actualStartTime = -1;
		// }
	}

	workInProgress.childExpirationTime = current.childExpirationTime;
	workInProgress.expirationTime = current.expirationTime;

	workInProgress.child = current.child;
	workInProgress.memoizedProps = current.memoizedProps;
	workInProgress.memoizedState = current.memoizedState;
	workInProgress.updateQueue = current.updateQueue;

	// Clone the dependencies object. This is mutated during the render phase, so
	// it cannot be shared with the current fiber.
	const currentDependencies = current.dependencies;
	workInProgress.dependencies =
		currentDependencies === null
			? null
			: {
					expirationTime: currentDependencies.expirationTime,
					firstContext: currentDependencies.firstContext,
					responders: currentDependencies.responders,
			  };

	// These will be overridden during the parent's reconciliation
	workInProgress.sibling = current.sibling;
	workInProgress.index = current.index;
	workInProgress.ref = current.ref;

	return workInProgress;
}

function createFiberFromTypeAndProps(
	type,
	key,
	pendingProps,
	owner,
	mode,
	expirationTime,
) {
	let fiber;
	let fiberTag = IndeterminateComponent;
	let resolvedType = type;
	if (typeof type === 'function') {
		if (shouldConstruct(type)) {
			fiberTag = ClassComponent;
		}
	} else if (typeof type === 'string') {
		fiberTag = HostComponent;
	} else {
		// TODO
	}

	fiber = createFiber(fiberTag, pendingProps, key, mode);
	fiber.elementType = type;
	fiber.type = resolvedType;
	fiber.expirationTime = expirationTime;
	return fiber;
}

export function createFiberFromElement(element, mode, expirationTime) {
	let owner = null;
	const type = element.type;
	const key = element.key;
	const pendingProps = element.props;
	const fiber = createFiberFromTypeAndProps(
		type,
		key,
		pendingProps,
		owner,
		mode,
		expirationTime,
	);

	return fiber;
}

export function createFiberFromFragment(elements, mode, expirationTime, key) {
	const fiber = createFiber(Fragment, elements, key, mode);
	fiber.expirationTime = expirationTime;
	return fiber;
}

export function createFiberFromText(content, mode, expirationTime) {
	const fiber = createFiber(HostText, content, null, mode);
	fiber.expirationTime = expirationTime;
	return fiber;
}
