import { msToExpirationTime, computeAsyncExpiration } from './expirationTime'

const now = Date.now

// Working Phase
const NotWorking = 0;
const BatchedPhase = 1;
const LegacyUnbatchedPhase = 2;
const FlushSyncPhase = 3;
const RenderPhase = 4;
const CommitPhase = 5;

let renderExpirationTime = NoWork
let workInProgressRoot = 

let workPhase = NotWorking
let initialTimeMs = now()
let currentEventTime = NoWork

export function requestCurrentTime() {
	if (workPhase === RenderPhase || workPhase === CommitPhase) {
        // We're inside React, so it's fine to read the actual time.
        // 1000 * 60 = 60000
        // 1000 * 60 * 60 = 3600000
        // 1000 * 60 * 60 * 24 = 86400000
		return msToExpirationTime(now() - initialTimeMs);
	}
	// We're not inside React, so we may be in the middle of a browser event.
	if (currentEventTime !== NoWork) {
		// Use the same start time for all updates until we enter React again.
		return currentEventTime;
	}
	// This is the first update since React yielded. Compute a new start time.
	currentEventTime = msToExpirationTime(now() - initialTimeMs);
	return currentEventTime;
}

export function computeExpirationForFiber(currentTime, fiber) {
    if (workPhase === RenderPhase) {
        return renderExpirationTime
    }
    let expirationTime;
    // 省略其他代码
    expirationTime = computeAsyncExpiration(currentTime);
    if (workInProgressRoot !== null && expirationTime === renderExpirationTime) {
        expirationTime -= 1
    }
    return expirationTime
}
