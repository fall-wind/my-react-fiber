import {
	createTextNode,
	setInitialProperties,
	createElement,
} from '../react-dom/ReactDOMComponent';
import {
	precacheFiberNode,
	updateFiberProps,
} from '../react-dom/ReactDOMComponentTree';

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

export function prepareForCommit(containerInfo) {
	// disbale
}

const COMMENT_NODE = 8;

export function insertInContainerBefore(container, child, beforeChild) {
	if (container.nodeType === COMMENT_NODE) {
		container.parentNode.insertBefore(child, beforeChild);
	} else {
		container.insertBefore(child, beforeChild);
	}
}

export function insertBefore(parentInstance, child, beforeChild) {
	parentInstance.insertBefore(beforeChild, child);
}

export function appendChild(parentInstance, child) {
	parentInstance.appendChild(child);
}

export function appendChildToContainer(container, child) {
	let parentNode;
	if (container.nodeType === COMMENT_NODE) {
		parentNode = container.parentNode;
		parentNode.insertBefore(child, container);
	} else {
		parentNode = container;
		parentNode.appendChild(child);
	}

	// TODO
	// const reactRootContainer = container._reactRootContainer;
	// if (
	// 	(reactRootContainer === null || reactRootContainer === undefined) &&
	// 	parentNode.onclick === null
	// ) {
	// 	// TODO: This cast may not be sound for SVG, MathML or custom elements.
	// 	trapClickOnNonInteractiveElement(((parentNode: any): HTMLElement));
	// }
}

export function commitUpdate() {
	// TODO
}
