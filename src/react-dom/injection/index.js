/**
 * // TODO
 * 注入
 * 1. 在workLoop的各个阶段注册事件 获取当时的关键上下文 beginWork completeWork;
 * 2. 相对应的就需要在代码内去植入对应的代码片段
 * 3. 源React的有类似的代码 但其针对于dev环境 对于使用者来说有点不开放
 */

// TODO 统一
export let shouldRecord = false;
export let performPhase = null
export let current = null;
export let workLoopPhase = null;
export let triggerFun = null;

export function setCurrentWorkLoopPhase(phase) {
    // TODO
    if (!shouldRecord) {
        return
    }
	workLoopPhase = phase;
}

// 上下文
export function setCurrentContext(fiber, phase) {
    if (!shouldRecord) {
        return
    }
	triggerFun && triggerFun(fiber, phase);
	current = fiber;
}

export function setCurrentFiber(fiber, phase) {
    if (!shouldRecord) {
        return
    }
	triggerFun && triggerFun(fiber, phase);
	current = fiber;
	workLoopPhase = null;
}

export function getCurrentPerformPhase() {
    return performPhase
}

export const customInjection = {
	setTriggerFun(fun) {
		shouldRecord = true;
		triggerFun = fun;
    },
    setPerformPhase(nextPhase) {
        performPhase = nextPhase
    },
};

export default customInjection;
