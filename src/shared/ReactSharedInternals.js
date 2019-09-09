import ReactCurrentDispatcher from '../react/ReactCurrentDispatcher'

const ReactSharedInternals = {
    ReactCurrentDispatcher,
    ReactCurrentBatchConfig: {
        suspense: null,
    },
    ReactCurrentOwner: {
        current: null
    },
    IsSomeRendererActing: {
        current: false,
    },
    assign: Object.assign,
    // Used by renderers to avoid bundling object-assign twice in UMD bundles:
  };

export default ReactSharedInternals

