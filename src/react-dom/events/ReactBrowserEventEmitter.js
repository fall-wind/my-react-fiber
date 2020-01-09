import { registrationNameDependencies } from '../../events/EventPluginRegistry';
import { mediaEventTypes } from './DOMTopLevelEventTypes';
import { trapBubbledEvent } from './ReactDOMEventListener'

const PossiblyWeakMap = typeof WeakMap === 'function' ? WeakMap : Map;

const elementListeningSets = new PossiblyWeakMap();

function getListeningSetForElement(element) {
	let listeningSet = elementListeningSets.get(element);
	if (listeningSet === undefined) {
		listeningSet = new Set();
		elementListeningSets.set(element, listeningSet);
	}
	return listeningSet;
}

export function listenTo(registrationName, mountAt) {
	const listeningSet = getListeningSetForElement(mountAt);
	const deps = registrationNameDependencies[registrationName];

	for (let i = 0; i < deps.length; i++) {
		const dep = deps[i];
		if (!listeningSet.has(dep)) {
			switch (dep) {
				default:
					const isMediaEvent = mediaEventTypes.indexOf(dep) !== -1;
					if (!isMediaEvent) {
						trapBubbledEvent(dep, mountAt);
					}
			}
			listeningSet.add(dep);
		}
	}
}
