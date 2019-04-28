## fiber更新

单个节点时：
新的子节点为单个节点时；遍历fiber的child节点 找到key相同的 如果type相同则将后续的子节点删除 结束遍历；如果不同则删除当前节点跳出循环，说明当前没有可以重用的老节点；

数组节点时：

遍历新老两个fiber链表

代码中的第一个循环，有一种情况会触发break：当newFiber为null

newFiber来自于`updateSlot`，当老节点不能复用时 返回的为null；这时候还需要将oldFiber还原成被设置的nextOldFiber

```javascript
if (oldFiber.index > newIdx) {
    nextOldFiber = oldFiber
    oldFiber = null
}

if (shouldTrackSideEffects) {
    if (oldFiber === null && newFiber.alternate === null) {

    }
}
```

## issue

在将root添加到schedule时 一个fiberRoot 只会在这个链表出现一次；
如果你多次setState 只会更新

**finishWork是什么**
finishWork是一个root

- firstEffect lastEffect组成的 effectList
  - 每个effect都是一个需要更新的fiber  `updateQueue !== null`
- updateQueue
  - updateQueue是个数组 目前看到两种类型： ['children', 4] { baseState: { element: 'xxxx' } }



**renderRoot**
在renderRoot的时候会禁用掉hooks功能？


**nextUnitOfWork**

这个unitWork应该是个fiber

**performUnitOfWork**

**在什么阶段 workInProgress替代了current**

**为什么在开始阶段要将过期时间清空**

**react hooks的实现**


**fiber的memoizedState**

```javascript
???
const memoizedState = {
    element: null
}
```

**beginWork做了什么**
- 生成更新队列 updateQueue

为每个react element创建对应的fiber与workInProgress

**processUpdate做了什么**

三个更新时间

- 当前的更新时间
- 更新队列中不在此次优先级剩余的update中优先级最高的更新时间
- 每个更新的过期时间

遍历更新队列 对足够高优先级的update，计算出新的state 如果含有callback将这个callback添加到effectList上标记tag为`Callback`

计算出显得state 添加到队列的baseState上

**对于同一个fiber会不会计算多次？**


fiber `contextDependencies`


**reconcileChildrenArray的优化 为什么不是双向的？**
