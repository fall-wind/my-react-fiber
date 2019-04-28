import {
	msToExpirationTime,
	computeAsyncExpiration,
	NoWork,
	Sync,
	Never,
} from './expirationTime';
import { HostRoot } from './workTags';
import { ConcurrentMode } from './workTags';
import { markPendingPriorityLevel } from './pendingPriority';
import ReactCurrentDispatcher from './currentDispatcher';
import ReactCurrentOwner from './currentOwner';
import { ContextOnlyDispatcher } from './fiberHooks';
import { createWorkInProgress } from './fiber'

const now = Date.now;

let isBatchingUpdates = false;
let isUnbatchingUpdates = false;

// Working Phase
const NotWorking = 0;
const BatchedPhase = 1;
const LegacyUnbatchedPhase = 2;
const FlushSyncPhase = 3;
const RenderPhase = 4;
const CommitPhase = 5;

let renderExpirationTime = NoWork;
let workInProgressRoot = null;
let nextRoot = null;
let nextFlushedRoot = null;

let nextRenderExpirationTime = NoWork;
let nextFlushedExpirationTime = NoWork;

let workPhase = NotWorking;
let initialTimeMs = now();
let currentEventTime = NoWork;

let nextUnitOfWork = null
//
let expirationContext = NoWork;

let originalStartTimeMs = now();
let currentScheduleTime = msToExpirationTime(originalStartTimeMs);

let firstScheduledRoot = null;
let lastScheduledRoot = null;

let isWorking = false;
let isCommitting = false;

/**
 * 找到最高优先级的root： nextFlushedRoot 并将优先级NoWork的任务移除
 * 最高优先级的expirationTimes highestPriorityWork
 */
function findHighestPriorityRoot() {
	let highestPriorityWork = NoWork;
	let highestPriorityRoot = null;

	if (lastScheduledRoot !== null) {
		let previousScheduledRoot = lastScheduledRoot;
		let root = firstScheduledRoot;
		while (root !== null) {
			const remainingExpirationTime = root.expirationTime;
			// 这个 root 没有需要做的工作 移除它
			if (remainingExpirationTime === NoWork) {
				if (root === root.nextScheduledRoot) {
					// This is the only root in the list.
					root.nextScheduledRoot = null;
					firstScheduledRoot = lastScheduledRoot = null;
					break;
				} else if (root === firstScheduledRoot) {
					// This is the first root in the list.
					const next = root.nextScheduledRoot;
					firstScheduledRoot = next;
					lastScheduledRoot.nextScheduledRoot = next;
					root.nextScheduledRoot = null;
				} else if (root === lastScheduledRoot) {
					// This is the last root in the list.
					lastScheduledRoot = previousScheduledRoot;
					lastScheduledRoot.nextScheduledRoot = firstScheduledRoot;
					root.nextScheduledRoot = null;
					break;
				} else {
					previousScheduledRoot.nextScheduledRoot =
						root.nextScheduledRoot;
					root.nextScheduledRoot = null;
				}
				root = previousScheduledRoot.nextScheduledRoot;
			} else {
				// 遍历更新过期时间
				if (remainingExpirationTime > highestPriorityWork) {
					// Update the priority, if it's higher
					highestPriorityWork = remainingExpirationTime;
					highestPriorityRoot = root;
				}
				if (root === lastScheduledRoot) {
					break;
				}
				if (highestPriorityWork === Sync) {
					// Sync is highest priority by definition so
					// we can stop searching.
					break;
				}
				previousScheduledRoot = root;
				root = root.nextScheduledRoot;
			}
		}
	}

	nextFlushedRoot = highestPriorityRoot;
	nextFlushedExpirationTime = highestPriorityWork;
}

function recomputeCurrentRendererTime() {
	const currentTimeMs = now() - originalStartTimeMs;
	currentRendererTime = msToExpirationTime(currentTimeMs);
}

