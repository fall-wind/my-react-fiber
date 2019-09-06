# React的第一次渲染过程浅析

本篇文章暂时讨论`Sync`模式（同步）,源码为[16.9](https://github.com/facebook/react/tree/v16.9.0)，部分源码内容不讨论（hooks classComponent等等相关的代码）。

## a demo

先看一段react的代码

```javascript
import React from 'react'
function Counter(props) {
  return (
	  <div>
		  <div>{props.count}</div>
		  <button
			  onClick={() => {
				  console.log('l am button')
			  }}
		  >
			  add
		  </button>
	  </div>
	);
}

function App(props) {
  return <Counter count="12" key="12" />;
}

ReactDOM.render(<App />, document.getElementById('app'));
```

jsx语法可以通过[`babel`](https://babeljs.io/)对应的jsx插件需要转义成可执行的代码（[try it out](https://babeljs.io/repl)）， 上述代码`<App />`:
```javascript
// 转义后的代码
function App(props) {
  return React.createElement(CounterButton, {
    key: "12"
  });
}

// 结果
{
    $$typeof: Symbol(react.element),
    key: null,
    props: {},
    ref: null,
    type: ƒ App(props),
}
```

## 创建fiberRoot

传入`ReactDOM.render`函数的三个参数`element`、 `container`、`callback`

`container`的`_reactRootContainer`属性在第一次创建是不存在的，先要创建它

```javascript
// ReactDOM.js
let rootSibling;
while ((rootSibling = container.lastChild)) {
  container.removeChild(rootSibling);
}
```
先将`container`即我们传入`div#app`的所有子节点删除 得到的结果:

```javascript
// root
{
  _internalRoot: {
    current: FiberNode,
    containerInfo: div#app,
    ...
  }
}
```

`current` 指向的是 root fiber节点, containerInfo 执行 dom元素 id为app的div

**unbatchedUpdates**

接着使用`unbatchedUpdates`调用`updateContainer`， `unbatchedUpdates`来自调度系统`ReactFiberWorkLoop`

```javascript
// ReactFiberWorkLoop.js
function unbatchedUpdates(fn, a) {
  const prevExecutionContext = executionContext;
  executionContext &= ~BatchedContext;
  executionContext |= LegacyUnbatchedContext;
  try {
    return fn(a);
  } finally {
    executionContext = prevExecutionContext;
    if (executionContext === NoContext) {
      flushSyncCallbackQueue();
    }
  }
}
```

全局变量`executionContext`代表当前的执行上下文, 初始化为 `NoContent`

```javascript
// ReactFiberWorkLoop.js

const NoContext = /*                    */ 0b000000;
const BatchedContext = /*               */ 0b000001;
const EventContext = /*                 */ 0b000010;
const DiscreteEventContext = /*         */ 0b000100;
const LegacyUnbatchedContext = /*       */ 0b001000;
const RenderContext = /*                */ 0b010000;
const CommitContext = /*                */ 0b100000;
```

`executionContext &= ~BatchedContext`代表什么含义尼？

首先 `&` 操作当且当两个位上都为1的时候返回1，`|` 只要有一位为`1`，返回`1`

`executionContext`则是这些Context组合的结果:  
将当前上下文添加`Render`：

```executionContext |= RenderContext``` 

判断当前是否处于`Render`阶段 

```executionContext &= RenderContext === NoContext```

去除`Render`:

```executionContext &= ~RenderContext```

`executionContext &= ~BatchedContext`则代表把当前上下文的`BatchedContext`标志位置为false，表示当前为非批量更新

在react源码中有很多类似的位运算，比如effectTag，workTag。

## reconciler（调和）

**updateContainer**

计算当前时间和当前的过期时间，因本文只讨论同步模式所以这里的`expirationTime`为
```javascript
// ReactFiberExpirationTime.js
const Sync = MAX_SIGNED_31_BIT_INT;

// ReactFiberWorkLoop.js
function computeExpirationForFiber(
  currentTime,
  fiber,
  suspenseConfig,
) {
  const mode = fiber.mode
  if ((mode & BatchedMode) === NoMode) {
    return Sync
  }
}
```
`expirationTime`越大，代表优先级越高，所以同步模式拥有最高的优先级。

在`updateContainerAtExpirationTime`创建于`context`相关内容，后续有专门文章介绍`context`，这里先不讨论。

**scheduleRootUpdate**

```javascript

// ReactFiberReconciler.js
function scheduleRootUpdate(
  current,
  element,
  expirationTime,
  suspenseConfig,
  callback,
) {
  const update = createUpdate(expirationTime, suspenseConfig);
  update.payload = {element};

  callback = callback === undefined ? null : callback;
  if (callback !== null) {
    update.callback = callback;
  }
  enqueueUpdate(current, update);
  scheduleWork(current, expirationTime);

  return expirationTime;
}
```

创建`update`，将callback添加到update上。
```javascript
{
  callback: null
  expirationTime: 1073741823
  next: null
  nextEffect: null
  payload: {element: {
    $$typeof: Symbol(react.element)
    key: null
    props: {}
    ref: null
    type: ƒ App(props)
  }}
  priority: 97
  suspenseConfig: null
  tag: 0
}
```

再更新添加到root fiber的更新队列上，指的一提的是这里的更新队列`updateQueue`也采用了双缓冲技术，两条`updateQueue`通过`alternate`属性
相互引用。这个链表大致为：
```javascript
{
  baseState: null
  firstCapturedEffect: null
  firstCapturedUpdate: null
  firstEffect: null
  firstUpdate: update
  lastCapturedEffect: null
  lastCapturedUpdate: null
  lastEffect: null
  lastUpdate: update
}
```

调用`scheduleWork`进入到调度阶段。

## scheduleWork（调度阶段）

```javascript
// ReactFiberWorkLoop.js
function scheduleUpdateOnFiber(fiber, expirationTime) {
  const root = markUpdateTimeFromFiberToRoot(fiber, expirationTime);

  if (expirationTime === Sync) {
    if (
      (executionContext & LegacyUnbatchedContext) !== NoContext &&
      (executionContext & (RenderContext | CommitContext)) === NoContext
    ) {
      let callback = renderRoot(root, Sync, true);
      while (callback !== null) {
        callback = callback(true);
      }
    }
  }
}
```

进入调度阶段，首先调用`markUpdateTimeFromFiberToRoot`将fiber上的更新时间，此时的fiber树只有一个root fiber光杆司令。
```javascript
// ReactFiberWorkLoop.js
function markUpdateTimeFromFiberToRoot() {
  if (fiber.expirationTime < expirationTime) {
    fiber.expirationTime = expirationTime;
  }
  ...
  let alternate = fiber.alternate;

  let node = fiber.return;
  let root = null;
  if (node === null && fiber.tag === HostRoot) {
    root = fiber.stateNode;
  } else {
    ...
  }
  return root
}
```
这里返回的root是个fiberRoot类型的节点。

继续往下，条件`expirationTime === Sync`符合  
```javascript
executionContext & LegacyUnbatchedContext) !== NoContext &&
executionContext & (RenderContext | CommitContext)) === NoContext
```
这里的两个位运算，在`unbatchedUpdates`方法内将初始化的上下文`NoContext`添加了`LegacyUnbatchedContext`上下文，所以这里得到的结果是真。

**renderRoot**

renderRoot阶段只要进行两部分工作：一个是workLoop循环，即render阶段 另一个为commitRoot，commit阶段

```javascript
// ReactFiberExpirationTime.js
const NoWork = 0

// ReactFiberWorkLoop.js
let workInProgressRoot = null
let renderExpirationTime = NoWork

function renderRoot(root, expirationTime) {
  ...
  if (root !== workInProgressRoot || expirationTime !== renderExpirationTime) {
    prepareFreshStack(root, expirationTime);
  } 
  ...

  /* renderRoot-code-branch-01 */
}
```
此时的 `workInProgressRoot`和`renderExpirationTime`都处于初始状态。

```javascript
function prepareFreshStack(root, expirationTime) {
  root.finishedWork = null;
  root.finishedExpirationTime = NoWork;
  ...
  workInProgressRoot = root;
  workInProgress = createWorkInProgress(root.current, null, expirationTime);
  renderExpirationTime = expirationTime;
  ...
}
```
`prepareFreshStack`顾名思义，准备一个新生的堆栈环境。  
首先将`finishedWork`相关的变量初始化。  
将`root`赋给全局变量`workInProgressRoot` 将`expirationTime`赋给`renderExpirationTime`  
为root.current即root fiber节点创建一个`workInProgress`节点，并将该节点赋给全局变量`workInProgress`。`fiber`节点也是应用了双缓冲，两个fiber节点通过`alternate`属性保存了对方的引用 在更新的过程中操作的是workInProgress节点。调度结束时 `workInProgress fiber`会替代`current fiber`。

```javascript
/* renderRoot-code-branch-01 */
if (workInProgress !== null) {
  const prevExecutionContext = executionContext;
  executionContext |= RenderContext;

  /* hooks-related ** start */
  let prevDispatcher = ReactCurrentDispatcher.current;
  if (prevDispatcher === null) {
    prevDispatcher = ContextOnlyDispatcher;
  }
  ReactCurrentDispatcher.current = ContextOnlyDispatcher;
  /* hooks-related ** end */

  /* workLoop */
}
```

此时的`workInProgress`为刚创建的那个节点。接着为当前的上下文添加`RenderContext`，标志着进入render阶段。
`hooks-related`这部分代码是与hooks先关的代码，在这过程中用户调用hooks相关的API都不是在`FunctionComponent`的内部，所以都会报错。

## render阶段

```javascript
function workLoopSync() {
  while (workInProgress !== null) {
    workInProgress = performUnitOfWork(workInProgress);
  }
}

/* workLoop */
do {
  try {
    if (isSync) {
      workLoopSync()
    }
  } catch (error) {
    // ...
  }
  break
} while (true)
```

workLoop过程是一个递归的过程 从root阶段向下遍历到叶子节点，再从叶子节点执行一些遍历的逻辑最后返回到root节点，这次过程执行`beginWork`，`completeWork`等操作，
在此过程中创建fiber节点组装fiber树，创建对应的dom节点等等。

文章开始的代码workLoop过程大致如下：

![workLoop gif](./static/workLoop-fiber.gif)

让我们开启workLoop之旅吧！
```javascript
function performUnitOfWork(unitOfWork) {
  const current = unitOfWork.alternate
  ...
  let next = beginWork(current, unitOfWork, renderExpirationTime)
  unitOfWork.memoizedProps = unitOfWork.pendingProps

  if (next === null) {
    next = completeUnitOfWork(unitOfWork)
  }

  return next
}
```

在这个循环过程 beginWork顺着element树的向下深度遍历 当遍历到叶子节点时，即next为null时， completeUnitOfWork则会定位next的值：

1. 当前节点 是否有兄弟节点， 有，返回进行下一次beginWork；无则转到2
2. 当前节点置为 父节点，父节点是否存在 存在，转到1；否则返回null

当然这两个过程所得工作不仅仅就是这样。
### beginWork

```javascript
// ReactFiberBeginWork.js
let didReceiveUpdate = false


function beginWork(
  current, workInProgress, renderExpirationTime
) {
  if (current !== null) {
    const oldProps = current.memoizedProps
    const newProps = workInProgress.pendingProps
    if (oldProps !== newProps || hasLegacyContextChanged()) {
      didReceiveUpdate = true;
    } else if (updateExpirationTime < renderExpirationTime) {
      ...
    }
  } else {
    didReceiveUpdate = true
  }

  workInProgress.expirationTime = NoWork;

  switch (workInProgress.tag) {
    case HostRoot: {
      return updateHostRoot(current, workInProgress, renderExpirationTime);
    }
    case 
  }
}
```

root fiber是存在`current fiber`的，但此时的`oldProps`和`newProps`都为null。虽然这里不讨论`context`，但是从
```
if (oldProps !== newProps || hasLegacyContextChanged()) {
  didReceiveUpdate = true;
}
```
我们可以看出旧的`context` API的低效。

在进入到`beginWork`之前先将`expirationTime`置为`NoWork`

**beginWork HostRoot**
root fiber对应的更新为`HostRoot`

```javascript
// ReactFiberBeginWork.js
function updateHostRoot(current, workInProgress, renderExpirationTime) {
  const updateQueue = workInProgress.updateQueue;
  const nextProps = workInProgress.pendingProps;
  const prevState = workInProgress.memoizedState;
  const prevChildren = prevState !== null ? prevState.element : null;
  processUpdateQueue(
    workInProgress,
    updateQueue,
    nextProps,
    null,
    renderExpirationTime,
  );

  const nextState = workInProgress.memoizedState;
  const nextChildren = nextState.element;
  
  if (nextChildren === prevChildren) {
    ...
  }
  const root = workInProgress.stateNode
  if ((current === null || current.child === null) && root.hydrate) {
    ...
  } else {
    reconcileChildren(
      current,
      workInProgress,
      nextChildren,
      renderExpirationTime,
    );
  }
  return workInProgress.child;
}
```
在`scheduleRootUpdate`创建的更新队列我们创建了一个更新队列，里面有一条更新。

`processUpdateQueue`对于所做的将队列清空 将`update`的`payload`合并到`updateQueue`的`baseState`属性 同时添加到workInProgress节点的`memoizedState`上
所以`nextChildren`就是`memoizedState`的`element`属性了。也就是

```javascript
{
  $$typeof: Symbol(react.element)
  key: null
  props: {}
  ref: null
  type: ƒ App(props)
}
```

接着`root.hydrate`这个判断是服务端渲染相关的代码，这里不涉及，所以走另一个分支

```javascript
// ReactFiberBeginWork.js
function reconcileChildren(
  current, workInProgress, nextChildren, renderExpirationTime
) {
  if (current === null) {
    workInProgress.child = mountChildFibers(
      workInProgress,
      null,
      nextChildren,
      renderExpirationTime,
    );
  } else {
    workInProgress.child = reconcileChildFibers(
      workInProgress,
      current.child,
      nextChildren,
      renderExpirationTime,
    );
  }
}
```
根据 current 是否存在 走不同的分支，`mountChildFibers`和`mountChildFibers`不同在于一个参数传递的问题。此时`current.child`为`null`

```javascript
// ReactChildFiber.js
const reconcileChildFibers = ChildReconciler(true);
const mountChildFibers = ChildReconciler(false);
```

**ChildReconciler**

`ChildReconciler`是一个高级函数，内部许多子方法，依次看来

```javascript
// ReactChildFiber.js
function ChildReconciler(shouldTrackSideEffects) {
  function reconcileChildFibers(
    returnFiber,
    currentFirstChild,
    newChild,
    expirationTime
  ) {
    // Fragment相关内容 先跳过
    const isUnkeyedTopLevelFragment = false
    const isObject = typeof newChild === 'object' && newChild !== null;

    if (isObject) {
      switch (newChild.$$typeof) {
        case REACT_ELEMENT_TYPE:
          return placeSingleChild(
            reconcileSingleElement(
              returnFiber,
              currentFirstChild,
              newChild,
              expirationTime,
            ),
          );
      }
    }

    /**  **/
  }
}
```
这里暂不讨论 Fragment相关内容 直接将标志位`isUnkeyedTopLevelFragment`置为假。这里的newChild对应着 App组件，`isObject`为真，且`newChild.$$typeof === REACT_ELEMENT_TYPE`。

**reconcileSingleElement placeSingleChild**
```javascript
// ReactChildFiber.js
function reconcileSingleElement(
  returnFiber,
  currentFirstChild,
  element,
  expirationTime
) {
  const key = element.key
  let child = currentFirstChild
  while(child !== null) {
    ...
  }
  if (element.type === REACT_FRAGMENT_TYPE) {
    ...
  } else {
    const created = createFiberFromElement(
      element,
      returnFiber.mode,
      expirationTime,
    );
    // to do
    // created.ref = coerceRef(returnFiber, currentFirstChild, element);
    created.return = returnFiber;
    return created;
  }
}

function placeSingleChild(newFiber) {
  if (shouldTrackSideEffects && newFiber.alternate === null) {
    newFiber.effectTag = Placement;
  }
  return newFiber
}
```
App组件对应的 fiber节点在之前并不存在，所以这里创建fiber节点 并将fiber的父节点设为 root fiber节点。之后在`placeSingleChild`为fiber的`effectTag`打上 `Placement`  
返回到`beginWork`的`updateHostRoot`， 接着返回`workInProgress.child`，返回到`completeUnitOfWork`函数内，

```javascript
next = beginWork()
if (next === null) {
  ...
}
return next
```
返回的为新创建的App对应的 fiber，所以beginWork继续执行。

回到刚才的`beginWork`。 
创建的Function Component组件fiber默认的tag为IndeterminateComponent，class Component会被指定为ClassComponent
```javascript
let fiber;
let fiberTag = IndeterminateComponent;
let resolvedType = type;
if (typeof type === 'function') {
  if (shouldConstruct(type)) {
    fiberTag = ClassComponent;
    ...
  } else {
    ...
  }
} else if (typeof type === 'string') {
  fiberTag = HostComponent;
}
```

回顾一下beginWork
```javascript
let didReceiveUpdate = false

function beginWork() {
  ...
  if (current !== null) {
    ...
  } else {
    didReceiveUpdate = false
  }

  switch (workInProgress.tag) {
    case IndeterminateComponent: {
      return mountIndeterminateComponent(
        current,
        workInProgress,
        workInProgress.type,
        renderExpirationTime,
      );
    }
  }
}

```
mountIndeterminateComponent大致代码：
```javascript
function mountIndeterminateComponent(
  _current,
  workInProgress,
  Component,
  renderExpirationTime
) {
  if (_current !== null) {
    ...
  }

  const props = workInProgress.pendingProps
  
  ...
  let value = renderWithHooks(
    null,
    workInProgress,
    Component,
    props,
    context,
    renderExpirationTime,
  );

  if (typeof value === 'object' && value !== null && typeof value.render === 'function') {
    ...
  } else {
    workInProgress.tag = FunctionComponent;
    reconcileChildren(null, workInProgress, value, renderExpirationTime);
  }

  return workInProgress.child;
}
```

这里的`renderWithHooks`先简单看成 `Component(props)`，后面部分介绍hooks相关代码。

返回的value为:
```javascript
React.createElement(Counter, {
  count: "12",
  key: "12"
})

// value
{
  $$typeof: Symbol(react.element)
  key: "12"
  props: {}
  ref: null
  type: ƒ CounterButton(props)
}
```


`reconcileChildren` --> `mountChildFibers`为`Counter`组件创建fiber与创建App的fiber逻辑基本相同。所不同的是effectTag没有被标记。

`beginWork` `Counter`， renderWithHooks 返回的是div，接着创建下一次beginWork的fiber。
```JavaScript
{
  $$typeof: Symbol(react.element)
  key: null
  props: {children: Array(2)}
  ref: null
  type: "div"
}
```

beginWork: HostComponent

```javascript
case HostComponent:
  return updateHostComponent(current, workInProgress, renderExpirationTime);
```

```javascript
// ReactDOMHostConfig.js
function shouldSetTextContent(type: string, props: Props): boolean {
  return (
    type === 'textarea' ||
    type === 'option' ||
    type === 'noscript' ||
    typeof props.children === 'string' ||
    typeof props.children === 'number' ||
    (typeof props.dangerouslySetInnerHTML === 'object' &&
      props.dangerouslySetInnerHTML !== null &&
      props.dangerouslySetInnerHTML.__html != null)
  );
}

// ReactFiberBeginWork.js
function updateHostComponent(
  current,
  workInProgress,
  renderExpirationTime,
) {
  const type = workInProgress.type
  const nextProps = workInProgress.pendingProps
  const prevProps = current !== null ? current.memoizedProps : null

  let nextChildren = nextProps.children
  const isDirectTextChild = shouldSetTextContent(type, nextProps)
  if (isDirectTextChild) {
    nextChildren = null
  } else if (...) {
    ...
  }

  reconcileChildren(
    current,
    workInProgress,
    nextChildren,
    renderExpirationTime,
  );
  return workInProgress.child;
}
```

这里的`pendingProps`，就是div的props 为 span button的数组。  
`shouldSetTextContent`则判断当前元素可不可以拥有子元素，或者children可以作为一个text节点 之后继续调用 `reconcileChildren` --> `mountChildFibers`

此时nextChildren是一个数组结构  在`ReactFiberChild`中`reconcileChildFibers`相应的代码：
```javascript
if (isArray(newChild)) {
  return reconcileChildrenArray(
    returnFiber,
    currentFirstChild,
    newChild,
    expirationTime,
  );
}

function reconcileChildrenArray(
  returnFiber,
  currentFirstChild,
  newChildren,
  expirationTime,
) {
  let resultingFirstChild: Fiber | null = null;
  let previousNewFiber: Fiber | null = null;

  let oldFiber = currentFirstChild;
  let lastPlacedIndex = 0;
  let newIdx = 0;
  let nextOldFiber = null;

  for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
    ...
  }

  if (newIdx === newChildren.length) {
    ...
  }

  if (oldFiber === null) {
    for (; newIdx < newChildren.length; newIdx++) {
      const newFiber = createChild(
        returnFiber,
        newChildren[newIdx],
        expirationTime,
      );
      if (newFiber === null) {
        continue;
      }
      lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);
      if (previousNewFiber === null) {
        // TODO: Move out of the loop. This only happens for the first run.
        resultingFirstChild = newFiber;
      } else {
        previousNewFiber.sibling = newFiber;
      }
      previousNewFiber = newFiber;
    }
    return resultingFirstChild;
  }
}
```

由于第一次创建 此时的`currentFirstChild`为null，`reconcileChildrenArray`代码很多，但是第一次用到的不多，主要遍历children 为它们创建fiber，并添加到fiber树上。
最后返回第一个child的fiber 也就是span对应的fiber。

接着对 span进行`beginWork`， 此时的`isDirectTextChild`标志位为true。nextChildren则为null。`reconcileChildFibers`结果返回null。

此时回到workLoop的`performUnitOfWork`，因为next为null，则进行下一步 `completeUnitOfWork`。


### completeUnitOfWork

```javascript
function completeUnitOfWork(unitOfWork) {
  workInProgress = unitOfWork
  do {
    const current = workInProgress.alternate
    const returnFiber = workInProgress.return

    if ((workInProgress.effectTag & Incomplete) === NoEffect) {
      let next = completeWork(current, workInProgress, renderExpirationTime);

      if (next !== null) {
        return null
      }
      ...
      /* completeUnitOfWork-code-01 */
    } else {
      ...
    }
    /* completeUnitOfWork-code-02 */
    const siblingFiber = workInProgress.sibling;
    if (siblingFiber !== null) {
      return siblingFiber;
    }
    workInProgress = returnFiber;
    /* completeUnitOfWork-code-02 */
  } while (workProgress !== null)
}
```

此时传入的unitOfWork为span对应的fiber。 将全局变量`workInProgress`赋值为`unitWork`

`(workInProgress.effectTag & Incomplete) === NoEffect`显然为true。调用`completeWork`返回下一次的工作内容

**completeWork**

```javascript
function completeWork(
  current,
  workInProgress,
  renderExpirationTime
) {
  const newProps = workInProgress.pendingProps
  switch (workInProgress.tag) {
    ...
    case HostComponent: {
      const rootContainerInfo = getRootHostContainer();
      const type = workInProgress.type;
      if (current !== null && workInProgress.stateNode != null) {
        ...
      } else {
        const currentHostContext = getHostContext();
        let instance = createInstance(
          type,
          newProps,
          rootContainerInstance,
          currentHostContext,
          workInProgress,
        );

        appendAllChildren(instance, workInProgress, false, false);

        if (
            finalizeInitialChildren(
              instance,
              type,
              newProps,
              rootContainerInstance,
              currentHostContext,
            )
          ) {
            markUpdate(workInProgress);
          }
          workInProgress.stateNode = instance;
      }
    }
  }
  return null;
}
```

此处的`rootContainerInfo`先把他认为是`div#app`，继续忽略`currentHostContext`。创建过程可以理解为三步：

1. createInstance： 创建dom等
2. appendAllChildren： 将children的host Component添加到刚创建的dom上 组成dom树。
3. finalizeInitialChildren： 给dom设置属性。

先详细看一下`createInstance`实现

```javascript
// ReactDOMComponentTree.js
export function updateFiberProps(node, props) {
  node[internalEventHandlersKey] = props;
}

export function precacheFiberNode(hostInst, node) {
  node[internalInstanceKey] = hostInst;
}

// ReactDOMHostConfig
function createInstance(
  type,
  props,
  rootContainerInstance,
  hostContext,
  internalInstanceHandle
) {
  const domElement: Instance = createElement(
    type,
    props,
    rootContainerInstance,
    parentNamespace,
  );
  precacheFiberNode(internalInstanceHandle, domElement);
  updateFiberProps(domElement, props);
  return domElement;
}
```
`createElement`先暂时理解为 document.createElement  
`precacheFiberNode`则是 将fiber实例添加到dom上。  
`updateFiberProps` 将fiber实例添加到dom上  

虽然是一样将fiber添加到dom上 通过key的命名可以发现用途不同，`updateFiberProps`是为事件系统做准备的。`internalInstanceKey`估计就是为了保持引用，取值判断等用途

`appendAllChildren` 这里先跳过，到complete div的时候具体分析一下。


由于是第一次渲染也就不存在diff props的过程，这里的`finalizeInitialChildren`的职责也相对简单些，设置dom元素的一些初始值。在设置初始值的时候对应不同的dom元素有特殊的处理，这些部分我们也先跳过

```javascript
export function finalizeInitialChildren(
  domElement: Instance,
  type: string,
  props: Props,
  rootContainerInstance: Container,
  hostContext: HostContext,
): boolean {
  setInitialProperties(domElement, type, props, rootContainerInstance);
  // return shouldAutoFocusHostComponent(type, props);
  ...
}

function setInitialProperties(
  domElement,
  tag,
  rawProps,
  rootContainerElement,
) {
  ...
  const isCustomComponentTag = true
  switch (tag) {
    ...
  }
  setInitialDOMProperties(
    tag,
    domElement,
    rootContainerElement,
    props,
    isCustomComponentTag,
  );
}

function setInitialDOMProperties(
  tag,
  domElement,
  rootContainerElement,
  nextProps,
) {
  for (const propKey in nextProps) {
    if (!nextProps.hasOwnProperty(propKey)) {
      continue;
    }
    const nextProp = nextProps[propKey];
    if (propKey === STYLE) {
      ...
    } else if (propKey === DANGEROUSLY_SET_INNER_HTML) {
      ...
    } else if (propKey === CHILDREN) {
      if (typeof nextProp === 'string') {
        const canSetTextContent = tag !== 'textarea' || nextProp !== '';
        if (canSetTextContent) {
          setTextContent(domElement, nextProp);
        }
      } else if (typeof nextProp === 'number') {
        setTextContent(domElement, '' + nextProp);
      }
    } else if (registrationNameModules.hasOwnProperty(propKey)) {
      ...
    } else if (nextProp != null) {
      setValueForProperty(domElement, propKey, nextProp, isCustomComponentTag);
    }
  }
}
```

在设置dom属性的时候，有几个注意点 一个是style属性的设置 最终的style属性是字符串，而我们写的则是属性名是驼峰命名的对象。感兴趣的可自行查看[setValueForStyles](https://github.com/facebook/react/blob/v16.9.0/packages/react-dom/src/shared/CSSPropertyOperations.js#L62)。

span的children属性是被当做文字节点设置
```javascript
// setTextContent.js
function(node, text) {
  if (text) {
    let firstChild = node.firstChild;
    if (
      firstChild &&
      firstChild === node.lastChild &&
      firstChild.nodeType === TEXT_NODE
    ) {
      firstChild.nodeValue = text;
      return;
    }
  }
  node.textContent = text;
}
```


回到`completeWork`，最后将创建的dom添加到fiber的`stateNode`属性上，返回null 结束`completeWork`调用

返回到`completeUnitOfWork`的`/* completeUnitOfWork-code-01 */`

```javascript
/* completeUnitOfWork-code-01 */
if (
  returnFiber !== null
  && (returnFiber.effectTag & Incomplete) === NoEffect
) {
  if (returnFiber.effect === null) {
    returnFiber.firstEffect = workInProgress.firstEffect
  }

  if (workInProgress.lastEffect !== null) {
    if (returnFiber.lastEffect !== null) {
      returnFiber.lastEffect.nextEffect = workInProgress.firstEffect;
    }
    returnFiber.lastEffect = workInProgress.lastEffect;
  }

  const effectTag = workInProgress.effectTag;

  if (effectTag > PerformedWork) {
    if (returnFiber.lastEffect !== null) {
      returnFiber.lastEffect.nextEffect = workInProgress;
    } else {
      returnFiber.firstEffect = workInProgress;
    }
    returnFiber.lastEffect = workInProgress;
  }
}
```

将span节点的 effectList归并到父组件上（但此时span fiber上并没有effect）, 此时子组件没有任何effect，且 effectTag 为 0。

```javascript
/* completeUnitOfWork-code-02 */
const siblingFiber = workInProgress.sibling;
if (siblingFiber !== null) {
  return siblingFiber;
}
workInProgress = returnFiber;
/* completeUnitOfWork-code-02 */
```

`/* completeUnitOfWork-code-02 */`，如果当前节点有兄弟节点，则返回，没有则返回父节点继续 completeWork。  
此时span有一个创建了fiber但是没有进行beginWork的兄弟节点`button`。

button节点经历过`beginWork`, `completeWork`，又回到了`/* completeUnitOfWork-code-02 */`处。button 节点没有兄弟节点，workInProgress被置为了 div 节点，进行
div的 `completeWork`。

div的completeWork与 span和button不同之处在于`appendAllChildren`，之前跳过的部分现在分析一下

```javascript
function appendAllChildren(
  parent,
  workInProgress,
) {
  let node = workInProgress.child;
  while (node !== null) {
    if (node.tag === HostComponent || node.tag === HostText) {
      // condition 01
      appendInitialChild(parent, node.stateNode.instance);
    } else if (...*2) {

    } else if (node.child !== null) {
      // condition 03
      node.child.return = node;
      node = node.child;
      continue;
    }

    if (node === workInProgress) {
      return null
    }

    // condition 04
    while (node.sibling === null) {
      if (node.return === null || node.return === workInProgress) {
        return;
      }
      node = node.return;
    }
    node.sibling.return = node.return;
    node = node.sibling;
  }
}
```

div的child为 span且满足 `condition 01`，将span添加到div上，轮到button fiber 同样将 button 添加到div 上。
`condition 04`处 是当前的返回出口：找到最后一个sibling，在向上查找到 div节点 返回。

我们实际应用中，上述的 div>span-button 算是最简单操作。有很多想 div 与 span、button 又隔了一层Function/Class Component。此时就需要利用到
`condition 03` 继续向child查找，查找各个分叉向下距离`workInProgress`最近的host节点，将他们添加到`workInProgress`对应的dom上，这样dom树才能完整构成。

这样 div`completeWork`就完成了，继续到`Counter`组件：

`Component`组件的`completeWork`是直接被`break`，所以这里只需要将effectList归并到父节点。

由`/* completeUnitOfWork-code-02 */`节点到`Counter`的returnFiber`App` 节点，App节点与其他节点不同的地方在于其`effectTag`为3。这是怎么来的尼？还记得我们的 root fiber节点在`beginWork`时与其他节点不同的地方在于：它是有 `current`节点的，所以作为children的App，在[`placeSingleChild`](https://github.com/facebook/react/blob/v16.9.0/packages/react-reconciler/src/ReactChildFiber.js#L348)的时候`effectTag`被添加了`Placement`，在`beginWork`的[`mountIndeterminateComponent`](https://github.com/facebook/react/blob/v16.9.0/packages/react-reconciler/src/ReactFiberBeginWork.js#L1293)时，`Component`组件的`effectTag`被添加了`PerformedWork`。

回归一下`/* completeUnitOfWork-code-01 */`处代码，只有到App满足`effectTag > PerformedWork`，在之前出现的 host 节点的`effectTag` 都为0，`Function`节点都为 1（`PerformedWork`），都不符合添加effect的要求。所以到此时才有一个`effect`，它被添加到了root Fiber上。

root fiber的`completeWork`，它的`tag`为 `HostRoot`

```javascript
// ReactFiberCompleteWork.js

updateHostContainer = function (workInProgress) {
  // Noop
};

case HostRoot: {
  ...
  if (current === null || current.child === null) {
    workInProgress.effectTag &= ~Placement;
  }
  // updateHostContainer(workInProgress)
}
```

这里current.child为null，因为我们之前beginWork时，改变的是workInProgress节点，这里将`Placement effectTag`取消。结束 completeWork。

这时我们已经到达了root节点，做一些收尾工作

```javascript
// ReactWorkLoop.js
function completeUnitOfWork(unitOfWork) {
  workInProgress = unitOfWork
  do {

  } while (workInProgress !== null)

  if (workInProgressRootExitStatus === RootIncomplete) {
    workInProgressRootExitStatus = RootCompleted;
  }
  return null;
}
```

`workLoopSync`结束之后，将执行上下文由`RenderContext`重置为上次的执行环境
```javascript
root.finishedWork = root.current.alternate;
root.finishedExpirationTime = expirationTime;
```
之后将`workLoop`所做的工作添加到root的`finishedWork`上

`workLoopSync`部分， 也可以成为render阶段到此结束。回顾一下在此期间所做的主要工作。

- 创建各个节点对应的workInProgress fiber节点
- 创建dom节点，设置属性，连接构成dom树（并未append到container上）
- 为节点打上effectTag，构建完整的effectList链表，从叶子节点归并到root fiber节点上。

## commit阶段

继续回来`renderRoot`
```javascript
function commitRoot() {
  ...
  workInProgressRoot = null

  switch (workInProgressRootExitStatus) {
    case RootComplete: {
      ...
      return commitRoot.bind(null, root);
    }
  }
}
```

将`workInProgressRoot`置为null，在completeWork时将`workInProgressRootExitStatus`置为了`RootCompleted`，之后进入commitRoot阶段。



暂不讨论优先级调度相关的代码,[完整代码戳我](https://github.com/facebook/react/blob/v16.9.0/packages/react-reconciler/src/ReactFiberWorkLoop.js#L1515) 这里看成：
```javascript
function commitRoot(root) {
  commitRootImpl.bind(null, root, renderPriorityLevel)
  if (rootWithPendingPassiveEffects !== null) {
    flushPassiveEffects();
  }
  return null;
}
```

- commitBeforeMutationEffects
- commitMutationEffects
- commitLayoutEffects
commitRoot源码主要内容是以上遍历`effectList`的三个循环，看看他们做了什么吧

```JavaScript

let nextEffect = null

function commitRootImpl(root, renderPriorityLevel) {
	const finishWork = root.finishWork
	const expirationTime = root.finishedExpirationTime
	...

	root.finishedWork = null;
	root.finishedExpirationTime = NoWork;
	
	let firstEffect
	if (finishedWork.effectTag > PerformedWork) {
		// 将自身effect添加到effect list上
		...
	}

	if (firstEffect !== null) {
		const prevExecutionContext = executionContext;
		executionContext |= CommitContext;
		
		do {
			try {
				commitBeforeMutationEffects();
			} catch (error) {
				..
			}
		} while (nextEffect !== null)

		...

		...
		nextEffect = null;
		executionContext = prevExecutionContext;
	}

}
```

先获取effectList，在render阶段生成的effect list并不包含自身的effect，这里先添加（但此时finishedWork.effectTag其实为0），获取完整的effectList。
之后把当前的执行上下文置为`CommitContext`, 正式进入commit阶段。

此时`effectList`其实就是App节点的`workInProgress fiber`。这里有一个全局变量`nextEffect`表示当前正在处理的effect

**commitBeforeMutationEffects**

```javascript
function commitBeforeMutationEffects() {
	while (nextEffect !== null) {
		if ((nextEffect.effectTag & Snapshot) !== NoEffect) {
			...
			const current = nextEffect.alternate;
			commitBeforeMutationEffectOnFiber(current, nextEffect);
			...
		}
		nextEffect = nextEffect.nextEffect;
  }
}
```

这个App fiber上的`effectTag`为 3 （Placement | Update）,这个循环直接跳过了

```javascript
function commitMutationEffects() {
	while (nextEffect !== null) {
		const effectTag = nextEffect.effectTag
		...

		let primaryEffectTag = effectTag & (Placement | Update | Deletion)

		switch (primaryEffectTag) {
			...
			case PlacementAndUpdate: {
				commitPlacement(nextEffect)
				nextEffect.effectTag &= ~Placement;

        // Update
        const current = nextEffect.alternate;
        commitWork(current, nextEffect);
			}
		}

		nextEffect = nextEffect.nextEffect;
	}
}
```

**commitPlacement**

[`commitPlacement`](https://github.com/facebook/react/blob/v16.9.0/packages/react-reconciler/src/ReactFiberCommitWork.js#L995)主要是把dom元素添加到对应的父节点上，对于第一次渲染其实也只是将div添加到`div#app`上。并将当前的`effectTag update`去掉。


**commitWork**
```javascript
// ReactFiberCommitWork.js
function commitWork(current, finishedWork) {
	switch (finishedWork.tag) {
		case FunctionComponent:
    case ForwardRef:
    case MemoComponent:
    case SimpleMemoComponent: {
      // Note: We currently never use MountMutation, but useLayout uses
      // UnmountMutation.
      commitHookEffectList(UnmountMutation, MountMutation, finishedWork);
			return;
		
		case HostComponent: {
			...
		}
	}
}

```

这里commitWork有涉及到hook组件的部分，这里暂时跳过。
对于 host组件其实是有前后props diff的部分，这里是第一次渲染，所以也就不存在，所以这里也没有多少第一渲染需要做的工作。

**commitLayoutEffects**
```javascript
// ReactFiberWorkLoop.js

import { commitLifeCycles as commitLayoutEffectOnFiber } from 'ReactFiberCommitWork'

function commitLayoutEffects() {
	while (nextEffect !== null) {
		const effectTag = nextEffect.effectTag;
		if (effectTag & (Update | Callback)) {
      recordEffect();
      const current = nextEffect.alternate;
      commitLayoutEffectOnFiber(
        root,
        current,
        nextEffect,
        committedExpirationTime,
      );
		}
		...
		nextEffect = nextEffect.nextEffect
	}
	...
}
```

App fiber上的effectTag现在剩下1(PerformedWork)，并不符合所以当当循环也跳出。顺便一提，如果我们的ReactDOM.render有callback的话 将会在这里执行。

	三个循环结束之后将nextEffect置为null；执行上下文变更成之前的执行上下文。

```javascript
function commitRootImpl() {
	...
	if ((executionContext & LegacyUnbatchedContext) !== NoContext) {
    return null;
	}
}
```
现在我们的执行上下文还剩下在`upbatchedUpdate`添加的`LegacyUnbatchedContext`，所以这里直接返回。到这里我们第一渲染过程到这也就基本结束了。

总结一下commit工作：

1. 处理beginWork产出 finishedWork的effectList
2. 将dom添加到屏幕上（div#app container）
3. callback调用
4. hooks相关逻辑（未涉及）
5. classComponent的生命周期逻辑（未涉及）
6. 其他

本文在走源码的时候也有有许多部分没有涵盖 或者直接跳过的地方：

- 更新过程 hooks组件更新 classComponent setState更新
- Hooks
- ClassComponent、 SimpleMemoComponent、HostPortal、SuspenseComponent、SuspenseListComponent等
- 事件相关
- context ref 等
- scheduler模块
- 其他

## 尾声
本文是笔者跟着源码debugger写出来的文章，对于缺失的部分，计划慢慢会有对应的介绍部分。另外本文属于流水账类型的文章，分析部分非常少，忘大家多多包涵、提提意见，你的参与就是我的动力。
