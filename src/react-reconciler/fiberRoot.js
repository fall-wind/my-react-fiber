import { NoWork } from './expirationTime'
import { createHostRootFiber } from './fiber'
import { noTimeout } from './ReactDOMHostConfig'
class FiberRootNode {
    constructor(containerInfo, hydrate) {
        this.current = null;
        this.containerInfo = containerInfo;
        this.pendingChildren = null;
        this.pingCache = null;
        this.pendingCommitExpirationTime = NoWork;
        this.finishedWork = null;
        this.timeoutHandle = noTimeout;
        this.context = null;
        this.pendingContext = null;
        this.hydrate = hydrate;
        this.firstBatch = null;
        this.callbackNode = null;
        this.callbackExpirationTime = NoWork;
        this.firstPendingTime = NoWork;
        this.lastPendingTime = NoWork;
        this.pingTime = NoWork;
    }
}

export function createFiberRoot(containerInfo, tag) {
    const root = new FiberRootNode(containerInfo, tag)
    const uninitializedFiber = createHostRootFiber(tag);
    // fiber 的 state属性对应着对应的节点 root的current代表当前的fiber
    root.current = uninitializedFiber
    uninitializedFiber.stateNode = root
    return root
}