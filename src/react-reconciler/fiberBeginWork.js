import { NoWork, Never } from './expirationTime';
import {
	FunctionComponent,
	IndeterminateComponent,
	ClassComponent,
	HostRoot,
	HostComponent,
	HostText,
	Fragment,
} from '../shared/ReactWorkTags';
import { disableLegacyContext } from '../shared/ReactFeatureFlags';
import { resolveDefaultProps } from './fiberLazyComponent';
import { PerformedWork, ContentReset } from '../shared/ReactSideEffectTags';
import { renderWithHooks } from './fiberHooks';
import { processUpdateQueue } from './updateQueue';
import { reconcileChildFibers, mountChildFibers, cloneChildFibers } from './childFiber';
import { ConcurrentMode } from '../shared/ReactTypeOfMode';
import { shouldSetTextContent } from './ReactDOMHostConfig';
import { pushHostContainer } from './fiberHostContext';

let didReceiveUpdate = false;

// function pushHostRootContext(workInProgress) {
//     const root = workInProgress.stateNode
//     if (root.pendingContext) {
//         pushTopLevelContextObject(
//             workInProgress,
//             root.pendingContext,
//             root.pendingContext !== root.context
//         )
//     } else if (root.context) {
//         pushTopLevelContextObject(workInProgress, root.context, false);
//     }
//     pushHostContainer(workInProgress, root.containerInfo)
// }

function markRef(current, workInProgress) {
	const ref = workInProgress.ref;
	if (
		(current === null && ref !== null) ||
		(current !== null && current.ref !== ref)
	) {
		// Schedule a Ref effect
		workInProgress.effectTag |= Ref;
	}
}

function updateHostComponent(current, workInProgress, renderExpirationTime) {
	// context
	const type = workInProgress.type;
	const nextProps = workInProgress.pendingProps;
	const prevProps = current !== null ? current.memoizedProps : null;

	let nextChildren = nextProps.children;

	const isDirectTextChild = shouldSetTextContent(type, nextProps);
	if (isDirectTextChild) {
		nextChildren = null;
	} else if (prevProps !== null && shouldSetTextContent(type, prevProps)) {
		workInProgress.effectTag |= ContentReset;
	}

	if (
		workInProgress.mode & ConcurrentMode &&
		renderExpirationTime !== Never
	) {
		// TODO
	}
	markRef(current, workInProgress);
	reconcileChildren(
		current,
		workInProgress,
		nextChildren,
		renderExpirationTime,
	);

	return workInProgress.child;
}

export function mountIndeterminateComponent(
	_current,
	workInProgress,
	Component,
	renderExpirationTime,
) {
	if (_current !== null) {
		// TODO
	}

	const props = workInProgress.pendingProps;

	// TODO context
	let context;

	let value;

	value = renderWithHooks(
		null,
		workInProgress,
		Component,
		props,
		context,
		renderExpirationTime,
	);

	workInProgress.effectTag |= PerformedWork;

	if (
		typeof value === 'object' &&
		value !== null &&
		typeof value.render === 'function' &&
		value.$$typeof === undefined
	) {
		// TODO
	} else {
		workInProgress.tag = FunctionComponent;
		reconcileChildren(null, workInProgress, value, renderExpirationTime);
	}

	return workInProgress.child;
}

export function reconcileChildren(
	current,
	workInProgress,
	nextChildren,
	renderExpirationTime,
) {
	if (current === null) {
		// TODO
		// 创建fiber
		workInProgress.child = mountChildFibers(
			workInProgress,
			null,
			nextChildren,
			renderExpirationTime,
		);
	} else {
		workInProgress.child = reconcileChildFibers(
			workInProgress,
			current.child,
			nextChildren,
			renderExpirationTime,
		);
	}
}

function pushHostRootContext(workInProgress) {
	const root = workInProgress.stateNode;
	if (root.pendingContext) {
		// TODO
	} else if (root.context) {
		// TODO
	}
	pushHostContainer(workInProgress, root.containerInfo);
}

