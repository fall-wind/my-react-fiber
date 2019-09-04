import {
    plugins,
    injectEventPluginOrder,
    injectEventPluginsByName,
} from './EventPluginRegistry'
import accumulateInto from './accumulateInto'
import { getFiberCurrentPropsFromNode } from './EventPluginUtils'
import { runEventsInBatch } from './EventBatching'

function isInteractive(tag) {
    return (
      tag === 'button' ||
      tag === 'input' ||
      tag === 'select' ||
      tag === 'textarea'
    );
  }

function shouldPreventMouseEvent(name, type, props) {
    switch (name) {
      case 'onClick':
      case 'onClickCapture':
      case 'onDoubleClick':
      case 'onDoubleClickCapture':
      case 'onMouseDown':
      case 'onMouseDownCapture':
      case 'onMouseMove':
      case 'onMouseMoveCapture':
      case 'onMouseUp':
      case 'onMouseUpCapture':
        return !!(props.disabled && isInteractive(type));
      default:
        return false;
    }
  }

export function getListener(inst, registrationName) {
    let listener;

    const stateNode = inst.stateNode
    if (!stateNode) {
        return null
    }
    const props = getFiberCurrentPropsFromNode(stateNode);
    if (!props) {
        return null
    }
    listener = props[registrationName]
    if (shouldPreventMouseEvent(registrationName, inst.type, props)) {
        return null
    }
    
    return listener;
}

export const injection = {
    injectEventPluginOrder,
    injectEventPluginsByName,
}

function extractPluginEvents(
    topLevelType,
    targetInst,
    nativeEvent,
    nativeEventTarget,
) {
    let events = null;
    for (let i = 0; i < plugins.length; i++) {
        const possiblePlugin = plugins[i];
        if (possiblePlugin) {
            const extractedEvents = possiblePlugin.extractEvents(
                topLevelType,
                targetInst,
                nativeEvent,
                nativeEventTarget,
            )
            if (extractedEvents) {
                events = accumulateInto(events, extractedEvents)
            }
        }
    }
    return events
}

export function runExtractedPluginEventsInBatch(
    topLevelType,
    targetInst,
    nativeEvent,
    nativeEventTarget,
) {
    const events = extractPluginEvents(
        topLevelType,
        targetInst,
        nativeEvent,
        nativeEventTarget,
    )
    runEventsInBatch(events)
}
