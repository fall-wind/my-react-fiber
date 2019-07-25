import { BatchedMode, NoMode } from '../shared/ReactTypeOfMode'

const NoContext = /*                    */ 0b000000;
const BatchedContext = /*               */ 0b000001;
const EventContext = /*                 */ 0b000010;
const DiscreteEventContext = /*         */ 0b000100;
const LegacyUnbatchedContext = /*       */ 0b001000;
const RenderContext = /*                */ 0b010000;
const CommitContext = /*                */ 0b100000;

let executionContext = NoContext;

export function upbatchedUpdates(fn, a) {
    const prevExecutionContext = executionContext
    executionContext &= ~BatchedContext
    executionContext |= ~LegacyUnbatchedContext
    try {
        return fn(a)
    } finally {
        executionContext = prevExecutionContext
        if (executionContext === NoContext) {
            // TODO
            // 刷新
            // flushSyncCallbackQueue()
        }
    }
}


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
    const mode = fiber.mode
    if ((mode & BatchedMode) === NoMode) {
        // 当前不包含BatchedMode
        return Sync
    }
    // TODO
	if (workPhase === RenderPhase) {
		return renderExpirationTime;
	}
	let expirationTime;
	// 省略其他代码
	expirationTime = computeAsyncExpiration(currentTime);
	if (
		workInProgressRoot !== null &&
		expirationTime === renderExpirationTime
	) {
		expirationTime -= 1;
	}
	return expirationTime;
}
