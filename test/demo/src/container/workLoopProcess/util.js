import * as Babel from 'babel-standalone';
import eventEmitter from '../../utils/eventEmitter';
import {
	HostComponent,
	HostRoot,
	FunctionComponent,
} from '../../../../../src/shared/ReactWorkTags';

const {
	React: CustomReact,
	ReactDOM: CustomReactDOM,
} = require('../../component');
// import React from 'react'

export function getNameFromFiber(fiber) {
	switch (fiber.tag) {
		case FunctionComponent: {
			return fiber.type.name;
		}
		case HostRoot: {
			return 'rootFiber';
		}
		case HostComponent: {
			return fiber.type;
		}
		default:
			return 'developing...';
	}
}

const eventName = 'customInjectionWorkLoop';

function triggerEvent(...params) {
	eventEmitter.emit(eventName, ...params);
}

const zIndexMap = {
	beginWork: 1,
	completeUnitOfWork: 1,
	completeWork: 2,
};

function collectResult(resolve) {
	let result = [];
	return (fiber, phase) => {
		if (phase == 'workLoopOver') {
			resolve(result);
			result = [];
		} else {
			result.push({
				fiber,
				phase,
				zIndex: zIndexMap[phase] || 1,
			});
		}
	};
}

export function performCode(str) {
	CustomReactDOM.CustomInjection.setTriggerFun(triggerEvent);
	CustomReactDOM.CustomInjection.setPerformPhase('workLoop');
	let result = null;
	const React = CustomReact; // for eval
	const ReactDOM = CustomReactDOM; // for eval
	let errorMsg = '';
	let code = '';
	try {
		code = Babel.transform(str, {
			presets: ['react'],
		}).code;
	} catch (error) {
		errorMsg = error;
	}

	try {
		if (code.indexOf('ReactDOM') !== -1 && !errorMsg) {
			result = new Promise((resolve, reject) => {
				eventEmitter.on(eventName, collectResult(resolve));
			});
			eval(code);
			eventEmitter.remove(eventName);
		} else if (!errorMsg) {
			errorMsg = '代码不符合规则！';
		}
	} catch (error) {
		// result = Promise.reject(error);
		console.error(error, 'error');
	} finally {
		if (result === null) {
			result = Promise.reject(errorMsg || 'some thing error');
		}
		Promise.resolve().then(() => {
			eventEmitter.remove(eventName);
		});
		// 第二次执行的时候将 App 移除？
		const app = document.getElementById('App');
		app._reactRootContainer = null;
	}
	return result;
}

const filterColor = 'rgb(10, 100, 10)';
const textColor = 'rgb(255, 255, 255)';
const rectHeight = 40;
const rectWidth = 40;
const lineHeight = 50;
const lineWidth = 50;
const gapWidth = 5;
const gapHeight = 5;

const itemHeight = rectHeight + lineHeight;
const itemWidth = rectWidth + lineWidth;

const arrowMaxOffset = 8;
const arrowMinOffset = 4;
const arrowLineOffset = 5;

const lineStrokeColor = '#e9e9e9';

export const statusColorMap = {
    beginWork: 'rgb(10, 100, 10)',
    completeWork: 'rgb(250, 60, 8)',
    completeUnitOfWork: 'rgb(0, 0, 250)',
}

/**
 *
 * @param {*} ctx
 * @param {*} param1
 * offset 1, 0 -1
 */
function drawLine(ctx, { x, y, direction, offset = 0 }) {
	let x1 = x;
	let y1 = y;
	let x2 = x;
	let y2 = y;
	if (direction === 'down') {
		x2 = x1 = x + rectWidth / 2 + offset * arrowLineOffset;

		y1 = y + gapHeight + rectHeight;
		y2 = y + rectHeight + lineHeight - gapHeight;
	} else if (direction === 'up') {
		x2 = x1 = x + rectWidth / 2 + offset * arrowLineOffset;

		y1 = y - gapHeight;
		y2 = y - lineHeight + gapHeight;
	} else if (direction === 'left') {
		y1 = y2 = y + rectHeight / 2 + offset * arrowLineOffset;

		x1 = x - gapWidth;
		x2 = x - lineWidth + gapWidth;
	} else if (direction === 'right') {
		y1 = y2 = y + rectHeight / 2 + offset * arrowLineOffset;

		x1 = x + gapWidth + rectHeight;
		x2 = x + lineWidth - gapWidth + rectHeight;
	}

	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x2, y2);
	ctx.strokeStyle = lineStrokeColor;
	ctx.stroke();

	return {
		x: x2,
		y: y2,
	};
}

function drawRect(ctx, { x, y, w, h, color = filterColor, text, phase }) {
	// 画方块
	ctx.fillStyle = statusColorMap[phase] || filterColor;
	ctx.fillRect(x, y, w, h);

	// 写文字
	ctx.fillStyle = textColor;
	const yoffset = rectHeight / 2;
	ctx.fillText(text, x + rectWidth / 2 - 20, y + yoffset, rectWidth);
}

