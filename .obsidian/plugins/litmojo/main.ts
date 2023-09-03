import {
	App,
	Editor,
	MarkdownView,
	Modal,
	Notice,
	Plugin,
	PluginSettingTab,
	RequestUrlParam,
	RequestUrlResponse,
	requestUrl,
	Setting,
	TAbstractFile,
	TFile,
	TFolder,
} from "obsidian";
import { ICON_NAME, FILE_EXTENSION } from "./constants";
import { sendNotice } from "./utils/notice";
import { DEFAULT_DATA } from "./ExampleView";
import { NavBar } from "./components/NavBar";

import { ExampleView, VIEW_TYPE_EXAMPLE } from "./ExampleView.js";

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	authorization: string;
	token: string;
	atlassianHost: string;
	boardId: string;
	jql: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	authorization: "Basic Y29keS...",
	token: "atlassian.xsrf.token=57ab427d-...",
	atlassianHost: "myco.atlassian.net",
	boardId: "396",
	jql: "...",
};

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		this.registerView(VIEW_TYPE_EXAMPLE, (leaf) => new ExampleView(leaf));
		this.registerExtensions([FILE_EXTENSION], VIEW_TYPE_EXAMPLE);

        
        customElements.get("litmojo-navbar") || customElements.define("litmojo-navbar", NavBar);

		/**
		 * Registers the Compile menu, which should really only show up when there is a
		 * folder page with a litmojo compile config in the YAML frontmatter.
		 */
		this.registerEvent(
			this.app.workspace.on("file-menu", (menu, file) => {
				if (file instanceof TFile) {
					/*
                    menu.addItem((item) => {
                        item
                            .setTitle("Publish")
                            .setIcon("paper-plane")
                            .onClick(async () => {
                                new Notice(file.path);
                            });
                    });
                    */
				} else if (file instanceof TFolder) {
					menu.addItem((item) => {
						item.setTitle("LitMojo")
							.setIcon(ICON_NAME)
							.onClick(async () => {
								// ====================================================================================
								// LOAD COMPILE SETTINGS FROM FOLDER NOTE
								// ====================================================================================
                                
                                this.createOrOpenLitMojoConfig(file);
								

								// open the editor view here instead
							});
					});
				}
			})
		);

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon(
			"dice",
			"Sample Plugin",
			(evt: MouseEvent) => {
				// Called when the user clicks the icon.
				new Notice("This is a notice!");
			}
		);
		// Perform additional things with the ribbon
		ribbonIconEl.addClass("my-plugin-ribbon-class");

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText("Status Bar Text");

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: "open-sample-modal-simple",
			name: "Open sample modal (simple)",
			callback: () => {
				new SampleModal(this.app).open();
			},
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: "sample-editor-command",
			name: "Sample editor command",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection("Sample Editor Command");
			},
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: "open-sample-modal-complex",
			name: "Open sample modal (complex)",
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView =
					this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			},
		});

		this.addCommand({
			id: "sync-jira-issues",
			name: "Sync Jira Issues",
			callback: async () => {
				console.log(">> Sync Jira Issues");
				//console.log('authorization: ' + this.settings.authorization);
				//console.log('token: ' + this.settings.token);
				//console.log('atlassianHost: ' + this.settings.atlassianHost);
				//console.log('boardId: ' + this.settings.boardId);

				// First, we need to get all markdown documents from the open tasks directory
				// For each markdown document, we need to keep only those that have a jiraKey because for Jira sync,
				// we care only about those that came from Jira.
				// Next, we need to get all the issues from Jira
				// CLOSE TASKS
				// First we need to make a pass checking all the jira issues from markdown documents against those we got from Jira
				// If we find a markdown document with a Jira key that's not in the JSON response from Jira, we need to move that markdown document to the closed tasks directory
				// CREATE NEW TASKS
				// Next we need to make a pass checking all the issues from Jira against those we already have markdown documents for
				// If we find an issue from Jira that's not in the markdown documents, we need to create a new markdown document for that issue
				// UPDATE EXISTING TASKS
				// Next we need to make a pass checking all the issues from Jira against those we already have markdown documents for
				// If we find an issue from Jira that's in the markdown documents, we need to update the markdown document with the latest information from Jira

				// First, we need to get all markdown documents from the open tasks directory in the obsidian vault
				let jiraTaskDocuments: TFile[] = [];
				const openTasksFolder: TAbstractFile =
					this.app.vault.getAbstractFileByPath(
						"2 Areas/Tasks/Tasks-Open"
					);
				if (openTasksFolder instanceof TFolder) {
					// Recurse all the markdown files in the open tasks folder

					const openTasksFolderChildren = openTasksFolder.children;
					openTasksFolderChildren.forEach((childFile) => {
						if (childFile instanceof TFile) {
							// For each markdown document, we need to keep only those that have a jiraKey because for Jira sync
							// we care only about those that came from Jira.
							const docMeta =
								this.app.metadataCache.getFileCache(childFile);
							if (docMeta.frontmatter?.jiraKey) {
								jiraTaskDocuments.push(childFile);
								//console.log(`Has jiraKey: ${docMeta.frontmatter.jiraKey} > ${childFile.basename}`);
							}
						}
					});
					// This is just for debugging to prove that what we have saved in jiraTaskDocuments is correct
					// jiraTaskDocuments.forEach(jiraTaskDoc => {
					//     const docMeta = this.app.metadataCache.getFileCache(jiraTaskDoc);
					//     console.log(`Has jiraKey: ${docMeta.frontmatter.jiraKey} > ${jiraTaskDoc.basename}`);
					// });

					// Next, we need to get all the issues from Jira

					// Get issues for board
					const options: RequestUrlParam = {
						url: `https://${this.settings.atlassianHost}/rest/agile/1.0/board/${this.settings.boardId}/issue?jql=${this.settings.jql}&fields=created,summary,customfield_10036`,
						method: "GET",
						headers: {
							Accept: "application/json",
							Authorization: this.settings.authorization,
							Cookie: this.settings.token,
						},
						//body: json
					};

					console.log(`>> Sync Jira issues > url: ${options.url}`);

					var response: RequestUrlResponse;

					try {
						response = await requestUrl(options);
						// console.log(response.text);
						const parsedResponse = JSON.parse(response.text);
						console.log(
							`>> Sync Jira issues > syncing ${parsedResponse.total} issues.`
						);

						// CLOSE TASKS -----------------------------------------------------------------------------------------------------------------------------------------------------
						// First we need to make a pass checking all the jira issues from markdown documents against those we got from Jira
						// If we find a markdown document with a Jira key that's not in the JSON response from Jira, we need to move that markdown document to the closed tasks directory
						jiraTaskDocuments.forEach((jiraTaskDoc) => {
							// console.log('-- Checking Jira task doc: %s', jiraTaskDoc.basename );
							const docMeta =
								this.app.metadataCache.getFileCache(
									jiraTaskDoc
								);
							let exists = parsedResponse.issues.some(
								(parsedIssue: { key: string }) =>
									parsedIssue.key ===
									docMeta.frontmatter.jiraKey
							);
							if (!exists) {
								console.log(
									"Open issues does not contain: " +
										docMeta.frontmatter.jiraKey +
										" > moving to Tasks-Closed > " +
										jiraTaskDoc.basename
								);
								//...move that markdown document to the closed tasks directory
								this.app.fileManager.renameFile(
									jiraTaskDoc,
									"2 Areas/Tasks/Tasks-Closed/" +
										jiraTaskDoc.name
								);
							}
						});
						// ----------------------------------------------------------------------------------------------------------------------------------------------------------------

						//return response.text;
					} catch (e) {
						console.log(JSON.stringify(e));
					}
				} else {
					console.log("openTasksFolder is not a folder");
				}
			},
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, "click", (evt: MouseEvent) => {
			console.log("click", evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(
			window.setInterval(() => console.log("setInterval"), 5 * 60 * 1000)
		);

		sendNotice("LitMojo Plugin loaded!");
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async createOrOpenLitMojoConfig(parentFolder:TFolder): Promise<string> {

        console.log('>> createOrOpenLitMojoConfig() > parentFolder.path: %s', parentFolder.path);
        console.log('>> createOrOpenLitMojoConfig() > parentFolder.name: %s', parentFolder.name);

        this.app.workspace.detachLeavesOfType(VIEW_TYPE_EXAMPLE);

        // First we need to check whether or not the parent folder already has a litmojo config file
        // If it does, we need to open it
        // If it does not, we need to create it

        // Check for existing litmojo config file
        let litmojoConfigFile: TFile | null = null;
        const parentFolderChildren = parentFolder.children;
        parentFolderChildren.forEach((childFile) => {
            if (childFile instanceof TFile) {
                if (childFile.name === parentFolder.name + '.litmojo') {
                    litmojoConfigFile = childFile;
                }
            }
        });

        if(litmojoConfigFile) {
            console.log('litmojo config file already exists');
        } else {

            const file = await this.app.vault.create(
                        `${parentFolder.path}/${parentFolder.name}.${FILE_EXTENSION}`,
                        DEFAULT_DATA
                );

            const leaf = this.app.workspace.getLeaf("tab");

            await leaf.openFile(file, { active: true });

            leaf.setViewState({
                type: VIEW_TYPE_EXAMPLE,
                state: leaf.view.getState(),
            });

            this.app.workspace.revealLeaf(
                this.app.workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE)[0]
            );

            return file.path;

        }

        // if (litmojoConfigFile) {
        //     // Open the existing litmojo config file
        //     console.log('>> createOrOpenLitMojoConfig() > opening existing litmojo config file: %s', litmojoConfigFile.path);
        //     const leaf = this.app.workspace.getLeaf("tab");
        //     await leaf.openFile(litmojoConfigFile, { active: true });
        //     leaf.setViewState({
        //         type: VIEW_TYPE_EXAMPLE,
        //         state: leaf.view.getState(),
        //     });
        //     this.app.workspace.revealLeaf(
        //         this.app.workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE)[0]
        //     );
        //     return litmojoConfigFile.path;
        // } else {
        //     // Create a new litmojo config file
        //     console.log('>> createOrOpenLitMojoConfig() > creating new litmojo config file');
        //     const file = await this.app.vault.create(
        //         `${parentFolder.name}.litmojo`,
        //         DEFAULT_DATA
        //     );
        //     const leaf = this.app.workspace.getLeaf("tab");
        //     await leaf.openFile(file, { active: true });
        //     leaf.setViewState({
        //         type: VIEW_TYPE_EXAMPLE,
        //         state: leaf.view.getState(),
        //     });
        //     this.app.workspace.revealLeaf(
        //         this.app.workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE)[0]
        //     );
        //     return file.path;
        // }



		
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.setText("Woah!");
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		const h2 = containerEl.createEl("h2", {
			text: "Next Best Step Settinngs",
		});
		const hr = containerEl.createEl("hr");
		const h3 = containerEl.createEl("h3", {
			text: "Atlassian Jira Integration",
		});

		new Setting(containerEl)
			.setName("Authorization")
			.setDesc("Enter bacic auth string")
			.addText((text) =>
				text
					.setPlaceholder("Basic Y29keS...")
					.setValue(this.plugin.settings.authorization)
					.onChange(async (value) => {
						this.plugin.settings.authorization = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Token")
			.setDesc("Enter Atlassian XSRF token")
			.addText((text) =>
				text
					.setPlaceholder("atlassian.xsrf.tokemn=...")
					.setValue(this.plugin.settings.token)
					.onChange(async (value) => {
						this.plugin.settings.token = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Atlassian Host")
			.setDesc("Enter Atlassian host")
			.addText((text) =>
				text
					.setPlaceholder("mycco.atlassian.net")
					.setValue(this.plugin.settings.atlassianHost)
					.onChange(async (value) => {
						this.plugin.settings.atlassianHost = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Board ID")
			.setDesc("Enter Jira board id")
			.addText((text) =>
				text
					.setPlaceholder("")
					.setValue(this.plugin.settings.boardId)
					.onChange(async (value) => {
						this.plugin.settings.boardId = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("JQL")
			.setDesc(
				"Filters results using a JQL query. If you define an order in your JQL query, it will override the default order of the returned issues. Note that username and userkey can't be used as search terms for this parameter due to privacy reasons. Use accountId instead."
			)
			.addText((text) =>
				text
					.setPlaceholder("")
					.setValue(this.plugin.settings.jql)
					.onChange(async (value) => {
						this.plugin.settings.jql = value;
						await this.plugin.saveSettings();
					})
			);
	}
}
