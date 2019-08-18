import { injection as EventPluginHubInjection } from '../events/EventPluginHub';
import SimpleEventPlugin from './events/SimpleEventPlugin';

const DOMEventPluginOrder = [
	'ResponderEventPlugin',
	'SimpleEventPlugin',
	'EnterLeaveEventPlugin',
	'ChangeEventPlugin',
	'SelectEventPlugin',
	'BeforeInputEventPlugin',
];

EventPluginHubInjection.injectEventPluginOrder(DOMEventPluginOrder);

EventPluginHubInjection.injectEventPluginsByName({
	SimpleEventPlugin: SimpleEventPlugin,
	// EnterLeaveEventPlugin: EnterLeaveEventPlugin,
	// ChangeEventPlugin: ChangeEventPlugin,
	// SelectEventPlugin: SelectEventPlugin,
	// BeforeInputEventPlugin: BeforeInputEventPlugin,
});