export function requestCurrentTime() {
	// requestCurrentTime被 scheduler调用是为了计算expirationTime；

	// 过期时间是通过传入当前时间计算的。然而，如果两个更新在相同的事件内 我们应当把他们当成相应的时间对待 即使他们的物理时间不同

	// 换句话

	// 我们跟踪俩个独立的时间 当前的渲染时间和当前的调度时间。
	// 渲染时间任何时候都可能更新；
	// 调度时间只有在没有任何work进行中可以更新，或者我们确定这不处于一个事件回调中

	if (isRendering) {
		return currentScheduleTime;
	}
	// 检查是否有正在进行的work
	findHighestPriorityRoot();

	if (
		nextFlushedExpirationTime === NoWork ||
		nextFlushedExpirationTime === Never
	) {
		// 当前没正在进行的work 或者正在进行的工作时‘屏幕上不显示的’ 我们可以读取当前的时间
		recomputeCurrentRendererTime();
		currentSchedulerTime = currentRendererTime;
		return currentSchedulerTime;
	}
	// 已经存在一个更新 不过我们可能在一个浏览器的事件回调中；如果我们读取当前的时间 可能引起在同一个事件中接收到不同的过期时间
	// 以至于引起了多次更新，引起混乱。返回上一次读到的时间。在下一次空闲回调 这个时间将被更新
	return currentSchedulerTime;
}

export function computeExpirationForFiber(currentTime, fiber) {
	// 同步更新
	// 到目前为止React没有默认开启异步渲染
	return Sync;
	// TODO
	let expirationTime = null;
	if (expirationContext !== NoWork) {
		// 显示的上下文时间设置
		expirationTime = expirationContext;
	} else if (isWorking) {
		if (isCommitting) {
			// 更新发生在commit阶段 默认拥有同步的优先级
			expirationTime = Sync; // 最高的优先级
		} else {
			// 发生在render阶段的更新应该和正在rendered的work拥有相同的过期时间
			expirationTime = nextRenderExpirationTime;
		}
	} else {
		// 没有显示被设置过期时间的上下文，当前有没有执行work，重新计算过期时间
		if (fiber.mode & ConcurrentMode) {
			// TODO
		} else {
			expirationTime = Sync;
		}
	}
}

// export function computeExpirationForFiber(currentTime, fiber) {
// 	if (workPhase === RenderPhase) {
// 		return renderExpirationTime;
// 	}
// 	let expirationTime;
// 	// 省略其他代码
// 	expirationTime = computeAsyncExpiration(currentTime);
// 	if (
// 		workInProgressRoot !== null &&
// 		expirationTime === renderExpirationTime
// 	) {
// 		expirationTime -= 1;
// 	}
// 	return expirationTime;
// }

// TODO
export function unbatchedUpdates(fn) {
	return fn(a);
	// if (workPhase !== BatchedPhase && workPhase !== FlushSyncPhase) {
	// 	// We're not inside batchedUpdates or flushSync, so unbatchedUpdates is
	// 	// a no-op.
	// 	return fn(a);
	// }
	// const prevWorkPhase = workPhase;
	// workPhase = LegacyUnbatchedPhase;
	// try {
	// 	return fn(a);
	// } finally {
	// 	workPhase = prevWorkPhase;
	// }
}

/**
 *  用正在进行的work 标记fiber
 */
