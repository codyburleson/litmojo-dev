import { TFile, TextFileView, WorkspaceLeaf } from "obsidian";
//import React from "react";
//import { createRoot, Root } from "react-dom/client";
import { sendNotice } from "./utils/notice";
//import CustomViewContent from './components/CustomViewContent';
import { NavBar } from "components/NavBar";

import { LitElement } from "lit";

export const VIEW_TYPE_EXAMPLE = "example";

export const DEFAULT_DATA = "";

export class ExampleView extends TextFileView {
	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	data: string = DEFAULT_DATA;

	file: TFile;

	timer: NodeJS.Timeout | null;

	debounceSave = () => {
		this.timer && clearTimeout(this.timer);

		this.timer = setTimeout(() => {
			this.timer && clearTimeout(this.timer);
			this.timer = null;
			this.save();
		}, 200);
	};

	getViewType() {
		return VIEW_TYPE_EXAMPLE;
	}

	async onLoadFile(file: TFile): Promise<void> {
		this.file = file;

		this.render(file);
	}

	async onUnloadFile(file: TFile): Promise<void> {
		this.clear();
	}

	onunload() {
		this.clear();

		//this.root?.unmount();
	}

	async onClose() {
		//this.root?.unmount();
	}

	// Gets the data from the editor.
	// This will be called to save the editor contents to the file.
	getViewData(): string {
		return this.data;
	}

	// Set the data to the editor. This is used to load the file contents.
	// If clear is set, then it means we're opening a completely different file.
	// In that case, you should call clear(), or implement a slightly more efficient clearing mechanism given the new data to be set.
	setViewData(data: string = DEFAULT_DATA, clear: boolean = false): void {
		this.data = data;

		if (clear) {
			this.clear();
		}
	}

	async save(clear: boolean = false) {
		try {
			this.app.vault.modify(this.file, this.data);

			if (clear) {
				this.clear();
			}
		} catch (err) {
			console.error("Save failed:", err);
			sendNotice("Save failed!");
		}
	}

	onChange(value: string) {
		this.setViewData(value);
		this.debounceSave();
	}

	async render(file: TFile) {
		const { containerEl } = this;

		containerEl.empty();
        

		//let navBar: NavBar = containerEl.createEl("litmojo-navbar");
        

        const navBar: NavBar = containerEl.createEl("litmojo-navbar", {});
        navBar.name = file.basename;

        // let navBar: NavBar = new NavBar();
        // navBar.name = "Cody";
        // containerEl.appendChild(navBar);


        // Instatiate a new NavBar component and append it to the container element.
        // Note that we're using the `append` method instead of `appendChild` because
        // the former is a method of the HTMLElement interface, while the latter is a
        // method of the Node interface. The HTMLElement interface extends the Node interface.

        // let navBar: NavBar = new NavBar();
        // navBar.name = "Cody";
        // containerEl.appendChild(navBar);

        containerEl.appendChild(new NavBar());

		//this.root = this.root || createRoot(this.containerEl.children[1]);;

		let fileData = await this.app.vault.read(file);

		this.setViewData(fileData);
	}

	// Clear the editor.
	// This is usually called when we're about to open a completely different file, so it's best to clear
	// any editor states like undo-redo history, and any caches/indexes associated with the previous file contents.
	clear(): void {
		this.timer && clearTimeout(this.timer);
		this.timer = null;

		this.setViewData(DEFAULT_DATA);
		//this.root?.render(null);
	}
}
