import {
	FunctionComponent,
	HostComponent,
	HostPortal,
	HostRoot,
	HostText,
	IncompleteClassComponent,
} from '../shared/ReactWorkTags';
import {
	NoEffect as NoHookEffect,
	UnmountSnapshot,
	UnmountMutation,
	MountMutation,
	UnmountLayout,
	MountLayout,
	UnmountPassive,
	MountPassive,
} from './ReactHookEffectTags';
import { ContentReset, Placement } from '../shared/ReactSideEffectTags';
import {
    insertInContainerBefore,
    insertBefore,
    appendChildToContainer,
    appendChild,
} from './ReactDOMHostConfig'

function commitHookEffectList(unmountTag, mountTag, finishedWork) {
	const updateQueue = finishedWork.updateQueue;

	let lastEffect = updateQueue !== null ? updateQueue.lastEffect : null;

	if (lastEffect !== null) {
		const firstEffect = lastEffect.next;
		let effect = firstEffect;
		do {
			if ((effect.tag & unmountTag) !== NoHookEffect) {
				const destory = effect.destory;
				effect.destory = undefined;
				if (destory !== undefined) {
					destory();
				}
			}

			if ((effect.tag & mountTag) !== NoHookEffect) {
				const create = effect.create;
				effect.destory = create();
			}

			effect = effect.next;
		} while (effect !== null);
	}
}

function isHostParent(fiber) {
	return (
		fiber.tag === HostComponent ||
		fiber.tag === HostRoot ||
		fiber.tag === HostPortal
	);
}

function getHostParentFiber(fiber) {
	let parent = fiber.return;
	while (parent !== null) {
		if (isHostParent(parent)) {
			return parent;
		}
		parent = parent.return;
	}
}

function getHostSibling(fiber) {
	// let parent = fiber.return
	// let sibling = fiber.sibling
	// while (parent !== null) {
	//     if (isHostParent(sibling)) {
	//         return sibling
	//     }
	//     parent = sibling.return
	//     sibling = parent.sibling
	// }

	let node = fiber;
	siblings: while (true) {
		// 向上找到一个有分叉的且是 Host组件的节点
		while (node.sibling === null) {
			if (node.return === null || isHostParent(node.return)) {
				return null;
			}
			node = node.return;
		}

		node.sibling.return = node.return;
		node = node.sibling;

		while (
			node.tag !== HostComponent &&
			node.tag !== HostText
			//   node.tag !== DehydratedSuspenseComponent // TODO
		) {
			if (node.effectTag & Placement) {
				// 没有 child ？
				continue siblings;
			}

			if (node.child === null || node.tag === HostPortal) {
				continue siblings;
			} else {
				node.child.return = node;
				node = node.child;
			}
		}

		if (node.effectTag & Placement) {
			return node.stateNode;
		}
	}
}

export function commitBeforeMutationLifeCycles(current, finishedWork) {
	switch (finishedWork.tag) {
		case FunctionComponent: {
			commitHookEffectList(UnmountSnapshot, NoHookEffect, finishedWork);
		}

		case HostRoot:
		case HostComponent:
		case HostText:
		case HostPortal:
		case IncompleteClassComponent:
			// Nothing to do for these component types
			return;
	}
}

export function commitPlacement(finishedWork) {
	// 找到最近的 拥有dom实例的父节点
	const parentFiber = getHostParentFiber(finishedWork);

	let parent;
	let isContainer;
	const parantStateNode = parentFiber.stateNode;
	switch (parentFiber.tag) {
		case HostComponent:
			parent = parantStateNode;
			isContainer = false;
			break;
		case HostRoot:
			parent = parantStateNode.containerInfo;
			isContainer = true;
			break;
		case HostPortal:
			parent = parentStateNode.containerInfo;
			isContainer = true;
			break;
	}

	if (parentFiber.effectTag & ContentReset) {
		// TODO
	}

	const before = getHostSibling(finishedWork);

	let node = finishedWork;

	while (true) {
		const isHost = node.tag === HostComponent || node.tag === HostText;

		if (isHost) {
			const stateNode = isHost ? node.stateNode : node.stateNode.instance;
			if (before) {
				if (isContainer) {
					insertInContainerBefore(parent, stateNode, before);
				} else {
					insertBefore(parent, stateNode, before);
				}
			} else {
				if (isContainer) {
					appendChildToContainer(parent, stateNode);
				} else {
					appendChild(parent, stateNode);
				}
			}
		} else if (node.tag === HostPortal) {
			// TODO
		} else if (node.child !== null) {
			node.child.return = node;
			node = node.child;
			continue;
		}
		if (node === finishedWork) {
			return;
		}
		// 这个在completeWork 不是做过一次吗？
		while (node.sibling === null) {
			if (node.return === null || node.return === finishedWork) {
				return;
			}
			node = node.return;
		}
		node.sibling.return = node.return;
		node = node.sibling;
	}
}

export function commitWork(current, finishedWork) {
	switch (finishedWork.tag) {
		case FunctionComponent:
		case ForwardRef:
		case MemoComponent:
		case SimpleMemoComponent: {
			// Note: We currently never use MountMutation, but useLayout uses
			// UnmountMutation.
			commitHookEffectList(UnmountMutation, MountMutation, finishedWork);
			return;
		}
		case HostComponent: {
			const instance = finishedWork.stateNode;
			if (instance != null) {
				const newProps = finishedWork.memoizedProps;

				const oldProps =
					current !== null ? current.memoizedProps : newProps;

				const type = finishedWork.type;

				const updatePayload = finishedWork.updateQueue;
				finishedWork.updateQueue = null;
				if (updatePayload !== null) {
					commitUpdate(
						instance,
						updatePayload,
						type,
						oldProps,
						newProps,
						finishedWork,
					);
				}
				return;
			}
		}
	}
}
