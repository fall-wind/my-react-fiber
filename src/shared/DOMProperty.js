export const RESERVED = 0;
export const STRING = 1;
export const BOOLEANISH_STRING = 2;
export const BOOLEAN = 3;
export const OVERLOADED_BOOLEAN = 4;
export const NUMERIC = 5;
export const POSITIVE_NUMERIC = 6;

/* eslint-disable max-len */
export const ATTRIBUTE_NAME_START_CHAR =
	':A-Z_a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD';
/* eslint-enable max-len */
export const ATTRIBUTE_NAME_CHAR =
	ATTRIBUTE_NAME_START_CHAR + '\\-.0-9\\u00B7\\u0300-\\u036F\\u203F-\\u2040';

export const ID_ATTRIBUTE_NAME = 'data-reactid';
export const ROOT_ATTRIBUTE_NAME = 'data-reactroot';
export const VALID_ATTRIBUTE_NAME_REGEX = new RegExp(
	'^[' + ATTRIBUTE_NAME_START_CHAR + '][' + ATTRIBUTE_NAME_CHAR + ']*$',
);

export function getPropertyInfo(name) {
	return properties.hasOwnProperty(name) ? properties[name] : null;
}

export function shouldIgnoreAttribute(
	name,
	propertyInfo,
	isCustomComponentTag,
) {
	if (propertyInfo !== null) {
		return propertyInfo.type === RESERVED;
	}
	if (isCustomComponentTag) {
		return false;
	}
	if (
		name.length > 2 &&
		(name[0] === 'o' || name[0] === 'O') &&
		(name[1] === 'n' || name[1] === 'N')
	) {
		return true;
	}
	return false;
}

export function shouldRemoveAttributeWithWarning(
	name,
	value,
	propertyInfo,
	isCustomComponentTag,
) {
	if (propertyInfo !== null && propertyInfo.type === RESERVED) {
		return false;
	}
	switch (typeof value) {
		case 'function':
		// $FlowIssue symbol is perfectly valid here
		case 'symbol': // eslint-disable-line
			return true;
		case 'boolean': {
			if (isCustomComponentTag) {
				return false;
			}
			if (propertyInfo !== null) {
				return !propertyInfo.acceptsBooleans;
			} else {
				const prefix = name.toLowerCase().slice(0, 5);
				return prefix !== 'data-' && prefix !== 'aria-';
			}
		}
		default:
			return false;
	}
}

export function shouldRemoveAttribute(
	name,
	value,
	propertyInfo,
	isCustomComponentTag,
) {
	if (value === null || typeof value === 'undefined') {
		return true;
	}
	if (
		shouldRemoveAttributeWithWarning(
			name,
			value,
			propertyInfo,
			isCustomComponentTag,
		)
	) {
		return true;
	}
	if (isCustomComponentTag) {
		return false;
	}
	if (propertyInfo !== null) {
		switch (propertyInfo.type) {
			case BOOLEAN:
				return !value;
			case OVERLOADED_BOOLEAN:
				return value === false;
			case NUMERIC:
				return isNaN(value);
			case POSITIVE_NUMERIC:
				return isNaN(value) || value < 1;
		}
	}
	return false;
}

const hasOwnProperty = Object.prototype.hasOwnProperty;
const illegalAttributeNameCache = {};
const validatedAttributeNameCache = {};

export function isAttributeNameSafe(attributeName) {
	if (hasOwnProperty.call(validatedAttributeNameCache, attributeName)) {
		return true;
	}
	if (hasOwnProperty.call(illegalAttributeNameCache, attributeName)) {
		return false;
	}
	if (VALID_ATTRIBUTE_NAME_REGEX.test(attributeName)) {
		validatedAttributeNameCache[attributeName] = true;
		return true;
	}
	illegalAttributeNameCache[attributeName] = true;
	return false;
}
