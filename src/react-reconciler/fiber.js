import { HostRoot, IndeterminateComponent, ClassComponent, HostComponent } from './workTags';

function shouldConstruct(Component) {
    const prototype = Component.prototype;
    return !!(prototype && prototype.isReactComponent);
  }

function FiberNode(tag, pendingProps, key, mode) {
	// Instance
	this.tag = tag;
	this.key = key;
	this.elementType = null;
	this.type = null;
	this.stateNode = null;

	// Fiber
	this.return = null;
	this.child = null;
	this.sibling = null;
	this.index = 0;

	this.ref = null;

	this.pendingProps = pendingProps;
	this.memoizedProps = null;
	this.updateQueue = null;
	this.memoizedState = null;
	this.contextDependencies = null;

	this.mode = mode;

	// Effects
	this.effectTag = NoEffect;
	this.nextEffect = null;

	this.firstEffect = null;
	this.lastEffect = null;

	this.expirationTime = NoWork;
	this.childExpirationTime = NoWork;

	this.alternate = null;
}

function createFiber(tag, pendingProps, key, mode) {
	return new FiberNode(tag, pendingProps, key, mode);
}

export function createHostRootFiber() {
	return createFiber(HostRoot, null, null);
}

// 创建另一条用于工作的fiber
export function createWorkInProgress(current, pendingProps, expirationTime) {
    const workInProgress = current.workInProgress
    if (workInProgress === null) {
        workInProgress = createFiber(
            current.tag,
            pendingProps,
            current.key,
            current.mode,
        )
        workInProgress.elementType = current.elementType;
        workInProgress.type = current.type;
        workInProgress.stateNode = current.stateNode;

        workInProgress.alternate = current;
        current.alternate = workInProgress;
    } else {
        workInProgress.pendingProps = pendingProps
        // reset effect tag
        workInProgress.effectTag = NoEffect;

        workInProgress.nextEffect = null;
        workInProgress.firstEffect = null;
        workInProgress.lastEffect = null;
    }
    workInProgress.childExpirationTime = current.childExpirationTime;
    workInProgress.expirationTime = current.expirationTime;

    workInProgress.child = current.child;
    workInProgress.memoizedProps = current.memoizedProps;
    workInProgress.memoizedState = current.memoizedState;
    workInProgress.updateQueue = current.updateQueue;
    workInProgress.contextDependencies = current.contextDependencies;

    // These will be overridden during the parent's reconciliation
    workInProgress.sibling = current.sibling;
    workInProgress.index = current.index;
    workInProgress.ref = current.ref;

    return workInProgress;
}

export function createFiberFromTypeAndProps(
    type,
    key,
    pendingProps,
    owner,
    mode,
    expirationTime,
) {
    let fiber;
    let fiberTag =  IndeterminateComponent
    const resolvedType = type
    if (typeof type === 'function') {
        if (shouldConstruct(type)) {
            fiberTag = ClassComponent
        }
    } else if (typeof type === 'string') {
        fiberTag = HostComponent
    } else {
        getTag: switch(type) {
            // TODO
            case REACT_MEMO_TYPE:
                fiberTag = MemoComponent;
                break getTag;
            case REACT_FORWARD_REF_TYPE:
                fiberTag = ForwardRef;
                break getTag;
        }
    }

    fiber = createFiber(fiberTag, pendingProps, key, mode);
    fiber.elementType = type;
    fiber.type = resolvedType;
    fiber.expirationTime = expirationTime;
  
    return fiber;
}

export function createFiberFromElement(element, mode, expirationTime) {
    let owner = null
    const type = element.type
    const key = element.key
    const pendingProps = element.props

    const fiber = createFiberFromTypeAndProps(
        type,
        key,
        pendingProps,
        owner,
        mode,
        expirationTime,
    )
    return fiber
}

export function createFiberFromText(
    content,
    mode,
    expirationTime,
) {
    const fiber = createFiber(HostText, content, null, mode);
    fiber.expirationTime = expirationTime;
    return fiber;
}
