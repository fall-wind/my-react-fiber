import { createContainer, updateContainer } from '../react-reconciler';

/**
 * 内部只有回调
 * then方法添加回调：如果任务已经被提交，则直接调用；
 * _onCommit 提交：执行callback数组内的回调； 如果已经提交则返回；
 */
class ReactWork {
	constructor() {
		this._callback = null;
		this._didCommit = false;
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
		for (let i = 0; i < callbacks.length; i++) {
			const callback = callbacks[i];
			callbacks();
		}
	}
}

class ReactRoot {
	constructor(container) {
		const root = createContainer(container);
		this._internalRoot = root;
	}

	render(children, callback) {
		const root = this._internalRoot;
		const work = new ReactWork();
		callback = callback === undefined ? null : callback; // ???
		if (callback !== null) {
			work.then(callback);
		}
		updateContainer(children, root, work._onCommit);
		return work;
	}

	renderSubtreeIntoContainer() {}
}

function createRootFromDOMContainer(container) {
	let rootSibling;
	// 将container的子节点全部移除
	while ((rootSibling = container.lastChild)) {
		container.removeChild(rootSibling);
	}
	return new ReactRoot(container);
}

function renderSubtreeIntoContainer(
	parentComponent,
	children,
	container,
	callback,
) {
	let root = container._reactRootContainer;
	// 获取到container上的 root container 如果不存在 则说明是第一渲染 则创建哟个fiber root 对象
	if (!root) {
		root = container._reactRootContainer = createRootFromDOMContainer(
			container,
		);
		if (typeof callback === 'function') {
			const originCallback = callback;
			callback = function() {
				const instance = getPublicRootInstance;
				originCallback.call(instance);
			};
		}
		unbatchedUpdates(() => {
			// TODO
			// if (parentComponent != null) {
			// 	root.renderSubtreeIntoContainer(
			// 		parentComponent,
			// 		children,
			// 		callback,
			// 	);
			// } else {
			// 	root.render(children, callback);
			// }
			root.render(children, callback);
		});
	}
	return getPublicRootInstance(root._internalRoot);
}

const ReactDOM = {
	render(element, container, callback) {
		return renderSubtreeIntoContainer(
			null,
			element,
			container,
			callback,
		);
	},
};

export default ReactDOM