function markUpdateTimeFromFiberToRoot(fiber, expirationTime) {
	// 更新fiber的过期时间 time越大 说明优先级越高
	if (fiber.expirationTime < expirationTime) {
		fiber.expirationTime = expirationTime;
	}
	// 同时更新 work In Process 的expiration Time
	if (
		fiber.alternate !== null &&
		fiber.alternate.expirationTime < expirationTime
	) {
		fiber.alternate.expirationTime = expirationTime;
	}

	// 从当前fiber向上更新父fiber的childExpirationTime
	let node = fiber.return;
	let root = null;
	if (node === null) {
		root = node.stateNode;
	} else {
		while (node !== null) {
			// 更新fiber 与 alternate上的 childExpirationTime
			alternate = node.alternate;
			if (node.childExpirationTime < expirationTime) {
				node.childExpirationTime = expirationTime;
				if (
					alternate !== null &&
					alternate.childExpirationTime < expirationTime
				) {
					alternate.childExpirationTime = expirationTime;
				}
			} else if (
				alternate !== null &&
				alternate.childExpirationTime < expirationTime
			) {
				alternate.childExpirationTime = expirationTime;
			}

			if (node.return === null && node.tag === HostRoot) {
				root = node.stateNode;
				break;
			}
			node = node.return;
		}
	}

	if (root !== null) {
		// Update the first and last pending expiration times in this root
		const firstPendingTime = root.firstPendingTime;
		if (expirationTime > firstPendingTime) {
			root.firstPendingTime = expirationTime;
		}
		const lastPendingTime = root.lastPendingTime;
		// lastPendingTime为什么取最小值？ 上一次更新的过期时间
		if (lastPendingTime === NoWork || expirationTime < lastPendingTime) {
			root.lastPendingTime = expirationTime;
		}
	}
	return root;
}

// 更新过期时间 以及向上更新fiber的childExpirationTime
function scheduleWorkToRoot(fiber, expirationTime) {
	if (fiber.expirationTime < expirationTime) {
		fiber.expirationTime = expirationTime;
	}
	let alternate = fiber.alternate;
	if (alternate !== null && alternate.expirationTime < expirationTime) {
		alternate.expirationTime = expirationTime;
	}
	// 是不是感觉上述代码很熟悉 不就是设置 current和alternate上的过期时间吗？

	// 向上更新fiber树上的childExpirationTime
	let node = fiber.return;
	let root = null;
	if (node === null && fiber.tag === HostRoot) {
		root = node.stateNode;
	} else {
		while (node !== null) {
			alternate = node.alternate;
			if (node.childExpirationTime < expirationTime) {
				node.childExpirationTime = expirationTime;
				if (
					alternate !== null &&
					alternate.childExpirationTime < expirationTime
				) {
					alternate.childExpirationTime = expirationTime;
				}
			} else if (
				alternate !== null &&
				alternate.childExpirationTime < expirationTime
			) {
				alternate.childExpirationTime = expirationTime;
			}
			// 更新两个fiber的child过期时间

			if (node.return === null && node.tag === HostRoot) {
				root = node.stateNode;
				break;
			}
			node = node.return;
		}
	}
	return root;
}

// root有一个链表
// schedule 内有两个全局变量表示一个链表
// 当应用中只有一个fiberRoot的时候 会形成一个链表吗
function addRootToSchedule(root, expirationTime) {
	// 将root添加到schedule上
	// 检测root是否为schedule的一部分 这里的判断很巧啊：这是一个环状链表所以在这条链表上都会有nextScheduledRoot属性
	if (root.nextScheduledRoot === null) {
		root.expirationTime = expirationTime;
		if (lastScheduledRoot === null) {
			firstScheduledRoot = lastScheduledRoot = root;
			root.nextScheduledRoot = root;
		} else {
			lastScheduledRoot.nextScheduledRoot = root;
			lastScheduledRoot = root;
			lastScheduledRoot.nextScheduledRoot = firstScheduledRoot;
		}
	} else {
		// 已经在schedule上 更新优先级
		const remainingExpirationTime = root.expirationTime;
		if (remainingExpirationTime < expirationTime) {
			root.expirationTime = expirationTime;
		}
	}
}

function resetStack() {
    // 说明是一个被打断的任务
    if (nextUnitOfWork !== null) {
        // TODO
    }
    nextRoot = null
    nextRenderExpirationTime = NoWork
    nextUnitOfWork = null

}

function beginWork() {

}

function performUnitOfWork(workInProgress) {
    const current = workInProgress.alternate

    let next;
    next = beginWork(current, workInProgress, nextRenderExpirationTime)
    // ?
    workInProgress.memoizedProps = workInProgress.pendingProps;
    
    if (next === null) {
        next = completeUnitOfWork(workInProgress)
    }
    ReactCurrentOwner.current = null;
    return next
}

