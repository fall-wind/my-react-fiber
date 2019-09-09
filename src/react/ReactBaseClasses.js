const __DEV__ = true;

const emptyObject = {};
if (__DEV__) {
	Object.freeze(emptyObject);
}

class Component {
	constructor(props, context, updater) {
		this.props = props;
		this.context = context;
		this.refs = emptyObject;
		this.updater = updater;
	}

	isReactComponent = {};

	setState(partialState, callback) {
		this.updater.enqueueSetState(this, partialState, callback, 'setState');
	}

	forceUpdate(callback) {
		this.updater.enqueueForceUpdate(this, callback, 'forceUpdate');
	}
}

class PureComponent extends Component {
	isPureReactComponent = true;
}

export { PureComponent, Component };
