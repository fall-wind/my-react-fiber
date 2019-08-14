import { NoWork } from './expirationTime';
import {
	Callback,
	ShouldCapture,
	DidCapture,
} from '../shared/ReactSideEffectTags';

export const UpdateState = 0;
export const ReplaceState = 1;
export const ForceUpdate = 2;
export const CaptureUpdate = 3;

// 在调用processUpdateQueue 被重置
let hasForceUpdate = false;

export function createUpdate(expirationTime) {
	return {
		expirationTime,
		tag: UpdateState,
		payload: null,
		callback: null,

		next: null,
		nextEffect: null,
	};
}

function createUpdateQueue(baseState) {
	const queue = {
		baseState,
		firstUpdate: null,
		lastUpdate: null,
		firstEffect: null,
		lastEffect: null,

		// 错误捕获
		firstCapturedUpdate: null,
		lastCapturedUpdate: null,
		firstCapturedEffect: null,
		lastCapturedEffect: null,
	};
	return queue;
}

function appendUpdateToQueue(queue, update) {
	// 判断lastUpdate和firstUpdate应该是一个效果 不过lastUpdate更稳妥 因为在else的分支里对lastUpdate进行了赋值
	const lastUpdate = queue.lastUpdate;
	if (lastUpdate === null) {
		queue.firstUpdate = queue.lastUpdate = update;
	} else {
		queue.lastUpdate.next = update;
		queue.lastUpdate = update;
	}
}

function cloneUpdateQueue(currentQueue) {
	const queue = {
		baseState: currentQueue.baseState,
		firstUpdate: currentQueue.firstUpdate,
		lastUpdate: currentQueue.lastUpdate,
		// TODO: With resuming, if we bail out and resuse the child tree, we should
		// keep these effects.
		firstCapturedUpdate: null,
		lastCapturedUpdate: null,

		firstEffect: null,
		lastEffect: null,

		firstCapturedEffect: null,
		lastCapturedEffect: null,
	};
	return queue;
}

function ensureWorkInProgressQueueIsAClone(workInProgress, queue) {
	const current = workInProgress.alternate;
	if (current !== null) {
		// If the work-in-progress queue is equal to the current queue,
		// we need to clone it first.
		if (queue === current.updateQueue) {
			queue = workInProgress.updateQueue = cloneUpdateQueue(queue);
		}
	}
	return queue;
}

function getStateFromUpdate(
	workInProgress,
	queue,
	update,
	prevState,
	nextProps,
	instance,
) {
	switch (update.tag) {
		case ReplaceState: {
			const payload = update.payload;
			if (typeof payload === 'function') {
				const nextState = payload.call(instance, prevState, nextProps);
				return nextState;
			}
			return payload;
		}
		case CaptureUpdate: {
			workInProgress.effectTag =
				(workInProgress.effectTag & ~ShouldCapture) | DidCapture;
		}
		case UpdateState: {
			const payload = update.payload;
			let partialState;
			if (typeof payload === 'function') {
				partialState = payload.call(instance, prevState, nextProps);
			} else {
				partialState = payload;
			}
			if (partialState === null || partialState === undefined) {
				return prevState;
			}
			return Object.assign({}, prevState, partialState);
		}
		case ForceUpdate: {
			hasForceUpdate = true;
			return prevState;
		}
	}
	return prevState;
}

export function processUpdateQueue(
	workInProgress,
	queue,
	props,
	instance,
	renderExpirationTime,
) {
	hasForceUpdate = false;
	queue = ensureWorkInProgressQueueIsAClone(workInProgress, queue);
	let newBaseState = queue.baseState;
	let newFirstUpdate = null;
	let newExpirationTime = NoWork;

	let update = queue.firstUpdate;
	let resultState = newBaseState;

	while (update !== null) {
		const updateExpiprationTime = update.expirationTime;
		// 异步
		if (updateExpiprationTime < renderExpirationTime) {
		} else {
			// 这个更新有足够高的优先级
			// 标记更新的事件时间和这个更新阶段相关

			// markRenderEventTimeAndConfig()

			resultState = getStateFromUpdate(
				workInProgress,
				queue,
				update,
				resultState,
				props,
				instance,
			);
			const callback = update.callback;
			if (callback !== null) {
                // 将更新添加到 effectList 上
                workInProgress.effectTag != Callback;
                update.nextEffect = null
                if (queue.lastEffect === null) {
                    queue.firstEffect = queue.lastEffect = update
                } else {
                    queue.lastEffect.nextEffect = update;
                    queue.lastEffect = update;
                }
            }
            update = update.next
		}
    }
    
    // 遍历capture list
    // TODO

    if (newFirstUpdate === null) {
        queue.lastUpdate = null
    }

    queue.baseState = newBaseState
    queue.firstUpdate = newFirstUpdate;
    workInProgress.expirationTime = newExpirationTime;
    workInProgress.memoizedState = resultState;
}

export function enqueueUpdate(fiber, update) {
	// 先找到workInProcess上的updateQueue
	const alternate = fiber.alternate;
	// 第一次渲染 alternate为null ？
	let queue1;
	let queue2;
	if (alternate === null) {
		// 第一次渲染
		queue1 = fiber.updateQueue;
		queue2 = null;
		if (queue1 === null) {
			fiber.updateQueue = createUpdateQueue(fiber.memoizedState);
			queue1 = fiber.updateQueue;
		}
	} else {
		// TODO
		queue1 = fiber.updateQueue;
		queue2 = alternate.updateQueue;
		// commit work的时候 将fiber上的updateQueue置为null
		if (queue1 === null) {
			if (queue2 === null) {
				queue1 = fiber.updateQueue = createUpdateQueue(
					fiber.memoizedState,
				);
				// TODO
				queue2 = alternate.updateQueue = createUpdateQueue(
					alternate.memoizedState,
				);
			} else {
				// 在什么情况下 q2 存在 q1不存在？ 当更新未被合并到current？
				queue1 = fiber.updateQueue = cloneUpdateQueue(queue2);
			}
		} else {
			if (queue2 === null) {
				queue2 = alternate.updateQueue = cloneUpdateQueue(queue1);
			} else {
			}
		}
	}
	// 创建完更新队列之后 向队列中添加update
	if (queue2 === null || queue1 === queue2) {
		appendUpdateToQueue(queue1, update);
	} else {
		// 有两条更新队列，我们需要把更新添加到这两条上， 我们不希望将相同的更新被添加多次
		if (queue1.lastUpdate === null || queue1.lastUpdate === null) {
			appendUpdateToQueue(queue1, update);
			appendUpdateToQueue(queue2, update);
		} else {
			// 两个链表都不为空 因为结构的共享所以他们最后的更新时相同的 所以引用只需要改一次 在手动将另一条的lastUpdate设置为update
			appendUpdateToQueue(queue1, update);
			queue2.lastUpdate = update;
		}
	}
}
