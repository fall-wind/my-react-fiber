import {
	BatchedMode,
	NoMode,
	ConcurrentMode,
	ProfileMode,
} from '../shared/ReactTypeOfMode';
import { Sync, NoWork, msToExpirationTime } from './expirationTime';
import {
	HostRoot,
	IndeterminateComponent,
	FunctionComponent,
} from '../shared/ReactWorkTags';
import { createWorkInProgress } from './fiber';
import { noTimeout, prepareForCommit } from './ReactDOMHostConfig';
import { ContextOnlyDispatcher } from './fiberHooks';
import { enableProfilerTimer } from '../shared/ReactFeatureFlags';
import ReactSharedInternals from '../shared/ReactSharedInternals';
import { beginWork } from './fiberBeginWork';
import { completeWork } from './fiberCompleteWork';
import {
	Incomplete,
	NoEffect,
	PerformedWork,
	Snapshot,
	Ref,
	ContentReset,
	Placement,
	Update,
	Deletion,
	PlacementAndUpdate,
	Callback,
} from '../shared/ReactSideEffectTags';
import {
	getCurrentPriorityLevel,
	ImmediatePriority,
	runWithPriority,
	flushSyncCallbackQueue,
	scheduleSyncCallback,
} from './SchedulerWithReactIntegration';
import {
	commitBeforeMutationLifeCycles as commitBeforeMutationEffectOnFiber,
	commitPlacement,
	commitWork,
} from './fiberCommitWork';
import {
	setCurrentContext as setCurrentFiberInRecordStatus,
	getCurrentPerformPhase as getInjectionPerformPhase,
} from '../react-dom/injection/index';
import { UserBlockingPriority } from '../scheduler';

const { ReactCurrentDispatcher, ReactCurrentOwner } = ReactSharedInternals;

const NoContext = /*                    */ 0b000000;
const BatchedContext = /*               */ 0b000001;
const EventContext = /*                 */ 0b000010;
const DiscreteEventContext = /*         */ 0b000100;
const LegacyUnbatchedContext = /*       */ 0b001000;
const RenderContext = /*                */ 0b010000;
const CommitContext = /*                */ 0b100000;

let executionContext = NoContext;

let workInProgressRoot = null;
let workInProgress = null;

let currentEventTime = NoWork;
let renderExpirationTime = NoWork;

let nextEffect = null;

const RootIncomplete = 0;
const RootErrored = 1;
const RootSuspended = 2;
const RootSuspendedWithDelay = 3;
const RootCompleted = 4;

let workInProgressRootExitStatus = RootIncomplete;

export function upbatchedUpdates(fn, a) {
	const prevExecutionContext = executionContext;
	executionContext &= ~BatchedContext;
	executionContext |= ~LegacyUnbatchedContext;
	try {
		return fn(a);
	} finally {
		executionContext = prevExecutionContext;
		if (executionContext === NoContext) {
			// TODO
			// 刷新
			flushSyncCallbackQueue()
		}
	}
}

const now = Date.now;

export function requestCurrentTime() {
	if ((executionContext & (RenderContext | CommitContext)) !== NoContext) {
		// 处于 render 或者 commit 阶段时
		// We're inside React, so it's fine to read the actual time.
		// 1000 * 60 = 60000
		// 1000 * 60 * 60 = 3600000
		// 1000 * 60 * 60 * 24 = 86400000
		return msToExpirationTime(now());
	}
	// We're not inside React, so we may be in the middle of a browser event.
	if (currentEventTime !== NoWork) {
		// Use the same start time for all updates until we enter React again.
		return currentEventTime;
	}
	// This is the first update since React yielded. Compute a new start time.
	currentEventTime = msToExpirationTime(now());
	return currentEventTime;
}

export function computeExpirationForFiber(currentTime, fiber) {
	const mode = fiber.mode;
	// 非
	if ((mode & BatchedMode) === NoMode) {
		// 当前不包含BatchedMode
		return Sync;
	}
	// 当前优先级
	// const priorityLevel = getCurrentPriorityLevel();
	if ((mode & ConcurrentMode) === NoMode) {
		// return priorityLevel === ImmediatePriority ? Sync : Batched;
		return Sync;
	}

	return expirationTime;
}

