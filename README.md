read react16.x sourse code and try to wirte a simple react with hooks, async update, etc.
Rolled up my sleeves is doing -- 撸起袖子就是干

# 初衷

百见不如一干，撸起袖子就是干。虽说最好的理解是重新实现一个react，奈何能力有限，所以只能从头‘抄’一个react

本项目可以视作阅读React源码做的阅读笔记，目的：一为理解其宏观，细节功能的实现 二为实现一个简单可用的react。

react 版本 16.9.0; 目前是[react](https://github.com/facebook/react)master分支的 `3eb40d` commit

# 进度

- [ ] 第一渲染到屏幕上
  - [x] renderRoot
    - [x] beginWork
    - [x] completeUnitOfWork
  - [x] commitRoot
  - [ ] 其中很多细节未实现 例如：设置host组件属性完善 目前只针对HostComponent、HostRoot FunctionComponent Hooks 也为支持
- [ ] 更新过程 & 事件系统
- [ ] Hooks
- [ ] 异步渲染

# 愿景

在理解整个React系统的前提下，产出系列文章。根据自己的理解 用动画的形式展示出初次渲染、更新过程。预计大致文章涉及

- React初次渲染
- React更新过程（同步/异步） 调度
- React的hook实现原理
- React ClassComponent的生命周期执行时机
- React的事件系统 （已有一篇同行的优秀文章）

可以维护一个像babel的try-out的网页 输入一段react代码 动态展现react fiber的创建过程 以及其他？
