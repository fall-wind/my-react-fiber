import { msToExpirationTime, computeAsyncExpiration, NoWork, Sync } from './expirationTime';
import { HostRoot } from './workTags'
import { BatchedMode, NoMode } from '../shared/ReactTypeOfMode'

const now = Date.now;

const NoContext = /*                    */ 0b000000;
const BatchedContext = /*               */ 0b000001;
const EventContext = /*                 */ 0b000010;
const DiscreteEventContext = /*         */ 0b000100;
const LegacyUnbatchedContext = /*       */ 0b001000;
const RenderContext = /*                */ 0b010000;
const CommitContext = /*                */ 0b100000;

// Working Phase
// const NotWorking = 0;
// const BatchedPhase = 1;
// const LegacyUnbatchedPhase = 2;
// const FlushSyncPhase = 3;
// const RenderPhase = 4;
// const CommitPhase = 5;

let renderExpirationTime = NoWork;
let workInProgressRoot = null;

let workPhase = NotWorking;
let initialTimeMs = now();

let executionContext = NoContext;
let currentEventTime = NoWork;

// 0b110000
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

/**
 *  用正在进行的work 标记fiber
 */
function markUpdateTimeFromFiberToRoot(fiber, expirationTime) {
    // 更新fiber的过期时间 time越大 说明优先级越高
    if (fiber.expirationTime < expirationTime) {
        fiber.expirationTime = expirationTime
    }
    // 同时更新 work In Process 的expiration Time
    if (fiber.alternate !== null && fiber.alternate.expirationTime < expirationTime) {
        fiber.alternate.expirationTime = expirationTime
    }

    // 从当前fiber向上更新父fiber的childExpirationTime
    let node = fiber.return
    let root = null
    if (node === null) {
        root = node.stateNode
    } else {
        while(node !== null) {
            // 更新fiber 与 alternate上的 childExpirationTime
            alternate = node.alternate;
            if (node.childExpirationTime < expirationTime) {
                node.childExpirationTime = expirationTime
                if (alternate !== null && alternate.childExpirationTime < expirationTime) {
                    alternate.childExpirationTime = expirationTime
                }
            } else if (alternate !== null && alternate.childExpirationTime < expirationTime) {
                alternate.childExpirationTime = expirationTime
            }

            if (node.return === null && node.tag === HostRoot) {
                root = node.stateNode
                break
            }
            node = node.return
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
    return root
}

export function shedulerWork(fiber, expirationTime) {
    const root = markUpdateTimeFromFiberToRoot(fiber, expirationTime)
    
}
