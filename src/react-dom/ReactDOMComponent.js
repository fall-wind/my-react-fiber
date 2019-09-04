import isCustomComponent from '../shared/isCustomComponent';
import {
	TEXT_NODE,
	DOCUMENT_NODE,
	DOCUMENT_FRAGMENT_NODE,
} from '../shared/HTMLNodeType';
import { registrationNameModules } from '../events/EventPluginRegistry';
import { listenTo } from './events/ReactBrowserEventEmitter';
import { setValueForStyles } from '../shared/CSSPropertyOperations';
import { setValueForProperty } from './DOMPropertyOperations'

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

let enableFlareAPI = false;

export function createTextNode(text, rootContainerElement) {
	// return getOw
	// TODO 暂不兼容跨平台
	const ownrDocument = document.createTextNode(text);
}

function updateDOMProperties(
	domElement,
	updatePayload,
	wasCustomComponentTag,
	isCustomComponentTag,
) {
	for (let i = 0; i < updatePayload.length; i += 2) {
		const propKey = updatePayload[i];
		const propValue = updatePayload[i + 1];
		if (propKey === STYLE) {
			setValueForStyles(domElement, propValue);
		} else if (propKey === DANGEROUSLY_SET_INNER_HTML) {
			// TODO
		} else if (propKey === CHILDREN) {
			setTextContent(domElement, propValue);
		} else {
			setValueForProperty(
				domElement,
				propKey,
				propValue,
				isCustomComponentTag,
			);
		}
	}
}

export function updateProperties(
	domElement,
	updatePayload,
	tag,
	lastRawProps,
	newRawProps,
) {
	// TODO input radio customComponent

	const wasCustomComponentTag = isCustomComponent(tag, lastRawProps);
	const isCustomComponentTag = isCustomComponent(tag, newRawProps);
	updateDOMProperties(
		domElement,
		updatePayload,
		wasCustomComponentTag,
		isCustomComponentTag,
	);
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

function ensureListeningTo(rootContainerElement, registrationName) {
	const isDocumentOrFragment =
		rootContainerElement.nodeType === DOCUMENT_NODE ||
		rootContainerElement.nodeType === DOCUMENT_FRAGMENT_NODE;
	const doc = isDocumentOrFragment
		? rootContainerElement
		: rootContainerElement.ownerDocument;
	listenTo(registrationName, doc);
}

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
			} else if (typeof nextProp === 'number') {
				setTextContent(domElement, '' + nextProp);
			}
		} else if (registrationNameModules.hasOwnProperty(propKey)) {
			if (nextProp != null) {
				ensureListeningTo(rootContainerElement, propKey);
			}
		}
	}
}

export function diffProperties(
	domElement,
	tag,
	lastRawProps,
	nextRawProps,
	rootContainerElement,
) {
	let updatePayload = null;

	let lastProps;
	let nextProps;

	switch (tag) {
		case 'input': {
			break;
		}
		// TODO
		default: {
			lastProps = lastRawProps;
			nextProps = nextRawProps;
		}
	}

	let propKey;
	let styleName;
	let styleUpdates = null;

	for (propKey in lastProps) {
		if (
			nextProps.hasOwnProperty(propKey) ||
			!lastProps.hasOwnProperty(propKey) ||
			lastProps[propKey] == null
		) {
			continue;
		}
		if (propKey === STYLE) {
			const lastStyle = lastProps[propKey];
			for (styleName in lastStyle) {
				if (lastStyle.hasOwnProperty(styleName)) {
					if (!styleUpdates) {
						styleUpdates = {};
					}
					// 将上次的style属性都置空
					styleUpdates[styleName] = '';
				}
			}
		} else if (
			propKey === DANGEROUSLY_SET_INNER_HTML ||
			propKey === CHILDREN
		) {
			// TODO
		} else if (enableFlareAPI) {
			// TOOD
		} else if (propKey === AUTOFOCUS) {
			// TODO
		} else if (registrationNameModules.hasOwnProperty(propKey)) {
			if (!updatePayload) {
				updatePayload = [];
			}
		} else {
			(updatePayload = updatePayload || []).push(propKey, null);
		}
	}

	for (propKey in nextProps) {
		const nextProp = nextProps[propKey];
		const lastProp = lastProps != null ? lastProps[propKey] : undefined;

		if (
			!nextProps.hasOwnProperty(propKey) ||
			nextProp === lastProp ||
			(nextProp == null && lastProp == null)
		) {
			continue;
		}

		if (propKey === STYLE) {
			if (lastProp) {
				for (styleName in lastProp) {
					if (
						nextProp.hasOwnProperty(styleName) &&
						lastProp[styleName] !== nextProp[styleName]
					) {
						if (!styleUpdates) {
							styleUpdates = {};
						}
						styleUpdates[styleName] = nextProp[styleName];
					}
				}
			} else {
				if (!styleUpdates) {
					if (!updatePayload) {
						updatePayload = [];
					}
					updatePayload.push(propKey, styleUpdates);
				}
				styleUpdates = nextProp;
			}
		} else if (propKey === DANGEROUSLY_SET_INNER_HTML) {
			// TOOD
		} else if (propKey === CHILDREN) {
			console.error(lastProp, nextProp, 'xxxxxxxx');
			if (
				lastProp !== nextProp &&
				(typeof nextProp === 'string' || typeof nextProp === 'number')
			) {
				(updatePayload = updatePayload || []).push(
					propKey,
					'' + nextProp,
				);
			}
		} else if (enableFlareAPI) {
			// TODO
		} else if (registrationNameModules.hasOwnProperty(propKey)) {
			if (nextProp != null) {
				ensureListeningTo(rootContainerElement, propKey);
			}
			if (!updatePayload && lastProp !== nextProp) {
				updatePayload = [];
			}
		} else {
			(updatePayload = updatePayload || []).push(propKey, nextProp);
		}
	}

	if (styleUpdates) {
		(updatePayload = updatePayload || []).push(STYLE, styleUpdates);
	}
	return updatePayload;
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
