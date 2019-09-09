import {
	createTextNode,
	setInitialProperties,
    createElement,
    diffProperties,
    updateProperties,
} from '../react-dom/ReactDOMComponent';
import {
	precacheFiberNode,
	updateFiberProps,
} from '../react-dom/ReactDOMComponentTree';
import {
	ELEMENT_NODE,
	TEXT_NODE,
	COMMENT_NODE,
	DOCUMENT_NODE,
	DOCUMENT_FRAGMENT_NODE,
} from '../shared/HTMLNodeType';

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

export function prepareUpdate(
	domElement,
	type,
	oldProps,
	newProps,
	rootContainerInstance,
	hostContext,
) {
	return diffProperties(
		domElement,
		type,
		oldProps,
		newProps,
		rootContainerInstance,
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

export function commitUpdate(
    domElement,
    updatePayload,
    type,
    oldProps,
    newProps,
    internalInstanceHandle,
) {
    updateFiberProps(domElement, newProps)

    updateProperties(domElement, updatePayload, type, oldProps, newProps)
}

const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';

// TODO getChildNamespace
export function getRootHostContext(rootContainerInstance) {
	let type;
	let namespace;
	const nodeType = rootContainerInstance.nodeType;
	switch (nodeType) {
		case DOCUMENT_NODE:
		case DOCUMENT_FRAGMENT_NODE: {
			type = nodeType === DOCUMENT_NODE ? '#document' : '#fragment';
			let root = rootContainerInstance.documentElement;
			namespace = root ? root.namespaceURI : HTML_NAMESPACE;
			// namespace = root ? root.namespaceURI : getChildNamespace(null, '');
			break;
		}
		default: {
			const container =
				nodeType === COMMENT_NODE
					? rootContainerInstance.parentNode
					: rootContainerInstance;
			const ownNamespace = container.namespaceURI || null;
			type = container.tagName;
			namespace = HTML_NAMESPACE;
			// namespace = getChildNamespace(ownNamespace, type);
			break;
		}
	}
	// return namespace;
	return HTML_NAMESPACE;
}
