import { NoWork } from "./expirationTime";

export const UpdateState = 0;
export const ReplaceState = 1;
export const ForceUpdate = 2;
export const CaptureUpdate = 3;

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

export function equeueUpdate(fiber, update) {
	// 先找到workInProgress上的updateQueue
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
	// issue: queue2可能为null吗？
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
		// 如果两条更新队列相同 我们clone一下
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
            const payload = update.payload
            if (typeof payload === 'function') {
                const nextState = payload.call(instance, prevState, nextProps)
            }
            return nextState
        }
        case CaptureUpdate: {
            // TODO
        }
        case UpdateState: {
            const payload = update.payload
            let partialState;
            if (typeof payload === 'function') {
                partialState = payload.call(instance, prevState, nextProps);
            } else {
                partialState = payload
            }
            if (partialState === null || partialState === undefined) {
                return prevState
            }
            return Object.assign({}, prevState, partialState)
        }
        case ForceUpdate: {
            hasForceUpdate = true;
            return prevState;
        }
    }
    return prevState
}

// 三个时间
export function processUpdateQueue(
	workInProgress,
	queue,
	props,
	instance,
	renderExpirationTime,
) {
    queue = ensureWorkInProgressQueueIsAClone(workInProgress, queue);
    
    // 当我遍历queue的时候这些值可能发生变化 什么情况下会发生变化？
    let newBaseState = queue.baseState
    let newFirstUpdate = null
    let nextExpirationTime = NoWork

    // 遍历列表更新计算结果
    let update = queue.firstUpdate;
    let resultState = newBaseState;
    while (update !== null) {
        const updateExpirationTime = queue.expirationTime
        if (updateExpirationTime < renderExpirationTime) {
            // 这个更新优先级不够 跳过
            if (newFirstUpdate === null) {
                newFirstUpdate = update
                newBaseState = resultState
            }
            // 因为这个更新任然存在list中 更新剩下的更新时间
            if (nextExpirationTime < updateExpirationTime) {
                nextExpirationTime = updateExpirationTime
            }
        } else {
            // 这个更新有足够高的优先级 处理它计算出新的结果
            resultState = getStateFormUpdate(
                workInProgress,
                queue,
                update,
                resultState,
                props,
                instance,
            )
            const callback = update.callback
            if (callback !== null) {
                workInProgress.effectTag |= Callback
                // 将它置为null 以防止在中断的render中被计算
                update.nextEffect = null
                // 将 这个更新加到 queue的effect上
                if (queue.lastEffect === null) {
                    queue.firstEffect = queue.lastEffect = update;
                } else {
                    queue.lastEffect.nextEffect = update;
                    queue.lastEffect = update;
                }
            }
        }
        update = update.next
    }

    // TODO capture update

    if (newFirstUpdate === null) {
        queue.lastUpdate = null;
    }

    // TODO capture
    workInProgress.effectTag |= Callback
    
    if (newFirstUpdate === null) {
        // 说明没有更新被跳过 那就意味着新的更新和 result state相同
        // 不同怎么办？
        newBaseState = resultState
    }
    queue.baseState = newBaseState
    queue.firstUpdate = newFirstUpdate

    /**
     * 将update上剩余最高 优先级的过期时间；
     * 只有props和context这两个因素决定过期时间 
     * 在我们处理更新队列时我们已经处于开始阶段 所以我们处理了这些props
     * 组件中的context 被Scu制定的context是很棘手的？？？
     * 但是我们不得不考虑到
     */
    workInProgress.expirationTime = newExpirationTime
    workInProgress.memoizedState = resultState;
}
