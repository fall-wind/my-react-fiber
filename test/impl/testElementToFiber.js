// import { createHostRootFiber } from '../src/react-reconciler/fiber'

/**
 * just test
 */
function FiberNode(tag, props, key) {
	this.tag = tag;
	this.pendingProps = props;
	this.key = key;

	this.return = null;
	this.child = null;
	this.sibling = null;
}

function createFiber(...args) {
	return new FiberNode(...args);
}

const element = {
	props: {
		children: [
			{ type: 'div', props: { value: '1' }, key: '1' },
			{
				type: 'span',
				props: {
					value: '2',
					children: [
						{
							type: 'div',
							props: {
								value: '2-1',
								children: [
                                    {
                                        type: 'div',
                                        props: { value: '2-1-1' },
                                        key: '2-1-1',
                                    },
                                ],
							},
							key: '2-1',
						},
					],
				},
				key: '2',
			},
			{ type: 'span', props: { value: '3' }, key: '3' },
		],
		value: 'root',
	},
	type: 'div',
};

function convertElementToFiberTree(element, pFiber) {
	let curElement = element;
	let parentFiber = pFiber || null;
	const { props = {}, key, type } = curElement;
	const { children = [] } = props;
	const fiber = createFiber(type, props, key);
    fiber.return = parentFiber;
	if (children && children.length) {
		let preChildFiber = null;
		for (let i = 0; i < children.length; i++) {
			const child = children[i];
			const childFiber = convertElementToFiberTree(child, fiber);
			// console.error(i, childFiber, 'childFiber')
			if (i === 0) {
				fiber.child = childFiber;
				preChildFiber = childFiber;
			} else {
                // console.error(preChildFiber, 'preChildFiber')
				if (preChildFiber) {
                    preChildFiber.sibling = childFiber;
                    preChildFiber = childFiber
                }
			}
		}
	}
	return fiber;
}

const result = convertElementToFiberTree(element);

// 遍历
function processFiberTree(fiber, justSubTree) {
	let nextFiber = fiber;
	let rootFiber = fiber;
	process: while (nextFiber) {
		const { pendingProps } = nextFiber;
		console.error(pendingProps.value);
		const child = nextFiber.child;
		// console.error(child, 'XXXXXXX')
		if (child === null) {
			// 说明遍历到一个子树的叶子节点
			// 在向上遍历sibing不为null的另一个子树
			while (nextFiber !== null) {
                let siblingFiber = nextFiber.sibling;
                // console.log(siblingFiber, '11111', nextFiber.pendingProps.value)
                if (nextFiber.pendingProps.value === '2') {
                    // console.log(siblingFiber, nextFiber)
                }
				if (siblingFiber) {
					nextFiber = siblingFiber;
					continue process;
				} else {
					if (justSubTree && nextFiber === rootFiber) {
						break process;
					}
					nextFiber = nextFiber.return;
				}
			}
		} else {
			nextFiber = child;
		}
	}
}

// processFiberTree(result)
// processFiberTree(result.child);
processFiberTree(result.child.sibling.child, true);
// processFiberTree(result.child.sibling.child);