// 将batch位置为0 将LegacyUnbatchedContext位置为1
export function unbatchedUpdates(fn, a) {
	const prevExecutionContext = executionContext;
	executionContext &= ~BatchedContext;
	executionContext |= LegacyUnbatchedContext;
	try {
		return fn(a);
	} finally {
		executionContext = prevExecutionContext;
		if (executionContext === NoContext) {
			// Flush the immediate callbacks that were scheduled during this batch
			// TODO
			flushSyncCallbackQueue();
		}
	}
}

// TODO
function chectForNestedUpdates(params) {}

// 遍历更新 firstPendingTime lastPendingTime expirationTime
function markUpdateTimeFromFiberToRoot(fiber, expirationTime) {
	// 更新fiber 的到期时间
	if (fiber.expirationTime < expirationTime) {
		fiber.expirationTime = expirationTime;
	}

	let alternate = fiber.alternate;
	// 第一次渲染为null
	if (alternate !== null && alternate.expirationTime < expirationTime) {
		alternate.expirationTime = expirationTime;
	}
	// 遍历父节点到root 更新child expirationTime

	let node = fiber.return;
	let root = null;
	if (node === null && fiber.tag === HostRoot) {
		root = fiber.stateNode;
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
			if (node.return === null && node.tag === HostRoot) {
				root = node.stateNode;
				break;
			}
			node = node.return;
		}
	}

	if (root !== null) {
		// 做什么的
		const firstPendingTime = root.firstPendingTime;
		if (expirationTime > firstPendingTime) {
			root.firstPendingTime = expirationTime;
		}
		const lastPendingTime = root.lastPendingTime;
		if (lastPendingTime === NoWork || expirationTime < lastPendingTime) {
			root.lastPendingTime = expirationTime;
		}
	}
	return root;
}

// 创建workInProgress 以及相关工作
function prepareFreshStack(root, expirationTime) {
	root.finishedWork = null;
	root.finishedExpirationTime = null;

	// const timeoutHandle = root.timeoutHandle

	// TODO
	if (workInProgress !== null) {
	}

	workInProgressRoot = root;
	workInProgress = createWorkInProgress(root.current, null, expirationTime);
	renderExpirationTime = expirationTime;

	// TODO
	workInProgressRootExitStatus = RootIncomplete;
	// workInProgressRootLatestProcessedExpirationTime = Sync;
	// workInProgressRootLatestSuspenseTimeout = Sync;
	// workInProgressRootCanSuspendUsingConfig = null;
	// workInProgressRootHasPendingPing = false;
}

//
function startWorkOnPendingInteractions() {
	const interactions = new Set();
}

// hooks 先关的 create
function commitBeforeMutationEffects() {
	while (nextEffect !== null) {
		if ((nextEffect.effectTag & Snapshot) !== NoEffect) {
			const current = nextEffect.alternate;
			commitBeforeMutationEffectOnFiber(current, nextEffect);
		}
		nextEffect = nextEffect.nextEffect;
	}
}

//
function commitMutationEffects(renderPriorityLevel) {
	while (nextEffect !== null) {
		const effectTag = nextEffect.effectTag;

		if (effectTag & ContentReset) {
			// TODO
		}

		if (effectTag & Ref) {
			// TODO
		}

		let primaryEffectTag = effectTag & (Placement | Update | Deletion);

		switch (primaryEffectTag) {
			case Placement: {
				commitPlacement(nextEffect);
				nextEffect.effectTag &= ~Placement;
				// 处理完 清除
				break;
			}
			case PlacementAndUpdate: {
				commitPlacement(nextEffect);
				nextEffect.effectTag &= ~Placement;

				const current = nextEffect.alternate;

				commitWork(current, nextEffect);
				break;
            }
            case Update: {
                const current = nextEffect.alternate;
                commitWork(current, nextEffect);
                break;
            }
		}
		nextEffect = nextEffect.nextEffect;
	}
}

function commitLayoutEffects(root, committedExpirationTime) {
	while (nextEffect !== null) {
		const effectTag = nextEffect.effectTag;
		if (effectTag & (Update | Callback)) {
			// TODO
		}

		nextEffect = nextEffect.nextEffect;
	}
}

