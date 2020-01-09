function dangerousStyleValue(name, value, isCustomProperty) {
	const isEmpty = value == null || typeof value === 'boolean' || value === '';
	if (isEmpty) {
		return '';
	}

	if (
		!isCustomProperty &&
		typeof value === 'number' &&
		value !== 0 &&
		!(isUnitlessNumber.hasOwnProperty(name) && isUnitlessNumber[name])
	) {
		return value + 'px';
	}

	return ('' + value).trim();
}

const uppercasePattern = /([A-Z])/g;
const msPattern = /^ms-/;

/**
 * Hyphenates a camelcased CSS property name, for example:
 *
 *   > hyphenateStyleName('backgroundColor')
 *   < "background-color"
 *   > hyphenateStyleName('MozTransition')
 *   < "-moz-transition"
 *   > hyphenateStyleName('msTransition')
 *   < "-ms-transition"
 *
 * As Modernizr suggests (http://modernizr.com/docs/#prefixed), an `ms` prefix
 * is converted to `-ms-`.
 */
export function hyphenateStyleName(name) {
	return name
		.replace(uppercasePattern, '-$1')
		.toLowerCase()
		.replace(msPattern, '-ms-');
}

/**
 * Sets the value for multiple styles on a node.  If a value is specified as
 * '' (empty string), the corresponding style property will be unset.
 *
 * @param {DOMElement} node
 * @param {object} styles
 */
export function setValueForStyles(node, styles) {
	const style = node.style;
	for (let styleName in styles) {
		if (!styles.hasOwnProperty(styleName)) {
			continue;
		}
		const isCustomProperty = styleName.indexOf('--') === 0;
		const styleValue = dangerousStyleValue(
			styleName,
			styles[styleName],
			isCustomProperty,
		);
		if (styleName === 'float') {
			styleName = 'cssFloat';
		}
		if (isCustomProperty) {
			style.setProperty(styleName, styleValue);
		} else {
			style[styleName] = styleValue;
		}
	}
}