function updateHostRoot(current, workInProgress, renderExpirationTime) {
	// TODO 将root的上下文推入
	pushHostRootContext(workInProgress);
	const updateQueue = workInProgress.updateQueue;
	const nextProps = workInProgress.pendingProps;
	const prevState = workInProgress.memoizedState;
	const pervChildren = prevState !== null ? prevState.element : null;
	processUpdateQueue(
		workInProgress,
		updateQueue,
		nextProps,
		null,
		renderExpirationTime,
	);
	const nextState = workInProgress.memoizedState;
	const nextChildren = nextState.element;

	if (nextChildren === pervChildren) {
		// 没有工作要做
	}
	const root = current.stateNode;
	if ((current === null || current.child === null) && root.hydrate && false) {
		// TODO
	} else {
		reconcileChildren(
			current,
			workInProgress,
			nextChildren,
			renderExpirationTime,
		);
	}
	return workInProgress.child;
}

function bailoutOnAlreadyFinishedWork(
	current,
	workInProgress,
	renderExpirationTime,
) {
    if (current !== null) {
        workInProgress.dependencies = current.dependencies
    }

    const childExpirationTime = workInProgress.childExpirationTime
    if (childExpirationTime < renderExpirationTime) {
        return null
    } else {
        cloneChildFibers(current, workInProgress);
        return workInProgress.child
    }
}

function updateFunctionComponent(
	current,
	workInProgress,
	Component,
	nextProps,
	renderExpirationTime,
) {
	if (!disableLegacyContext) {
		// TODO
	}

	let nextChildren = renderWithHooks(
		current,
		workInProgress,
		Component,
        // context,
        {},
		renderExpirationTime,
	);
	if (current !== null && !didReceiveUpdate) {
		// TODO
	}

	workInProgress.effectTag |= PerformedWork;
	reconcileChildren(
		current,
		workInProgress,
		nextChildren,
		renderExpirationTime,
	);
	return workInProgress.child;
}

export function markWorkInProgressReceivedUpdate() {
	didReceiveUpdate = true;
}

export function beginWork(current, workInProgress, renderExpirationTime) {
	const updateExpirationTime = workInProgress.expirationTime;

	if (current !== null) {
		const oldProps = current.memoizedProps;
		const newProps = workInProgress.pendingProps;
		if (oldProps !== newProps) {
			didReceiveUpdate = true;
		} else if (updateExpirationTime < renderExpirationTime) {
			didReceiveUpdate = false;

			// 这个fiber 没有正在进行的工作 释放不需要进入开始阶段。在这个优化的分支 仍然有一些统计工作;把xx推入堆栈中
			switch (workInProgress.tag) {
				case HostRoot: {
					// TOOD
                }
                case HostComponent: {
                    // TODO
                }
			}
			return bailoutOnAlreadyFinishedWork(
				current,
				workInProgress,
				renderExpirationTime,
			);
		}
	} else {
		didReceiveUpdate = false;
	}

	// 在进入begin 阶段之前 清空 过期时间
	workInProgress.expirationTime = NoWork;
	switch (workInProgress.tag) {
		case FunctionComponent: {
			const Component = workInProgress.type;
			const unresolvedProps = workInProgress.pendingProps;
			const resolvedProps =
				workInProgress.elementType === Component
					? unresolvedProps
					: resolveDefaultProps(Component, unresolvedProps);
			return updateFunctionComponent(
				current,
				workInProgress,
				Component,
				resolvedProps,
				renderExpirationTime,
			);
		}
		case HostRoot: {
			return updateHostRoot(
				current,
				workInProgress,
				renderExpirationTime,
			);
		}
		case IndeterminateComponent: {
			return mountIndeterminateComponent(
				current,
				workInProgress,
				workInProgress.type,
				renderExpirationTime,
			);
		}
		case HostComponent: {
			return updateHostComponent(
				current,
				workInProgress,
				renderExpirationTime,
			);
		}
	}
	return null;
}
