本文主要讲述expirationTime的计算

# requestCurrentTime
```javascript
export function requestCurrentTime() {
  if (workPhase === RenderPhase || workPhase === CommitPhase) {
    // We're inside React, so it's fine to read the actual time.
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
```

- 如果我们正处于react的计算之中，需要重新计算实际的时间
- 如果我们不处于react的计算之中，我们可能存在浏览器事件的中间 所以返回与所有更新相同的时间直到下一次进入到React之中
- 自从React挂起时 这是第一次更新 所以重新计算时间

这里有几个关键点 在以后会解释清楚

- workPhase
- currentEventTime
- yielded

让我们保留疑问继续向下

# msToExpirationTime
```javascript
const UNIT_SIZE = 10
const MAX_SIGNED_31_BIT_INT = 1073741823
const MAGIC_NUMBER_OFFSET = MAX_SIGNED_31_BIT_INT - 1

// 1 unit of expiration time represents 10ms.
function msToExpirationTime(ms: number): ExpirationTime {
  // Always add an offset so that we don't clash with the magic number for NoWork.
  return MAGIC_NUMBER_OFFSET - ((ms / UNIT_SIZE) | 0);
}
```

一个最小的 expirationTime为十毫秒 是通过原数除以十再取整得到的

传入的参数 `now() - initialTimeMs` initialTimeMs为固定值为初始进入React的时间，而当前时间与initialTime的时间差的毫秒数大致范围为：

- 1000 * 1 = 1000 s
- 1000 * 60 = 60000 min
- 1000 * 60 * 60 = 3600000 hour
- 1000 * 60 * 60 * 24 = 86400000 day

如果按小时算 大致范围 0 -- 10000000，再除以 `UNIT_SIZE` 在 0 -- 10000000 远小于 `MAGIC_NUMBER_OFFSET`;
所以msToExpirationTime返回的是一个九位或十位数；

# computeExpirationForFiber

```javascript
const expirationTime = computeExpirationForFiber(currentTime, current);

function computeExpirationForFiber(currentTime, fiber) {
    // ...
    if (workPhase === RenderPhase) {
        return renderExpirationTime
    }
    expirationTime = computeAsyncExpiration(currentTime);

    if (workInProgressRoot !== null && expirationTime === renderExpirationTime) {
        expirationTime -= 1
    }
}
```
如果当期正处于 Render阶段 则返回当前的`renderExpirationTime`；

如果计算的到期时间与当前的`renderExpirationTime`相等则说明：我们正处于渲染一个树中，这个树已经正在render 不要在同一个`expirationTime` 则`expirationTime`减一

# computeAsyncExpiration
```javascript
function ceiling(num, precision) {
	return (((num / precision) | 0) + 1) * precision;
}

function computeExpirationBucket(currentTime, expirationInMs, bucketSizeMs) {
	return (
		MAGIC_NUMBER_OFFSET -
		ceiling(
			MAGIC_NUMBER_OFFSET - currentTime + expirationInMs / UNIT_SIZE,
			bucketSizeMs,
		)
	);
}

function computeAsyncExpiration(currentTime) {
	return computeExpirationBucket(
		currentTime,
		LOW_PRIORITY_EXPIRATION,
		LOW_PRIORITY_BATCH_SIZE,
	);
}
```

Math有个ceil方法 是向上取整； 而这个 `ceiling` 这个方法也是向上取整 这个整的单位是 precision 此处为25;

举个例子：

```javascript
Math.ceil(1.2) === Math.ceil(1.1)
// true

ceiling(24, 25) === ceiling(23, 25)
// true

ceiling(26, 25) === ceiling(23, 25)
// false
```

假设我们进入到应用已经1s

```javascript
const currentTime = MAGIC_NUMBER_OFFSET - 100
const firstParamsOfCeiling = MAGIC_NUMBER_OFFSET - currentTime + expirationInMs / UNIT_SIZE
// 100 + 5000 / 10 = 600

const secondParamsOfCeiling = bucketSizeMs / UNIT_SIZE
// 25

const ceilingFunVal = 625

const expirationTime = MAGIC_NUMBER_OFFSET - 625

// 我们规整一下上面计算的ceilingFunVal
function accTime(passTime) {
    return ceiling((passTime / 10 | 0) + 600, 25)
}
```

这里的25 转换为时间大概为 25 * 10 = 250ms （在msToExpirationTime 除以了一个UNIT_SIZE），也就是说在250ms内得到的expirationTime大部分相同 为什么是大部分相同尼？考虑到：

```javascript
Math.ceil(0.9) === Math.ceil(1.1)

ceiling(26, 25) === ceiling(24, 25)

accTime(249) === accTime(250)
// false 625 650

```

// TODO 
对于这种情况 React如何处理 我们先待定

所以最后得到的 expirationTime 是一个非常大的值 随着时间向后推移 expirationTime的值会越来越小




## 几个time

- expirationTime
- childExpirationTime
- firstPendingTime
- lastPendingTime
- pingTime
- finishedExpirationTime
- pendingPassiveEffectsExpirationTime



