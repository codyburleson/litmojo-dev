import { html, css, LitElement } from "lit";
import { property } from "lit/decorators.js";

//@customElement("litmojo-navbar")
export class NavBar extends LitElement {
	// static styles = css`
	// 	p {
	// 		color: blue;
	// 	}
	// `;

	@property()
	name = "Somebody";

    constructor() {
        super();
        // property defaults following
        // this.hasbutton = true;
      }

	render() {
		console.log(">> NavBVar.render()");
		return html`<p>Hello, ${this.name}!</p>`;
	}
}


customElements.get("litmojo-navbar") || customElements.define("litmojo-navbar", NavBar);
// if (!customElements.get('litmojo-navbar')) {
//     customElements.define('litmojo-navbar', NavBar);
// }

// Lit Element recommends adding an HTMLElementTagNameMap entry for all elements authored in TypeScript,
// and ensuring you publish your .d.ts typings in your npm package.
declare global {
	interface HTMLElementTagNameMap {
		"litmojo-navbar": NavBar;
	}
}
