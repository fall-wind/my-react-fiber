import isCustomComponent from '../shared/isCustomComponent';
import { TEXT_NODE } from '../shared/HTMLNodeType';

const DANGEROUSLY_SET_INNER_HTML = 'dangerouslySetInnerHTML';
const SUPPRESS_CONTENT_EDITABLE_WARNING = 'suppressContentEditableWarning';
const SUPPRESS_HYDRATION_WARNING = 'suppressHydrationWarning';
const AUTOFOCUS = 'autoFocus';
const CHILDREN = 'children';
const STYLE = 'style';
const HTML = '__html';
const LISTENERS = 'listeners';

const HTML_NAMESPACE = 'http://www.w3.org/1999/xhtml';
const MATH_NAMESPACE = 'http://www.w3.org/1998/Math/MathML';
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

const Namespaces = {
	html: HTML_NAMESPACE,
	mathml: MATH_NAMESPACE,
	svg: SVG_NAMESPACE,
};

export function createTextNode(text, rootContainerElement) {
	// return getOw
	// TODO 暂不兼容跨平台
	const ownrDocument = document.createTextNode(text);
}

export function createElement(type, props) {
	let isCustomComponentTag;
	let ownerDocument = document;

	let domElement;
	let namespaceURI = type === 'svg' ? SVG_NAMESPACE : HTML_NAMESPACE;

	if (namespaceURI === HTML_NAMESPACE) {
		if (type === 'script') {
			const div = ownerDocument.createElement('div');
			div.innerHTML = '<script><' + '/script>';
			const firstChild = div.firstChild;
			domElement = div.removeChild(firstChild);
		} else if (typeof props.is === 'string') {
			domElement = ownerDocument.createElement(type, { is: props.is });
		} else {
			domElement = ownerDocument.createElement(type);
			if (type === 'select') {
				const node = domElement;
				if (props.multiple) {
					node.multiple = true;
				} else if (props.size) {
					// Setting a size greater than 1 causes a select to behave like `multiple=true`, where
					// it is possible that no option is selected.
					//
					// This is only necessary when a select in "single selection mode".
					node.size = props.size;
				}
			}
		}
	} else {
		domElement = ownerDocument.createAttributeNS(namespaceURI, type);
	}
	return domElement;
}

let setTextContent = function(node, text) {
	if (text) {
		let firstChild = node.firstChild;

		if (
			firstChild &&
			firstChild === node.lastChild &&
			firstChild.nodeType === TEXT_NODE
		) {
			firstChild.nodeValue = text;
			return;
		}
	}
	node.textContent = text;
};

function setInitialDOMProperties(
	tag,
	domElement,
	rootContainerElement,
	nextProps,
	isCustomComponentTag,
) {
	for (const propKey in nextProps) {
		if (!nextProps.hasOwnProperty(propKey)) {
			// const element = object[propsKey];
			continue;
		}

		const nextProp = nextProps[propKey];

		if (propKey === STYLE) {
			// TODO
		} else if (propKey === CHILDREN) {
			if (typeof nextProp === 'string') {
				const callSetTextContent =
					tag !== 'textarea' || nextProp !== '';
				if (callSetTextContent) {
					setTextContent(domElement, nextProp);
				}
			}
		}
	}
}

export function setInitialProperties(
	domElement,
	tag,
	rawProps,
	rootContainerElement,
) {
	const isCustomComponentTag = isCustomComponent(tag, rawProps);
	let props;
	switch (tag) {
		case 'iframe':
		case 'object':
		case 'embed':
			// TODO bubble event
			props = rawProps;
			break;
		// TODO other tag
		default:
			props = rawProps;
	}

	setInitialDOMProperties(
		tag,
		domElement,
		rootContainerElement,
		props,
		isCustomComponentTag,
	);
}
