import { NoWork } from './expirationTime';

function findNextExpirationTimeToWorkOn(completedExpirationTime, root) {
	// 这几个时间什么鬼？
	const earliestSuspendedTime = root.earliestSuspendedTime;
	const latestSuspendedTime = root.latestSuspendedTime;
	const earliestPendingTime = root.earliestPendingTime;
	const latestPingedTime = root.latestPingedTime;

	// 最早的更新时间 如果为NoWork 则使用最新pinged time
	let nextExpirationTimeToWorkOn =
		earliestPendingTime !== NoWork ? earliestPendingTime : latestPingedTime;

	// 如果当前没有进行的工作或pinged Work；检测是否有比我们刚刚完成的工作低优先级的suspended work
	if (
		nextExpirationTimeToWorkOn === NoWork &&
		(completedExpirationTime === NoWork ||
			latestSuspendedTime < completedExpirationTime) 
	) {
        // 更低优先级的suspended work 最希望被下一次commit。 
        // 再一次render这个work 以及与如果出现超时 说明可以commit ？
        nextExpirationTimeToWorkOn = latestSuspendedTime
    }
    
    let expirationTime = nextExpirationTimeToWorkOn;
    if (expirationTime !== NoWork && earliestSuspendedTime > expirationTime) {
        // 使用已知最早的过期时间
        expirationTime = earliestSuspendedTime
    }
    
    // 可暂时忽略
    root.nextExpirationTimeToWorkOn = nextExpirationTimeToWorkOn;
    root.expirationTime = expirationTime;
}

export function markPendingPriorityLevel(root, expirationTime) {
	// 暂不涉及错误捕获
	// root.didError = false
	// 更新最近和最早的进行时间
	const earliestPendingTime = root.earliestPendingTime;
	if (earliestPendingTime === NoWork) {
		root.earliestPendingTime = root.latestPendingTime = expirationTime;
	} else {
		if (earliestPendingTime < expirationTime) {
			root.earliestPendingTime = expirationTime;
		} else {
			const latestPendingTime = root.latestPendingTime;
			if (latestPendingTime > expirationTime) {
				// 去更新的范围 最早以最新
				root.latestPendingTime = expirationTime;
			}
		}
	}
	findNextExpirationTimeToWorkOn(expirationTime, root);
}
