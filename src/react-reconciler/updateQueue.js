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
    }
}

export function equeueUpdate(fiber, update) {
    // 先找到workInProcess上的updateQueue
    const alternate = fiber.alternate
    // 第一次渲染 alternate为null ？
    let queue1;
    let queue2;
    if (alternate === null) {
        queue1 = fiber.updateQueue
        if (queue1 === null) {
            queue1 = createUpdateQueue
        }
    }
}