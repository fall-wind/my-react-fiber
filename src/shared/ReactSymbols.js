const hasSymbol = typeof Symbol === 'function' && Symbol.for;

export const REACT_ELEMENT_TYPE = hasSymbol
	? Symbol.for('react.element')
	: 0xeac7;

export const REACT_PORTAL_TYPE = hasSymbol
	? Symbol.for('react.portal')
	: 0xeaca;
export const REACT_FRAGMENT_TYPE = hasSymbol
	? Symbol.for('react.fragment')
	: 0xeacb;
export const REACT_STRICT_MODE_TYPE = hasSymbol
	? Symbol.for('react.strict_mode')
	: 0xeacc;
export const REACT_PROFILER_TYPE = hasSymbol
	? Symbol.for('react.profiler')
	: 0xead2;
export const REACT_PROVIDER_TYPE = hasSymbol
	? Symbol.for('react.provider')
	: 0xeacd;
export const REACT_CONTEXT_TYPE = hasSymbol
	? Symbol.for('react.context')
	: 0xeace;
