/**
 * This file is the module entry point which kicks off all other code execution.
 *
 * If it seems quite empty, that is because most Foundry module code really starts
 * in response to specific Foundry hooks- and our pattern has hook handlers in ./hooks/
 *
 * So, by importing ./hooks here, we effectively start the module's code execution.
 *
 * If you want to know which hook fires first to start things off, it is usually 'init'.
 */
import './hooks';

// Import global styles (affects Foundry and Vue components).
// CSS files need to be imported somewhere to be included in the build.
import '../../styles/global.css';
