

class ReactRoot {
    constructor(container) {
        const root = createContainer(container)
    }
}

function createRootFromDOMContainer(container) {
    let rootSibling;
    // 将container的子节点全部移除
    while((rootSibling = container.lastChild)) {
        container.removeChild(rootSibling)
    }
    return new ReactRoot(container)
}

function renderSubtreeIntoContainer(
    parentComponent,
    children,
    container,
    callback,
) {
    let root = container._reactRootContainer
    // 获取到container上的 root container 如果不存在 则说明是第一渲染 则创建哟个fiber root 对象
    if (!root) {
        root = container._reactRootContainer = createRootFromDOMContainer(container)
    }
}

const ReactDOM = {
    render(element, container, callback) {

    }
}