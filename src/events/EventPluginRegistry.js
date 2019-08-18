let eventPluginOrder = null;
const namesToPlugins = {};

export const plugins = [];
export const eventNameDispatchConfigs = {};
export const registrationNameModules = {};
export const registrationNameDependencies = {};

function publishRegistrationName(registrationName, pluginModule, eventName) {
	registrationNameModules[registrationName] = pluginModule;
	registrationNameDependencies[registrationName] =
		pluginModule.eventTypes[eventName].dependencies;
}

function publishEventForPlugin(dispatchConfig, pluginModule, eventName) {
	eventNameDispatchConfigs[eventName] = dispatchConfig;

	const phasedRegistrationNames = dispatchConfig.phasedRegistrationNames;
	if (phasedRegistrationNames) {
		for (const phaseName in phasedRegistrationNames) {
			if (phasedRegistrationNames.hasOwnProperty(phaseName)) {
				const phasedRegistrationName =
					phasedRegistrationNames[phaseName];
				publishRegistrationName(
					phasedRegistrationName,
					pluginModule,
					eventName,
				);
			}
		}
		return true;
	} else if (dispatchConfig.registrationName) {
		publishRegistrationName(
			dispatchConfig.registrationName,
			pluginModule,
			eventName,
		);
		return true;
	}
	return false;
}

function recomputePluginOrdering() {
	if (!eventPluginOrder) {
		return;
	}
	for (const pluginName in namesToPlugins) {
		const pluginModule = namesToPlugins[pluginName];
		const pluginIndex = eventPluginOrder.indexOf(pluginName);
		if (plugins[pluginIndex]) {
			continue;
		}
		plugins[pluginIndex] = pluginModule;

		const publishedEvents = pluginModule.eventTypes;
		for (const eventName in publishedEvents) {
			if (publishedEvents.hasOwnProperty(eventName)) {
				publishEventForPlugin(
					publishedEvents[eventName],
					pluginModule,
					eventName,
				);
			}
		}
	}
}

export function injectEventPluginOrder(injectedEventPluginOrder) {
	eventPluginOrder = Array.prototype.slice.call(injectedEventPluginOrder);
	recomputePluginOrdering();
}

export function injectEventPluginsByName(injectedNamesToPlugins) {
	let isOrderingDirty = false;

	for (const pluginName in injectedNamesToPlugins) {
		if (!injectedNamesToPlugins.hasOwnProperty(pluginName)) {
			continue;
		}
		const pluginModule = injectedNamesToPlugins[pluginName];

		if (
			!namesToPlugins.hasOwnProperty(pluginName) ||
			namesToPlugins[pluginName] !== pluginModule
		) {
			namesToPlugins[pluginName] = pluginModule;
			isOrderingDirty = true;
		}
	}
	if (isOrderingDirty) {
		recomputePluginOrdering();
	}
}
