import { createWorkInProgress } from './fiber';
import {
	getIteratorFn,
	REACT_ELEMENT_TYPE,
	REACT_FRAGMENT_TYPE,
	REACT_PORTAL_TYPE,
} from './ReactSymbols';
import { Fragment, HostText } from './workTags';
import { Placement, Deletion } from './sideEffectTags';
import { emptyRefsObject } from './fiberClassComponent';

const isArray = Array.isArray;

/**
 * 遍历clone current的第一层child 将他们赋给workInProgress
 * @param {*} current
 * @param {*} workInProgress
 */
export function cloneChildFiber(current, workInProgress) {
	// invariant(
	//     current === null || workInProgress.child === current.child,
	//     'Resuming work not yet implemented.',
	// );
	// 为什么要return？
	if (workInProgress.child === null) {
		return;
	}
	//
	const currentChild = workInProgress.child;
	let newChild = createWorkInProgress(
		currentChild,
		currentChild.pendingProps,
		currentChild.expirationTime,
	);
	workInProgress.child = newChild;

	newChild.return = workInProgress;
	while (currentChild.sibling !== null) {
		currentChild = currentChild.sibling;
		newChild = newChild.sibling = createWorkInProgress(
			currentChild,
			currentChild.pendingProps,
			currentChild.expirationTime,
		);
		currentChild.sibling.return = workInProgress;
	}
	// 最后一个fiber的兄弟节点置为null
	newChild.sibling = null;
}

/**
 *
 * @param {*} shouldTrackSideEffects
 * 这个包装函数存在是因为：我希望clone代码在每个路径上为了能够通过早期的分支独立地优化每个分支。这个需要一个编译器或者我们手工做到；
 */
