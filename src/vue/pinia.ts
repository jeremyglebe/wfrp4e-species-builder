import { createPinia } from 'pinia';

/**
 * Shared Pinia instance used by all module Vue apps.
 *
 * A single instance is created at module load time and passed to every
 * Vue app created by FoundryVueApplication. This means stores survive
 * across individual app open/close cycles, which is intentional — stores
 * are hydrated from persistence on each open via hydrateFromStorage().
 */
export const pinia = createPinia();
