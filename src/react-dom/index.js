import {
	createContainer,
	updateContainer,
	getPublicRootInstance,
} from '../react-reconciler';
import { unbatchedUpdates } from '../react-reconciler/ReactFiberWorkLoop'
import { LegacyRoot } from '../shared/ReactRootTags';
import './ReactDOMClientInjection';

/**
 * 内部只有回调
 * then方法添加回调：如果任务已经被提交，则直接调用；
 * _onCommit 提交：执行callback数组内的回调； 如果已经提交则返回； 只可以提交一次 处于提交状态then直接执行
 */
class ReactWork {
	constructor() {
		this._callback = null;
		this._didCommit = false;
		this._onCommit = this._onCommit.bind(this);
	}

	then(onCommit) {
		if (this._didCommit) {
			onCommit();
			return;
		}
		let callback = this._callback || [];
		callback.push(onCommit);
	}

	_onCommit() {
		if (this._didCommit) {
			return;
		}
		this._didCommit = true;
		const callbacks = this._callback;
		if (callbacks === null) {
			return;
		}
		for (let i = 0; i < callbacks.length; i++) {
			const callback = callbacks[i];
			callback();
		}
	}
}

function commonRootRender(children, callback) {
	const root = this._internalRoot;
	const work = new ReactWork();
	callback = callback === undefined ? null : callback; // ???
	if (callback !== null) {
		work.then(callback);
	}
	updateContainer(children, root, work._onCommit);
	return work;
}

function commonUnmount(callback) {
    const root = this._internalRoot
    const work = new ReactWork()
    callback = callback === undefined ? null : callback
    if (callback !== null) {
        work.then(callback)
    }
    updateContainer(null, root, null, work._onCommit)
    return work
}

class ReactRoot {
	constructor(container) {
		const root = createContainer(container);
		this._internalRoot = root;
	}

	render = commonRootRender;

	renderSubtreeIntoContainer() {}
}

function ReactSyncRoot(container, tag) {
	const root = createContainer(container, tag);
	this._internalRoot = root;
}

ReactSyncRoot.prototype.render = commonRootRender;
ReactSyncRoot.prototype.unmount = commonUnmount;

function createRootFromDOMContainer(container, forceHydrate) {
	let rootSibling;
	// 将container的子节点全部移除
	while ((rootSibling = container.lastChild)) {
		container.removeChild(rootSibling);
	}
	return new ReactSyncRoot(container, LegacyRoot);
}

function renderSubtreeIntoContainer(
	parentComponent,
	children,
	container,
	forceHydrate,
	callback,
) {
	let root = container._reactRootContainer;
    // 获取到container上的 root container 如果不存在 则说明是第一渲染 则创建哟个fiber root 对象
    let fiberRoot;
	if (!root) {
		root = container._reactRootContainer = createRootFromDOMContainer(
			container,
			forceHydrate,
		);
		fiberRoot = root._internalRoot;
		if (typeof callback === 'function') {
			const originCallback = callback;
			callback = function() {
				const instance = getPublicRootInstance(fiberRoot);
				originCallback.call(instance);
			};
		}
		unbatchedUpdates(() => {
            updateContainer(children, fiberRoot, parentComponent, callback)
		});
	} else {
        // TODO
    }
	return getPublicRootInstance(root._internalRoot);
}

const ReactDOM = {
	render(element, container, callback) {
		return renderSubtreeIntoContainer(
			null,
			element,
			container,
			false,
			callback,
		);
	},
};

export default ReactDOM;
