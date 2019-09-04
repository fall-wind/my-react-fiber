import SimpleEventPlugin from './SimpleEventPlugin';
import {
	DiscreteEvent,
	UserBlockingEvent,
	ContinuousEvent,
} from '../../shared/ReactTypes';
import { PLUGIN_EVENT_SYSTEM } from '../../events/EventSystemFlags';
import { discreteUpdates, batchedEventUpdates } from './ReactGenericBatching';
import getEventTarget from './getEventTarget';
import { getClosestInstanceFromNode } from '../ReactDOMComponentTree';
import { HostRoot } from '../../shared/ReactWorkTags';
import { getRawEventName } from './DOMTopLevelEventTypes';
import {
	addEventCaptureListener,
	addEventBubbleListener,
} from './EventListener';
import { runExtractedPluginEventsInBatch } from '../../events/EventPluginHub'

const { getEventPriority } = SimpleEventPlugin;

const CALLBACK_BOOKKEEPING_POOL_SIZE = 10;
const callbackBookkeepingPool = [];

export let _enabled = true;

export function setEnabled(enabled) {
	_enabled = !!enabled;
}

export function isEnabled() {
	return _enabled;
}

function releaseTopLevelCallbackBookKeeping(instance) {
	instance.topLevelType = null;
	instance.nativeEvent = null;
	instance.targetInst = null;
	instance.ancestors.length = 0;
	if (callbackBookkeepingPool.length < CALLBACK_BOOKKEEPING_POOL_SIZE) {
		callbackBookkeepingPool.push(instance);
	}
}

function getTopLevelCallbackBookKeeping(topLevelType, nativeEvent, targetInst) {
	if (callbackBookkeepingPool.length) {
		// 复用
		const instance = callbackBookkeepingPool.pop();

		instance.topLevelType = topLevelType;
		instance.nativeEvent = nativeEvent;
		instance.targetInst = targetInst;
		return instance;
	}
	return {
		topLevelType,
		nativeEvent,
		targetInst,
		ancestors: [],
	};
}

function findRootContainerNode(inst) {
	while (inst.return) {
		inst = inst.return;
	}
	if (inst.tag !== HostRoot) {
		// This can happen if we're in a detached tree.
		return null;
	}
	return inst.stateNode.containerInfo;
}

function handleTopLevel(bookKeeping) {
	let targetInst = bookKeeping.targetInst;

	let ancestor = targetInst;
	do {
		if (!ancestor) {
			const ancestors = bookKeeping.ancestors;
			ancestors.push(ancestor);
			break;
		}
		const root = findRootContainerNode(ancestor);

		if (!root) {
			break;
		}
		bookKeeping.ancestors.push(ancestor);

		ancestor = getClosestInstanceFromNode(root);
	} while (ancestor);

	for (let i = 0; i < bookKeeping.ancestors.length; i++) {
		targetInst = bookKeeping.ancestors[i];
		const eventTarget = getEventTarget(bookKeeping.nativeEvent);
		const topLevelType = bookKeeping.topLevelType;
		const nativeEvent = bookKeeping.nativeEvent;

		runExtractedPluginEventsInBatch(
			topLevelType,
			targetInst,
			nativeEvent,
			eventTarget,
		);
	}
}

function dispatchEventForPluginEventSystem(
	topLevelType,
	eventSystemFlags,
	nativeEvent,
	targetInst,
) {
	const bookKeeping = getTopLevelCallbackBookKeeping(
		topLevelType,
		nativeEvent,
		targetInst,
	);

	try {
		batchedEventUpdates(handleTopLevel, bookKeeping);
	} finally {
		releaseTopLevelCallbackBookKeeping(bookKeeping);
	}
}

function dispatchEvent(topLevelType, eventSystemFlags, nativeEvent) {
	if (!_enabled) {
		return;
	}

	const nativeEventTarget = getEventTarget(nativeEvent);
	let targetInst = getClosestInstanceFromNode(nativeEventTarget);

	dispatchEventForPluginEventSystem(
		topLevelType,
		eventSystemFlags,
		nativeEvent,
		targetInst,
	);
}

function dispatchDiscreteEvent(topLevelType, eventSystemFlags, nativeEvent) {
	discreteUpdates(dispatchEvent, topLevelType, eventSystemFlags, nativeEvent);
}

function trapEventForPluginEventSystem(element, topLevelType, capture) {
	let listener;
	switch (getEventPriority(topLevelType)) {
		case DiscreteEvent:
			listener = dispatchDiscreteEvent.bind(
				null,
				topLevelType,
				PLUGIN_EVENT_SYSTEM,
			);
			break;
		case UserBlockingEvent:
		case ContinuousEvent:
		default:
			listener = dispatchEvent.bind(
				null,
				topLevelType,
				PLUGIN_EVENT_SYSTEM,
			);
			break;
	}
	const rawEventName = getRawEventName(topLevelType);
	if (capture) {
		addEventCaptureListener(element, rawEventName, listener);
	} else {
		addEventBubbleListener(element, rawEventName, listener);
	}
}

export function trapBubbledEvent(topLevelType, element) {
	trapEventForPluginEventSystem(element, topLevelType, false);
}
