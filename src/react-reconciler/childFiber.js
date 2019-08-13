import {
	REACT_FRAGMENT_TYPE,
	REACT_ELEMENT_TYPE,
} from '../shared/ReactSymbols';
import { createFiberFromElement, createFiberFromText } from './fiber';
import { Placement, Deletion } from '../shared/ReactSideEffectTags';
import { HostText } from './workTags';

// ref 需符合格式
function coerceRef(returnFiber, current, element) {
	let mixedRef = element.ref;
	if (
		mixedRef !== null &&
		typeof mixedRef !== 'object' &&
		typeof mixedRef !== 'function'
	) {
		// TODO
	}
	return mixedRef;
}

function ChildReconciler(shouldTrackSideEffects) {
	function deleteChild(returnFiber, childToDelete) {
		if (!shouldTrackSideEffects) {
			return null;
		}
		// 将要删除的fiber 放置到父节点的 effectList上
		const last = returnFiber.lastEffect;
		if (last !== null) {
			last.nextEffect = childToDelete;
			returnFiber.lastEffect = childToDelete;
		} else {
			returnFiber.firstEffect = returnFiber.lastEffect = childToDelete;
		}
		childToDelete.nextEffect = null;
		childToDelete.effectTag |= Deletion;
	}

	function deleteRemainingChildren(returnFiber, currentFirstChild) {
		if (!shouldTrackSideEffects) {
			return null;
		}
		let childToDelete = currentFirstChild;
		// 递归删除
		while (childToDelete !== null) {
			deleteChild(returnFiber, childToDelete);
			childToDelete = childToDelete.sibling;
		}
		return null;
	}

	function createChild(returnFiber, newChild, expirationTime) {
		//
		if (typeof newChild === 'string' || typeof newChild === 'number') {
			const created = createFiberFromText(
				'' + newChild,
				returnFiber.mode,
				expirationTime,
			);
			created.return = returnFiber;
			return created;
		}

		if ((typeof newChild === 'object') !== null) {
			switch (newChild.$$typeof) {
				case REACT_ELEMENT_TYPE: {
					const created = createFiberFromElement(
						newChild,
						returnFiber.mode,
						expirationTime,
					);
					created.ref = coerceRef(returnFiber, null, newChild);
					created.return = returnFiber;
					return created;
				}
			}
			// TODO
			// if (isArray(newChild) || getIteratorFn(newChild)) {
			if (isArray(newChild)) {
				const created = createFiberFromFragment(
					newChild,
					returnFiber.mode,
					expirationTime,
					null,
				);
				created.return = returnFiber;
				return created;
			}
		}
		return null;
	}

	function placeChild(newFiber, lastPlacedIndex, newIndex) {
		newFiber.index = newIndex;
		if (!shouldTrackSideEffects) {
			return lastPlacedIndex;
		}

		// TODO
		const current = newFiber.alternate;
		if (current !== null) {
		}
	}

	function placeSingleChild(fiber) {
		if (shouldTrackSideEffects && fiber.alternate === null) {
			fiber.effectTag != Placement;
		}
		return fiber;
	}

	function reconcileChildrenArray(
		returnFiber,
		currentFirstChild,
		newChildren,
		expirationTime,
	) {
		let resultingFirstChild = null;
		let previousNewFiber = null;

		let oldFiber = currentFirstChild;
		let lastPlacedIndex = 0;
		let newIdx = 0;
		let nextOldFiber = null;

		for (; oldFiber !== null && newIdx < newChildren.length; newIdx++) {
			// TODO 第一渲染 oldFiber为null
		}
		if (newIdx === newChildren.length) {
			// 已经遍历完毕 都可以重用 标记需要删除的没人
			deleteRemainingChildren(returnFiber, oldFiber);
			return resultingFirstChild;
		}

		if (oldFiber === null) {
			for (; newIdx < newChildren.length; newIdx++) {
				const newFiber = createChild(
					returnFiber,
					newChildren[newIdx],
					expirationTime,
				);

				if (newFiber === null) {
					continue;
				}
				lastPlacedIndex = placeChild(newFiber, lastPlacedIndex, newIdx);

				if (previousNewFiber === null) {
					resultingFirstChild = newFiber;
				} else {
					previousNewFibers.sibling = newFiber;
				}

			}
            return resultingFirstChild;
		}
	}

	function reconcileSingleTextNode(
		returnFiber,
		currentFirstChild,
		textContent,
		expirationTime,
	) {
		if (currentFirstChild !== null && currentFirstChild.tag === HostText) {
			deleteRemainingChildren(returnFiber, currentFirstChild.sibling);
			const existing = useFiber(
				currentFirstChild,
				textContent,
				expirationTime,
			);
			existing.return = returnFiber;
			return existing;
		}
		// 已存在的第一个child节点 不是一个text节点 所以我们需要创建一个新的 删除旧的
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
		const key = element.key;
		let child = currentFirstChild;
		while (child !== null) {
			// TODO
		}
		if (element.type === REACT_FRAGMENT_TYPE) {
			// TOOD
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

	function reconcileChildFibers(
		returnFiber,
		currentFirstChild,
		newChild,
		expirationTime,
	) {
		const isUnkeyedTopLevelFragment =
			typeof newChild === 'object' &&
			newChild !== null &&
			newChild.type === REACT_FRAGMENT_TYPE &&
			newChild.key === null;
		if (isUnkeyedTopLevelFragment) {
			newChild = newChild.props.children;
		}

		const isObject = typeof newChild === 'object' && newChild !== null;
		console.error(
			typeof newChild,
			'typeof newChild',
			newChild,
			newChild.$$typeof,
		);
		if (isObject) {
			switch (newChild.$$typeof) {
				case REACT_ELEMENT_TYPE: {
					return placeSingleChild(
						reconcileSingleElement(
							returnFiber,
							currentFirstChild,
							newChild,
							expirationTime,
						),
					);
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

		if (Array.isArray(newChild)) {
			return reconcileChildrenArray(
				returnFiber,
				currentFirstChild,
				newChild,
				expirationTime,
			);
		}
	}
	return reconcileChildFibers;
}

export const reconcileChildFibers = ChildReconciler(true);
export const mountChildFibers = ChildReconciler(false);
