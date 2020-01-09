# double buffer
在应用更新的时候会创建两个fiber，有时候更新fiber上的某个属性需要同时更新两个fiber
上的值比如 `updateQueue`和`expirationTime`