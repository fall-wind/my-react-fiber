import {
	IndeterminateComponent,
	FunctionComponent,
	ClassComponent,
	HostRoot,
	HostComponent,
	HostText,
    HostPortal,
} from '../shared/ReactWorkTags';
import { Placement } from '../shared/ReactSideEffectTags'
import {
	supportsMutation,
	createTextInstance,
	createInstance,
	appendInitialChild,
	finalizeInitialChildren,
} from './ReactDOMHostConfig';
import { getRootHostContainer, getHostContext } from './fiberHostContext';

let appendAllChildren;
let updateHostContainer;
let updateHostComponent;
let updateHostText;

function markUpdate(workInProgress) {
	// Tag the fiber with an update effect. This turns a Placement into
	// a PlacementAndUpdate.
	workInProgress.effectTag |= Update;
}

function markRef(workInProgress) {
	workInProgress.effectTag |= Ref;
}

if (supportsMutation) {
	updateHostContainer = function(parent, workInProgress) {
        // TODO
        // NOTHING
	};

	appendAllChildren = function(
		parent,
		workInProgress,
		needsVisibilityToggle,
		isHidden,
	) {
		let node = workInProgress.child;
		while (node !== null) {
			if (node.tag === HostComponent || node.tag === HostText) {
				appendInitialChild(parent, node.stateNode);
			} else if (false) {
				// TODO
			} else if (node.tag === HostPortal) {
				// TODO
			} else if (node.child !== null) {
                // Q 重新设置 return 是为什么 在 createFiber不是已经做了吗
				node.child.return = node;
				node = node.child;
				continue;
			}

			if (node === workInProgress) {
				return;
			}

			while (node.sibling === null) {
				if (node.return === null || node.return === workInProgress) {
					return;
				}
				node = node.return;
            }
            // Q 重新设置 return 是为什么 在 createFiber不是已经做了吗
			node.sibling.return = node.return;
			node = node.sibling;
		}
	};
}

// 主要创建dom节点 并将各个 fiber对应的dom节点连接起来 child append到 parent上
function completeWork(current, workInProgress, renderExpirationTime) {
	const newProps = workInProgress.pendingProps;

	switch (workInProgress.tag) {
		case IndeterminateComponent:
			break;
		case FunctionComponent:
			break;
		case HostRoot: {
			// popHostContainer(workInProgress);
			// Context
			const fiberRoot = workInProgress.stateNode;
			if (fiberRoot.pendingContext) {
				fiberRoot.context = fiberRoot.pendingContext;
				fiberRoot.pendingContext = null;
			}
			if (current === null || current.child === null) {
				workInProgress.effectTag &= ~Placement;
			}
            updateHostContainer(workInProgress);
            break;
		}
		case HostComponent: {
			// 省略context 服务端渲染代码
			const type = workInProgress.type;
			// 已生成
			if (current !== null && workInProgress.stateNode !== null) {
				updateHostComponent;
			} else {
				let instance = createInstance(
					type,
					newProps,
                    // rootContainerInstance,
                    {},
                    // currentHostContext,
                    {},
					workInProgress,
				);
				appendAllChildren(instance, workInProgress, false, false);
				if (
					finalizeInitialChildren(
						instance,
						type,
						newProps,
						// rootContainerInstance,
                        // currentHostContext,
                        {},
                        {},
					)
				) {
					markUpdate(workInProgress);
				}
				workInProgress.stateNode = instance;

				if (workInProgress.ref !== null) {
					markRef(workInProgress);
				}
            }
            break
		}
		case HostText: {
			// 创建stateNode
			let newText = newProps;
			if (current && workInProgress.stateNode != null) {
				//
			} else {
				const rootContainerInstance = getRootHostContainer();
				const currentHostContext = getHostContext();
				workInProgress.stateNode = createTextInstance(
					newText,
					rootContainerInstance,
					currentHostContext,
					workInProgress,
				);
			}
			break;
		}
    }
    return null;
}

export { completeWork };
