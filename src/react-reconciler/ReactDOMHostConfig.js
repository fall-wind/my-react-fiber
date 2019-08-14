import {
	createTextNode,
    setInitialProperties,
    createElement,
} from '../react-dom/ReactDOMComponent';
import { precacheFiberNode } from '../react-dom/ReactDOMComponentTree';

export const noTimeout = -1;

export const supportsMutation = true;

export function shouldSetTextContent(type, props) {
	return (
		type === 'textarea' ||
		type === 'option' ||
		type === 'noscript' ||
		typeof props.children === 'string' ||
		typeof props.children === 'number' ||
		(typeof props.dangerouslySetInnerHTML === 'object' &&
			props.dangerouslySetInnerHTML !== null &&
			props.dangerouslySetInnerHTML.__html != null)
	);
}

export function createInstance(
	type,
	props,
	rootContainerInstance,
	hostContext,
	internalInstanceHandle,
) {
	let parentNameSpace = hostContext;
	const domElement = createElement(
		type,
		props,
		rootContainerInstance,
		parentNameSpace,
	);
	precacheFiberNode(internalInstanceHandle, domElement);
	updateFiberProps(domElement, props);
	return domElement;
}

export function createTextInstance(
	text,
	rootContainerInstance,
	hostContext,
	internalInstanceHandle,
) {
	const textNode = createTextNode(text, rootContainerInstance);
	precacheFiberNode(internalInstanceHandle, textNode);
	return textNode;
}

export function appendInitialChild(parentInstance, child) {
	parentInstance.appendChild(child);
}

function shouldAutoFocusHostComponent(type, props) {
	switch (type) {
		case 'button':
		case 'input':
		case 'select':
		case 'textarea':
			return !!props.autoFocus;
	}
	return false;
}

export function finalizeInitialChildren(
	domElement,
	type,
	props,
	rootContainerInstance,
	hostContext,
) {
	setInitialProperties(domElement, type, props, rootContainerInstance);
	return shouldAutoFocusHostComponent(type, props);
}
