import { NoWork } from './expirationTime'

class FiberRootNode {
    constructor(containerInfo) {
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

export function createFiberRoot(containerInfo) {
    const root = new FiberRootNode(containerInfo)
    const uninitializedFiber = createHostRootFiber(isConcurrent);
    // fiber 的 state属性对应着对应的节点 root的current代表当前的fiber
    root.current = uninitializedFiber
    uninitializedFiber.stateNode = root
    return root
}