function workLoop() {
    while (nextUnitOfWork !== null) {
        nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
    }
}

function renderRoot(root) {
	isWorking = true;
	const previousDispatcher = ReactCurrentDispatcher.current;
	ReactCurrentDispatcher.current = ContextOnlyDispatcher;

	const expirationTime = root.nextExpirationTimeToWorkOn;

    // 第一次执行 nextUnitOfWork 为null
	if (
		expirationTime !== nextRenderExpirationTime ||
		root !== nextRoot ||
		nextUnitOfWork === null
	) {
        // 重置堆栈 重新从root上工作
        resetStack()
        nextRoot = root
        nextRenderExpirationTime = expirationTime
        // 创建root的alternate节点
        nextUnitOfWork = createWorkInProgress(
            root,
            null,
            nextFlushedExpirationTime,
        )
        root.pendingCommitExpirationTime = NoWork;
    }
    
    do {
        try {
            workLoop(isYieldy);
        } catch (error) {
            console.error(error, 'error...')
        }
        break
    } while (true)
	isWorking = false;
}

function performWorkOnRoot(root, expirationTime, isYieldy) {
	isRendering = true;
	// 目前isYieldy为false
	if (!isYieldy) {
		// 更新应用不中断
		let finishedWork = root.finishedWork;
		if (finishedWork !== null) {
			completeRoot(root, finishedWork, expirationTime);
		} else {
			root.finishedWork = null;
			// 如果这个root是上一个 suspended组件； 清楚他的到期时间
			// TODO
			renderRoot(root);
			finishedWork = root.finishedWork;
			if (finishedWork) {
				completeRoot(root, finishedWork, expirationTime);
			}
		}
	} else {
		// TODO
	}

	isRendering = false;
}

function performWork(minExpirationTime) {
	// 保持working在roots 直到没有work 或者一个更高优先级的任务进入
	findHighestPriorityRoot();

	while (
		nextFlushedRoot !== null &&
		nextFlushedExpirationTime !== NoWork &&
		minExpirationTime <= nextFlushedRoot // ?进入此时的优先级应该是相等的；
	) {
		performWorkOnRoot(nextFlushedRoot, nextFlushedExpirationTime);
		findHighestPriorityRoot();
	}

	// TODO
}

function performSyncWork() {
	performWork(Sync);
}

function requestWork(root, expirationTime) {
	addRootToSchedule(root, expirationTime);
	if (isRendering) {
		// 防止重入 剩余的work将在当前rendering batch结束时调用
		return;
	}

	if (isBatchingUpdates) {
		// Flush work at the end of the batch.
		if (isUnbatchingUpdates) {
			// ...unless we're inside unbatchedUpdates, in which case we should
			// flush it now.
			nextFlushedRoot = root;
			nextFlushedExpirationTime = Sync;
			performWorkOnRoot(root, Sync, false);
		}
		return;
	}

	// 目前同步
	if (expirationTime === Sync) {
		performSyncWork();
	} else {
		// TODO
	}
}

export function shedulerWork(fiber, expirationTime) {
	// const root = markUpdateTimeFromFiberToRoot(fiber, expirationTime)

	const root = scheduleWorkToRoot(fiber, expirationTime);
	if (root === null) {
		return;
	}
	if (
		!isWorking &&
		nextRenderExpirationTime !== NoWork &&
		expirationTime > nextRenderExpirationTime
	) {
		// 这是一个高优先级的任务 打断低优先级的任务
		// TODO
	}

	// 跟新 earliestPendingTime 和 latestPendingTime
	// 一个时间范围
	markPendingPriorityLevel(root);
	if (!isWorking || isCommitting || nextRoot !== root) {
		// 如果我们在一个render阶段 我们没必要把这个root作为一个更新 因为在做之前我们会退出 ？what？
		// 除非是两个不同的root
		const rootExpirationTime = root.expirationTime;
		requestWork(root, rootExpirationTime);
	}
}