function commitRootImpl(root, renderPriorityLevel) {
	// flushPassiveEffects();

	const finishedWork = root.finishedWork;
	const expirationTime = root.finishedExpirationTime;

	if (finishedWork === null) {
		return null;
	}

	root.finishedWork = null;
	root.finishedExpirationTime = NoWork;

	root.callbackNode = null;
	root.callbackExpirationTime = NoWork;

	const updateExpirationTimeBeforeCommit = finishedWork.expirationTime;
	const childExpirationTimeBeforeCommit = finishedWork.childExpirationTime;

	// TODO time mean?
	const firstPendingTimeBeforeCommit =
		childExpirationTimeBeforeCommit > updateExpirationTimeBeforeCommit
			? childExpirationTimeBeforeCommit
			: updateExpirationTimeBeforeCommit;

	root.firstPendingTime = firstPendingTimeBeforeCommit;

	if (firstPendingTimeBeforeCommit < root.lastPendingTime) {
		root.lastPendingTime = firstPendingTimeBeforeCommit;
	}

	if (root === workInProgressRoot) {
		workInProgressRoot = null;
		workInProgress = null;
		renderExpirationTime = NoWork;
	} else {
		//
	}

	let firstEffect;

	if (finishedWork.effectTag > PerformedWork) {
		// 一个fiber的effect仅包含 他的children的 不包含他自身 如果root节点有一个effect 我们需要把它添加到effect list 的尾部
		//
		if (finishedWork.lastEffect !== null) {
			finishedWork.lastEffect.nextEffect = finishedWork;
			firstEffect = finishedWork.firstEffect;
		} else {
			firstEffect = finishedWork;
		}
	} else {
		firstEffect = finishedWork.firstEffect;
	}

	if (firstEffect !== null) {
		const prevExecutionContext = executionContext;
		executionContext |= CommitContext;

		let prevInteractions = null;

		ReactCurrentOwner.current = null;

		prepareForCommit(root.containerInfo);
		nextEffect = firstEffect;
		do {
			try {
				commitBeforeMutationEffects();
			} catch (error) {
				console.error('error msg:', error);
				break;
			}
		} while (nextEffect !== null);
		// 重新设置标记位

		nextEffect = firstEffect;

		do {
			try {
				commitMutationEffects(renderPriorityLevel);
			} catch (error) {
				console.error('error msg', error);
				break;
			}
		} while (nextEffect !== null);
		// append
        nextEffect = firstEffect;
        
        root.current = finishedWork; // 将完成工作赋给current

		do {
			try {
				commitLayoutEffects(root, expirationTime);
			} catch (error) {
				console.error('error msg', error);
				break;
			}
		} while (nextEffect !== null);
        nextEffect = null;
        
        executionContext = prevExecutionContext; // commit阶段完成
	}

	while (nextEffect !== null) {
		const nextNextEffect = nextEffect.nextEffect;
		nextEffect.nextEffect = null;
		nextEffect = nextNextEffect;
	}

	// dev tools
	// onCommitRoot(finishedWork.stateNode, expirationTime)

	return null;
}

function commitRoot(root) {
	const renderPriorityLevel = getCurrentPriorityLevel();
	runWithPriority(
		ImmediatePriority,
		commitRootImpl.bind(null, root, renderPriorityLevel),
	);

	return null;
}