function drawArrow(ctx, { direction, x, y }) {
	let x1 = x;
	let x2 = x;
	let y1 = y;
	let y2 = y;

	if (direction === 'left') {
		x2 = x1 = x - arrowMaxOffset;
		y1 = y - arrowMinOffset;
		y2 = y + arrowMinOffset;
	} else if (direction === 'right') {
		x2 = x1 = x - arrowMaxOffset;
		y1 = y - arrowMinOffset;
		y2 = y + arrowMinOffset;
	} else if (direction === 'up') {
		y1 = y2 = y + arrowMaxOffset;
		x1 = x - arrowMinOffset;
		x2 = x + arrowMinOffset;
	} else if (direction === 'down') {
		y1 = y2 = y - arrowMaxOffset;
		x1 = x - arrowMinOffset;
		x2 = x + arrowMinOffset;
	}

	ctx.beginPath();
	ctx.moveTo(x1, y1);
	ctx.lineTo(x, y);
	ctx.lineTo(x2, y2);
	ctx.strokeStyle = lineStrokeColor;
	ctx.stroke();
}

function drawArrowLine(ctx, { x, y, direction }) {
	const { x: arrowX, y: arrowY } = drawLine(ctx, {
		x,
		y,
		direction,
		offset: 0,
	});

	drawArrow(ctx, {
		x: arrowX,
		y: arrowY,
		direction,
	});
}

function getPositionByPervElement(fiber, pervPosition, relation) {
    const { x: pX, y: pY } = pervPosition;
    if (fiber.drawInfo) {
        return fiber.drawInfo
    }
	if (relation === 'none') {
		return { x: pX, y: pY };
	} else if (relation === 'child') {
		return { x: pX, y: pY + itemHeight };
	} else if (relation === 'child') {
		return { x: pX, y: pY - itemHeight };
	} else if (relation === 'sibling') {
		return { x: pX + itemWidth, y: pY };
	} else {
		return { x: pX, y: pY };
	}
}

function drawElement({
	hasParent,
	hasChild,
	hasSibling,
	pervPosition,
	relation,
	ctx,
    fiber,
    phase,
}) {
	// 画一个方块
	const { x, y } = getPositionByPervElement(fiber, pervPosition, relation);
	drawRect(ctx, {
		x,
		y,
		w: rectHeight,
		h: rectHeight,
        text: getNameFromFiber(fiber),
        phase,
	});

	const commonLineProps = {
		x,
		y,
	};
	if (hasChild) {
		drawArrowLine(ctx, {
			...commonLineProps,
			direction: 'down',
		});
	}

	if (hasSibling) {
		drawArrowLine(ctx, {
			...commonLineProps,
			direction: 'right',
		});
	}

	return {
		x,
		y,
	};
}

function drawFiber(fiber, ctx, positonInfo, relation) {
	const { child, sibling } = fiber;
	return drawElement({
		hasChild: !!child,
		hasParent: !!fiber.return,
		hasSibling: !!sibling,
		pervPosition: positonInfo,
		ctx,
		relation,
        fiber,
        phase: positonInfo.phase,
    });
}

const padding = 10;

function setFiberDrawInfo(fiber, x, y, phase) {
    fiber.drawInfo = {
        x,
        y,
        phase,
    }
}

function delay(timer) {
    return new Promise((reject) => {
        setTimeout(reject, timer)
    })
}

// 直接修改fiber对象 添加额外的属性
export async function draw(list, context) {
	let prevNode = null;
	let pX = padding;
	let pY = padding;
    
    for (let i = 0; i < list.length; i++) {
        const node = list[i];
        const { fiber, phase } = node
        let relation = 'none';
        if (prevNode === null) {
            relation = 'none'
        } else if (prevNode.child === fiber) {
            relation = 'child'
        } else if (prevNode.return === fiber) {
            relation = 'parent'
        } else if (prevNode.sibling === fiber) {
            relation = 'sibling'
        }
        const { x, y } = drawFiber(fiber, context, { x: pX, y: pY, phase }, relation)
        pX = x
        pY = y
        setFiberDrawInfo(fiber, x, y, phase)
        await delay(300)
        prevNode = fiber
    }
}

export function drawWithWhile(list, context) {
	const [rootFiberInfo] = list;
	const { fiber, phase } = rootFiberInfo;
	let node = fiber;
	let relation = 'none';
	let pX = padding;
	let pY = padding;
	let parentNode = null;
	// 延迟 500ms 执行
	do {
        const { x, y } = drawFiber(node, context, { x: pX, y: pY }, relation);
		pX = x;
		pY = y;
		console.error(x, y, 'position');
		const siblingFiber = node.sibling;
		if (siblingFiber) {
			node = siblingFiber;
			relation = 'sibling';
		} else if (node.child !== null) {
			parentNode = node;
			node = node.child;
			relation = 'child';
		} else {
			node = node.child;
		}
	} while (node !== null);
}
