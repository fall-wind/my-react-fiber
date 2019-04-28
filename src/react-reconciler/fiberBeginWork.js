import { NoWork } from './expirationTime';
import { cloneChildFiber } from './childFiber';
import { processUpdateQueue } from './updateQueue';
import {
	FunctionComponent,
	ClassComponent,
	HostRoot,
	HostComponent,
	HostText,
} from './workTags.js';

let didReceiveUpdate = false;

function bailoutOnAlreadyFinishedWork(
	current,
	workInProgress,
	renderExpirationTime,
) {
	if (current !== null) {
		// 重用之前的context list
		workInProgress.contextDependencies = current.contextDependencies;
	}

	const childExpirationTime = workInProgress.childExpirationTime;
	// 检测child是否有正在进行的work
	if (childExpirationTime < renderExpirationTime) {
		// child没有工作 跳过
		return null;
	} else {
		// 这个fiber没有work 但是他的子树有 克隆fiber 继续向下
		cloneChildFibers(current, workInProgress);
		return workInProgress.child;
	}
}

function reconcileChildren(
    current,
    workInProgress,
    nextChildren,
    renderExpirationTime,
) {
    // 如果是一个没有被渲染过的全新的组件 我们不会通过最小的side-effect更新他的child；
    // 我们会在渲染之前把他们一起添加到child上？？？
    // 这意味着我们可以优化这个调和 通过不追踪side-effect
    if (current === null) {
        workInProgress.child = mountChildFibers(
            workInProgress,
            null,
            nextChildren,
            renderExpirationTime,
        )
    } else {
        // 如果当前的child和work in progress相同 这意为这我们还没做为这些子组件做过任何work。
        // 因此我们使用clone算法去创建所有current children的一个复制

        // 如果有正在整形的work 那这个是无效的 所以将他们丢弃
        workInProgress.child = reconcileChildFibers(
            workInProgress,
            current.child,
            nextChildren,
            renderExpirationTime
        )
    }
}

function updateHostRoot(current, workInProgress, renderExpirationTime) {
    // TODO context
    // pushHostRootContext(workInProgress);

	const updateQueue = workInProgress.updateQueue;
	const nextProps = workInProgress.pendingProps;
	const prevState = workInProgress.memoizedState;
	const prevChildren = prevState !== null ? prevState.element : null;
	processUpdateQueue(
		workInProgress,
		updateQueue,
		nextProps,
		null,
		renderExpirationTime,
	);

	const nextState = workInProgress.memoizedState;
	const nextChildren = nextState.element;
	// 相同
	if (nextChildren === prevChildren) {
		// state相同 这是一个 bailout
		return bailoutOnAlreadyFinishedWork(
			current,
			workInProgress,
			renderExpirationTime,
		);
    }

    // TODO 什么操作会出现不相同？ 与hydrate相关吗？
    
	const root = workInProgress.stateNode;
	if ((current === null || current.child === null) && root.hydrate) {
        // TODO 与 hydrate
	} else {
        reconcileChildren(
            current,
            workInProgress,
            nextChildren,
            renderExpirationTime,
        )
    }
    return workInProgress.child;
}

// 第一次渲染 使用默认的props
function resolveDefaultProps(Component, baseProps) {
	if (Component && Component.defaultProps) {
		const props = Object.assign({}, baseProps);
		for (let propName in defaultProps) {
			if (props[propName] === undefined) {
				props[propName] = defaultProps[propName];
			}
		}
		return props;
	}
	return baseProps;
}

export function beginWork(current, workInProgress, renderExpirationTime) {
	const updateExpirationTime = workInProgress.expirationTime;
	// 更新
	if (current !== null) {
		const oldProps = current.memoizedProps;
		const newProps = workInProgress.pendingProps;
		// 状态更新
		if (oldProps !== newProps) {
			// TODO
		}
	} else {
		didReceiveUpdate = false;
	}

	// 在进入到开始阶段时 清空到期时间
	workInProgress.expirationTime = NoWork;

	switch (workInProgress.tag) {
		case FunctionComponent: {
			const Component = workInProgress.type;
			const unresolvedProps = workInProgress.pendingProps;
			// 初次要加上defaultProps
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
		default:
			break;
	}
}
