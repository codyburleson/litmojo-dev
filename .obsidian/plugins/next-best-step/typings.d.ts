import { SimpleGreeting } from './SimpleGreeting.js';

// Provide a good typescript typoing
// https://lit.dev/docs/components/defining/#typescript-typings
declare global {
	interface HTMLElementTagNameMap {
		"simple-greeting": SimpleGreeting;
	}
}