// 前置条件
// begin work 创建fiber 标记需要更新部分
function completeUnitOfWork(unitOfWork) {
	// 试图完成当前的工作 转移到silbing工作 如果 没有 兄弟节点则返回父节点
	workInProgress = unitOfWork;

	do {
		// 当前 flushed fiber的state都是alternate的 理想情况下 没有任何事情需要依赖这个 但是依赖这个就意味着
		// 在工作进程中我们需要额外的工作
		const current = workInProgress.alternate;
		const returnFiber = workInProgress.return;

		// 检测是否有未完成的工作
		if ((workInProgress.effectTag & Incomplete) === NoEffect) {
			let next;
			setCurrentFiberInRecordStatus(workInProgress, 'completeWork');
			next = completeWork(current, workInProgress, renderExpirationTime);
			// if ((workInProgress.mode & ProfileMode) === NoMode) {
			// 	next = completeWork(
			// 		current,
			// 		workInProgress,
			// 		renderExpirationTime,
			// 	);
			// }

			if (next !== null) {
				return next;
			}

			if (
				returnFiber !== null &&
				(returnFiber.effectTag & Incomplete) === NoEffect
			) {
				// 将子节点的effectList归并待父节点上
				if (returnFiber.firstEffect === null) {
					returnFiber.firstEffect = workInProgress.firstEffect;
				}

				if (workInProgress.lastEffect !== null) {
					if (returnFiber.lastEffect !== null) {
						returnFiber.lastEffect.nextEffect =
							workInProgress.firstEffect;
					}
					returnFiber.lastEffect = workInProgress.firstEffect;
				}
				const effectTag = workInProgress.effectTag;

				if (effectTag > PerformedWork) {
					if (returnFiber.lastEffect !== null) {
						returnFiber.lastEffect.nextEffect = workInProgress;
					} else {
						returnFiber.firstEffect = workInProgress;
					}
					returnFiber.lastEffect = workInProgress;
				}
			}
		} else {
			// TODO unwindWork
		}

		const siblingFiber = workInProgress.sibling;

		if (siblingFiber !== null) {
			return siblingFiber;
		}

		workInProgress = returnFiber;
	} while (workInProgress !== null);

	// We've reached the root.
	if (workInProgressRootExitStatus === RootIncomplete) {
		workInProgressRootExitStatus = RootCompleted;
	}
	return null;
}

function performUnitOfWork(unitOfWork) {
	const current = unitOfWork.alternate;
	let next;
	// if (enableProfilerTimer) {
	//     // TODO
	// } else {
	//     next = beginWork(current, unitOfWork, renderExpirationTime)
	// }

	setCurrentFiberInRecordStatus(unitOfWork, 'beginWork');

	next = beginWork(current, unitOfWork, renderExpirationTime);
	unitOfWork.memoizedProps = unitOfWork.pendingProps;

	if (next === null) {
		setCurrentFiberInRecordStatus(unitOfWork, 'completeUnitOfWork');
		next = completeUnitOfWork(unitOfWork);
	}

	ReactCurrentOwner.current = null;
	return next;
}

function workLoopSync() {
	while (workInProgress !== null) {
		workInProgress = performUnitOfWork(workInProgress);
	}
}

function renderRoot(root, expirationTime, isSync) {
    console.error('renderRoot phase')
	if (root.firstPendingTime < expirationTime) {
		// 如果当前没有任务 则立即退出
		// 这个发生于多个cbs作用与一个root 更早的回调 flush 后面的工作
		return null;
	}
	if (isSync && root.finishedExpirationTime === expirationTime) {
		// todo 第一次没有finishedExpirationTime
	}

	if (
		root !== workInProgressRoot ||
		expirationTime !== renderExpirationTime
	) {
		prepareFreshStack(root, expirationTime);
		// startWorkOnPendingInteractions(root, expirationTime)
	}

	if (workInProgress !== null) {
		const prevExecutionContext = executionContext;
		executionContext |= RenderContext;
		let prevDispatcher = ReactCurrentDispatcher.current;

		ReactCurrentDispatcher.current = ContextOnlyDispatcher;

		if (isSync) {
			if (expirationTime !== Sync) {
				// TODO
			} else {
				currentEventTime = NoWork;
			}
		}

		// workLoopSync()

		do {
			try {
				if (isSync) {
					workLoopSync();
				} else {
					// TODO
				}
				break;
			} catch (error) {
				console.error('err msg', error);
				break;
			}
		} while (true);

		executionContext = prevExecutionContext;
		ReactCurrentDispatcher.current = prevDispatcher;
		setCurrentFiberInRecordStatus(null, 'workLoopOver');
	}

	root.finishedWork = root.current.alternate;

	root.finishedExpirationTime = expirationTime;

	workInProgressRoot = null;
	if (getInjectionPerformPhase() === 'workLoop') {
		return;
	}
	// console.error(root, 'root & finish work');
	// TODO
	switch (workInProgressRootExitStatus) {
		case RootCompleted: {
			return commitRoot.bind(null, root);
		}
	}
}

function cancelCallback() {}

