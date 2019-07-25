import { REACT_ELEMENT_TYPE } from '../shared/ReactSymbols';
import ReactCurrentOwner from './ReactCurrentOwner';

function hasValidRef(config) {
	return config.ref !== undefined;
}

function hasValidKey(config) {
	return config.key !== undefined;
}

const RESERVED_PROPS = {
	key: true,
	ref: true,
	__self: true,
	__source: true,
};

const ReactElement = function(type, key, ref, self, source, owner, props) {
	const element = {
		// This tag allows us to uniquely identify this as a React Element
		$$typeof: REACT_ELEMENT_TYPE,

		// Built-in properties that belong on the element
		type: type,
		key: key,
		ref: ref,
		props: props,

		// Record the component responsible for creating this element.
		_owner: owner,
	};

	return element;
};

export function createElement(type, config, children) {
	let propName;

	const props = {};

	let key = null;
	let ref = null;
	let self = null;
	let source = null;

	if (config != null) {
		if (hasValidRef(config)) {
			ref = config.ref;
		}
		if (hasValidKey(config)) {
			key = '' + config.key;
		}

		self = config.__self === undefined ? null : config.__self;
		source = config.__source === undefined ? null : config.__source;

		for (propName in config) {
			if (
				hasOwnProperty.call(config, propName) &&
				!RESERVED_PROPS.hasOwnProperty(propName)
			) {
				props[propName] = config[propName];
			}
		}
	}

    // child 可能不止一个参数
	const childrenLength = arguments.length - 2;
	if (childrenLength === 1) {
		props.children = children;
	} else if (childrenLength > 1) {
		const childArray = Array(childrenLength);
		for (let i = 0; i < childrenLength; i++) {
			childArray[i] = arguments[i + 2];
		}
		props.children = childArray;
	}

	// 处理默认值
	if (type && type.defaultProps) {
		const defaultProps = type.defaultProps;
		for (propName in defaultProps) {
			if (props[propName] === undefined) {
				props[propName] = defaultProps[propName];
			}
		}
	}
	return ReactElement(
		type,
		key,
		ref,
		self,
		source,
		ReactCurrentOwner.current,
		props,
	);
}