function ChildReconciler(shouldTrackSideEffects) {
	function deleteChild(returnFiber, childToDelete) {
		if (!shouldTrackSideEffects) {
			return;
		}

		// 删除是一个倒序 所以我们把它添加到最前面 ??? 不是最后面吗？
		// 此时 返回fiber的除了空的effect list 所以我们把这个deletion添加到list上。剩余的effects不会添加知道complete阶段;
		// 一旦恢复执行 这可能除了问题
		const last = returnFiber.lastEffect;
		if (last !== null) {
			last.nextEffect = childToDelete;
			returnFiber.lastEffect = childToDelete;
		} else {
			returnFiber.firstEffect = returnFiber.lastEffect = childToDelete;
		}

		childToDelete.nextEffect = null;
		childToDelete.effectTag = Deletion;
	}

	function deleteRemainingChildren(returnFiber, currentFirstChild) {
		//
		if (!shouldTrackSideEffects) {
			return;
		}

		let childToDelete = currentFirstChild;
		while (childToDelete !== null) {
			deleteChild(returnFiber, childToDelete);
			childToDelete = childToDelete.sibling;
		}
		return null;
	}

	function useFiber(fiber, pendingProps, expirationTime) {
		// 我们当前把兄弟节点设为null index为0 因为很容易把它忘了
		const clone = createWorkInProgress(fiber, pendingProps, expirationTime);
		clone.index = 0;
		clone.sibling = null;
		return clone;
	}

	function coerceRef(returnFiber, current, element) {
		let mixedRef = element.ref;
		if (
			mixedRef !== null &&
			typeof mixedRef === 'function' &&
			typeof mixedRef !== 'object'
		) {
			// TODO warning
		}
		if (element._owner) {
			const owner = element._owner;
			let inst;
			if (owner) {
				const ownFiber = owner;
				inst = ownFiber.stateNode;
			}
			const stringRef = '' + mixedRef;
			if (
				current !== null &&
				current.ref !== null &&
				typeof current.ref === 'function' &&
				current.ref._stringRef === stringRef
			) {
				// 各种判断
				return current.ref;
			}
			const ref = function(value) {
				let refs = inst.refs;
				// 第一次创建
				if (refs === emptyRefsObject) {
					refs = inst.refs = {};
					if (value === null) {
						delete refs[stringRef];
					} else {
						refs[stringRef] = value;
					}
				}
			};
			ref._stringRef = stringRef;
			return ref;
		} else {
			// WARNING
		}
	}

	function placeSingleChild(newFiber) {
		// 这是简单的单一child情况 我们只需要为插入一个新children做一个放置
		// 为什么mount的时候为false？？
		if (shouldTrackSideEffects && newFiber.alternate === null) {
			newFiber.effectTag = Placement;
		}
		return newFiber;
	}

	function reconcileSingleTextNode(
		returnFiber,
		currentFirstChild,
		textContent,
		expirationTime,
	) {
		// text 没有必要比较key 因为我们没有定义它的方式
		if (currentFirstChild !== null && currentFirstChild.tag === HostText) {
			// 我们已经有了一个存在的节点 所以只要更新它然后删除剩余的节点
			deleteRemainingChildren(returnFiber, currentFirstChild.sibling);
			const existing = useFiber(
				currentFirstChild,
				textContent,
				expirationTime,
			);
			existing.return = returnFiber;
			return existing;
		}
		// 存在的节点不是text节点 我么你需要创建一个新的节点删除存在的节点
		deleteRemainingChildren(returnFiber, currentFirstChild);
		const created = createFiberFromText(
			textContent,
			returnFiber.mode,
			expirationTime,
		);
		created.return = returnFiber;
		return created;
	}

	function reconcileSingleElement(
		returnFiber,
		currentFirstChild,
		element,
		expirationTime,
	) {
		const key = element.key; // JSX转换的element
		let child = currentFirstChild;
		// 找到可以重用的老节点 找到删除兄弟节点 根据老节点生成新节点返回
		// 删除旧的fiber
		while (child !== null) {
			if (child.key === key) {
				if (
					child.tag === Fragment
						? element.type === REACT_FRAGMENT_TYPE
						: child.elementType === element.type
				) {
					// 因为只有一个节点 一个匹配上了 只要把兄弟节点删了就好
					deleteRemainingChildren(returnFiber, child.sibling);

					const existing = useFiber(
						child,
						element.type === REACT_FRAGMENT_TYPE
							? element.props.children
							: element.props,
						expirationTime,
					);
					existing.ref = coerceRef(returnFiber, child, element);
					existing.return = returnFiber;

					return existing;
				} else {
					// 不是相同的key 直接删除当前
					deleteRemainingChildren(returnFiber, child);
					break;
				}
			} else {
				deleteChild(returnFiber, child);
			}
			child = child.sibling;
		}

		// 创将新的fiber

		if (element.type === REACT_FRAGMENT_TYPE) {
			// TODO
		} else {
			const created = createFiberFromElement(
				element,
				returnFiber.mode,
				expirationTime,
			);
			created.ref = coerceRef(returnFiber, currentFirstChild, element);
			created.return = returnFiber;
			return created;
		}
	}

	function updateTextNode(returnFiber, current, textContent, expirationTime) {
		if (current === null || current.tag !== HostText) {
			const created = createFiberFromText(
				textContent,
				returnFiber.mode,
				expirationTime,
			);
			created.return = returnFiber;
			return created;
		} else {
			const existing = useFiber(current, textContent, expirationTime);
			existing.return = returnFiber;
			return existing;
		}
	}

	function updateElement(returnFiber, current, element, expirationTime) {
		// type相同可以重用
		if (current !== null && current.elementType === element.type) {
			const existing = useFiber(current, element.props, expirationTime);
			existing.ref = coerceRef(returnFiber, current, element);
			existing.return = returnFiber;
			return existing;
		} else {
			const created = createFiberFromElement(
				element,
				returnFiber.mode,
				expirationTime,
			);
			created.ref = coerceRef(returnFiber, current, element);
			created.return = returnFiber;
			return created;
		}
	}

	function updateSlot(returnFiber, oldFiber, newChild, expirationTime) {
		const key = oldFiber !== null ? oldFiber.key : null;
		if (typeof newChild === 'string' || typeof newChild === 'number') {
			// 文本节点是没有key的 如果旧节点有nkey 我们继续替换它
			if (key !== null) {
				return null;
			}
			return updateTextNode(
				returnFiber,
				oldFiber,
				'' + newChild,
				expirationTime,
			);
		}

		if (typeof newChild === 'object' && newChild !== null) {
			switch (newChild.$$typeof) {
				case REACT_ELEMENT_TYPE: {
					if (newChild.key === key) {
						if (newChild.type === REACT_FRAGMENT_TYPE) {
							// TODO
						}
						return updateElement(
							returnFiber,
							oldFiber,
							newChild,
							expirationTime,
						);
					} else {
						return null;
					}
				}
				// TODO REACT_PORTAL_TYPE
			}
		}

		if (isArray(newChild) || getIteratorFn(newChild)) {
			if (key !== null) {
				return null;
			}

			// TODO

			// return updateFragment(
			// 	returnFiber,
			// 	oldFiber,
			// 	newChild,
			// 	expirationTime,
			// 	null,
			// );
		}
    }
    
    function placeChild(newFiber, lastPlacedIndex, newIndex) {
        newFiber.index = newIndex
        if (!shouldTrackSideEffects) {
            return lastPlacedIndex
        }

        const current = newFiber.alternate
        if (current !== null) {
            const oldIndex = current.index
            if (oldIndex < lastPlacedIndex) {
                // 这是一个移动
                newFiber.effectTag = Placement
                return lastPlacedIndex
            } else {
                // 不是移动
                return oldIndex
            }
        } else {
            // 插入操作
            newFiber.effectTag = Placement
            return lastPlacedIndex
        }
    }

	function reconcileChildrenArray(
		returnFiber,
		currentFirstChild,
		newChildren,
		expirationTime,
	) {
		// 这个算法不能从两端进行搜索 因为在fiber上没有返回指针; 至于加不加这个指针要看看当前的能走多远 我们可以以后再加

		// TODO 即使双向的优化 。。。。

		let resultingFirstChild = null;
		let previousNewFiber = null;

		let oldFiber = currentFirstChild;
		let lastPlacedIndex = 0;
		let newIdx = 0;
		let nextOldFiber = null;

		for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
			if (oldFiber.index > newIdx) {
				//
				nextOldFiber = oldFiber;
				oldFiber = null;
			} else {
				nextOldFiber = oldFiber.sibling;
			}
			const newFiber = updateSlot(
				returnFiber,
				oldFiber,
				newChildren[newIdx],
				expirationTime,
			);

			if (newFiber === null) {
				// fiber我null 说明不能重用
				if (oldFiber === null) {
					// ??????
					oldFiber = nextOldFiber;
				}
				break;
			}
			if (shouldTrackSideEffects) {
				// TODO
				if (oldFiber && newFiber.alternate === null) {
					// We matched the slot, but we didn't reuse the existing fiber, so we
                    // need to delete the existing child.
                    // 老的 fiber存在 但是新的alternate不存在 说明没有重用老的fiber 所以要移除 那说明需要删除
					deleteChild(returnFiber, oldFiber);
				}
            }
            lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx)
            if (previousNewFiber === null) {
                // 
                resultingFirstChild = newFiber
            } else {
                previousNewFiber.sibling = newFiber
            }
            previousNewFiber = newFiber
            oldFiber = nextOldFiber
		}
	}

	function reconcileChildFibers(
		returnFiber,
		currentFirstChild,
		newChild,
		expirationTime,
	) {
		// 这个方法不是一个递归
		// 如果顶级是一个数组 我们就把他当成一组孩子节点 而不是一个fragment
		// 另一方面嵌套数组会被当成fragment 节点；递归发生在正常的流动

		// 把顶级的 没有keys的fragments当成数组处理
		// 这导致了一个模棱两个的局面在 <>{[...]}</> 和 <>...</>. 之间
		// 我们把这视为一种情况

		const isUnkeyedTopLevelFragment =
			typeof newChild === 'object' &&
			newChild !== null &&
			newChild.type === REACT_FRAGMENT_TYPE &&
			newChild.key === null;

		if (isUnkeyedTopLevelFragment) {
			newChild = newChild.props.children;
		}
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
				case REACT_PORTAL_TYPE: {
					// TODO
				}
			}
		}

		if (typeof newChild === 'string' || typeof newChild === 'number') {
			return placeSingleChild(
				reconcileSingleTextNode(
					returnFiber,
					currentFirstChild,
					'' + newChild,
					expirationTime,
				),
			);
		}

		if (isArray(newChild)) {
			return reconcileChildrenArray(
				returnFiber,
				currentFirstChild,
				newChild,
				expirationTime,
			);
		}

		// TODO Iterator处理
		// TODO 错误处理
	}

	return reconcileChildFibers;
}

export const reconcileChildFibers = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false);