function schedulePendingInteractions(root, expirationTime) {
	// This is called when work is scheduled on a root.
	// It associates the current interactions with the newly-scheduled expiration.
	// They will be restored when that expiration is later committed.
	if (!enableSchedulerTracing) {
		return;
	}

	// scheduleInteractions(root, expirationTime, __interactionsRef.current);
}

function runRootCallback(root, callback, isSync) {
	const prevCallbackNode = root.callbackNode;

	let continuation = null;

	try {
		continuation = callback(isSync);
		if (continuation !== null) {
			return runRootCallback.bind(null, root, continuation);
		} else {
			return null;
		}
	} finally {
		if (continuation === null && prevCallbackNode === root.callbackNode) {
			root.callbackNode = null;
			root.callbackExpirationTime = NoWork;
		}
	}
}

function scheduleCallbackForRoot(root, priorityLevel, expirationTime) {
	const existingCallbackExpirationTime = root.callbackExpirationTime;

	if (existingCallbackExpirationTime < expirationTime) {
		// TODO
		const existingCallbackNode = root.callbackNode;

		if (existingCallbackNode !== null) {
			cancelCallback(existingCallbackNode);
		}
		root.callbackExpirationTime = expirationTime;

		if (expirationTime === Sync) {
			root.callbackNode = scheduleSyncCallback(
				runRootCallback.bind(
					null,
					root,
					renderRoot.bind(null, root, expirationTime),
				),
			);
		} else {
			// TODO
		}
	}

	// schedulePendingInteractions(root, expirationTime);
}

// function schedulePendingInteractions(root, expirationTime)

// }

export function scheduleUpdateOnFiber(fiber, expirationTime) {
	const root = markUpdateTimeFromFiberToRoot(fiber, expirationTime);
	//
	root.pingTime = NoWork;

	// recordScheduleUpdate
	// recordScheduleUpdate()

	// 同步代码
	console.error('schedule work...');
	if (expirationTime === Sync) {
		if (
			// 检测在 unbatchedUpdates
			// tips 第一次调用unbatchedUpdates 的时候 executionContext |= LegacyUnbatchedContext;
			(executionContext & LegacyUnbatchedContext) !== NoContext &&
			// 检测是否准备好更新了
			(executionContext & (RenderContext | CommitContext)) === NoContext
		) {
			// tips 同步第一次渲染走这

			// 在root上注册正在交互 避免丢失跟踪交互数据 TODO
			// schedulePendingInteractions(root, expirationTime);

			// 遗留的边界案例 初始在批量更新内部'ReactDOM.renderedroot'的挂载应该是同步的
			// 但是布局的更新应该别延迟到 这个批次的结束
			let callback = renderRoot(root, Sync, true);
			while (callback != null) {
				callback = callback(true);
			}
		} else {
			scheduleCallbackForRoot(root, ImmediatePriority, Sync);
			if (executionContext === NoContext) {
				flushSyncCallbackQueue();
			}
		}
	}
}

export function batchedUpdates(fn, a) {
	const preExecutionContext = executionContext;
	executionContext |= BatchedContext;
	try {
		return fn(a);
	} finally {
		executionContext = prevExecutionContext;
		if (executionContext === NoContext) {
			// TODO
			flushSyncCallbackQueue();
		}
	}
}

export function batchedEventUpdates(fn, a) {
	const prevExecutionContext = executionContext;
	executionContext |= EventContext;
	try {
		return fn(a);
	} finally {
		executionContext = prevExecutionContext;
		if (executionContext === NoContext) {
			// Flush the immediate callbacks that were scheduled during this batch
			flushSyncCallbackQueue();
		}
	}
}

export const scheduleWork = scheduleUpdateOnFiber;

export function discreteUpdates(fn, a, b, c) {
	const prevExecutionContext = executionContext;
	executionContext |= DiscreteEventContext;
	try {
		// Should this
		// TODO
		// return runWithPriority(UserBlockingPriority, fn.bind(null, a, b, c));
		return fn.call(null, a, b, c);
	} finally {
		executionContext = prevExecutionContext;
		if (executionContext === NoContext) {
			// Flush the immediate callbacks that were scheduled during this batch
			flushSyncCallbackQueue();
		}
	}
}

export function flushDiscreteUpdates() {
	// TODO
}
