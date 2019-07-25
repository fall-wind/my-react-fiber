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

export function enqueueUpdate() {

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
