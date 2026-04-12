/**
 * Module bootstrap entrypoint loaded by Foundry.
 */
import './hooks';

// Import global styles (affects Foundry and Vue components).
// CSS files need to be imported somewhere to be included in the build.
// Since this is global and not intended to be imported individually by
// each component, it is imported here at the module entrypoint.
import '../../styles/global.css';
