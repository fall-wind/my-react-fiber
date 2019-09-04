import { injection as EventPluginHubInjection } from '../events/EventPluginHub';
import SimpleEventPlugin from './events/SimpleEventPlugin';
import { setComponentTree } from '../events/EventPluginUtils'
import {
    getFiberCurrentPropsFromNode,
	getInstanceFromNode,
	getNodeFromInstance,    
} from './ReactDOMComponentTree'

const DOMEventPluginOrder = [
	'ResponderEventPlugin',
	'SimpleEventPlugin',
	'EnterLeaveEventPlugin',
	'ChangeEventPlugin',
	'SelectEventPlugin',
	'BeforeInputEventPlugin',
];

EventPluginHubInjection.injectEventPluginOrder(DOMEventPluginOrder);

setComponentTree(
	getFiberCurrentPropsFromNode,
	getInstanceFromNode,
	getNodeFromInstance,
);

EventPluginHubInjection.injectEventPluginsByName({
	SimpleEventPlugin: SimpleEventPlugin,
	// EnterLeaveEventPlugin: EnterLeaveEventPlugin,
	// ChangeEventPlugin: ChangeEventPlugin,
	// SelectEventPlugin: SelectEventPlugin,
	// BeforeInputEventPlugin: BeforeInputEventPlugin,
});
