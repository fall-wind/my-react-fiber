import {
	getPropertyInfo,
	shouldIgnoreAttribute,
	shouldRemoveAttribute,
	isAttributeNameSafe,
	BOOLEAN,
	OVERLOADED_BOOLEAN,
} from '../shared/DOMProperty';

export function setValueForProperty(node, name, value, isCustomComponentTag) {
	const propertyInfo = getPropertyInfo(name);
	if (shouldIgnoreAttribute(name, propertyInfo, isCustomComponentTag)) {
		return;
	}
	if (
		shouldRemoveAttribute(name, value, propertyInfo, isCustomComponentTag)
	) {
		value = null;
	}
	// If the prop isn't in the special list, treat it as a simple attribute.
	if (isCustomComponentTag || propertyInfo === null) {
		if (isAttributeNameSafe(name)) {
			const attributeName = name;
			if (value === null) {
				node.removeAttribute(attributeName);
			} else {
				node.setAttribute(attributeName, '' + value);
			}
		}
		return;
	}
	const { mustUseProperty } = propertyInfo;
	if (mustUseProperty) {
		const { propertyName } = propertyInfo;
		if (value === null) {
			const { type } = propertyInfo;
			node[propertyName] = type === BOOLEAN ? false : '';
		} else {
			// Contrary to `setAttribute`, object properties are properly
			// `toString`ed by IE8/9.
			node[propertyName] = value;
		}
		return;
	}
	// The rest are treated as attributes with special cases.
	const { attributeName, attributeNamespace } = propertyInfo;
	if (value === null) {
		node.removeAttribute(attributeName);
	} else {
		const { type } = propertyInfo;
		let attributeValue;
		if (
			type === BOOLEAN ||
			(type === OVERLOADED_BOOLEAN && value === true)
		) {
			attributeValue = '';
		} else {
			// `setAttribute` with objects becomes only `[object]` in IE8/9,
			// ('' + value) makes it output the correct toString()-value.
            attributeValue = '' + value
            // TODO
			// if (propertyInfo.sanitizeURL) {
			// 	sanitizeURL(attributeValue);
			// }
		}
		if (attributeNamespace) {
			node.setAttributeNS(
				attributeNamespace,
				attributeName,
				attributeValue,
			);
		} else {
			node.setAttribute(attributeName, attributeValue);
		}
	}
}
