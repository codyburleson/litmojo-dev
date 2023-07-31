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
    Setting } from 'obsidian';
import { SimpleGreeting } from './SimpleGreeting.js';
//import './SimpleGreeting.js';

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
    authorization: string;
    token: string;
    atlassianHost: string;
    boardId: string;
    jql: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
    authorization: 'Basic Y29keS...',
    token: 'atlassian.xsrf.token=57ab427d-...',
    atlassianHost: 'myco.atlassian.net',
    boardId: '396',
    jql: '...'
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', (evt: MouseEvent) => {
			// Called when the user clicks the icon.
			new Notice('This is a notice!');
		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});
		// This adds a complex command that can check whether the current state of the app allows execution of the command
		this.addCommand({
			id: 'open-sample-modal-complex',
			name: 'Open sample modal (complex)',
			checkCallback: (checking: boolean) => {
				// Conditions to check
				const markdownView = this.app.workspace.getActiveViewOfType(MarkdownView);
				if (markdownView) {
					// If checking is true, we're simply "checking" if the command can be run.
					// If checking is false, then we want to actually perform the operation.
					if (!checking) {
						new SampleModal(this.app).open();
					}

					// This command will only show up in Command Palette when the check function returns true
					return true;
				}
			}
		});

        this.addCommand({
			id: 'sync-jira-issues',
			name: 'Sync Jira Issues',
			callback: async() => {
				console.log('>> Sync Jira Issues');
                console.log('authorization: ' + this.settings.authorization);
                console.log('token: ' + this.settings.token);
                console.log('atlassianHost: ' + this.settings.atlassianHost);
                console.log('boardId: ' + this.settings.boardId);

                // Get issues for board
                
                const options: RequestUrlParam = {
                    url: `https://${this.settings.atlassianHost}/rest/agile/1.0/board/${this.settings.boardId}/issue?jql=${this.settings.jql}`,
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': this.settings.authorization,
                        'Cookie': this.settings.token
                    },
                    //body: json
                };
                
                var response: RequestUrlResponse;
                
                try {
                    response = await requestUrl(options);
                    console.log(response.text);
                    //return response.text;
                } catch(e) {
                    console.log(JSON.stringify(e))
                }

            }
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
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
		const {containerEl} = this;

		containerEl.empty();

        const simple:SimpleGreeting = containerEl.createEl('simple-greeting', {text: 'Simple Greeting Component!'});

        const h2 = containerEl.createEl('h2', {text: 'Next Best Step Settinngs'});
        const hr = containerEl.createEl('hr');
        const h3 = containerEl.createEl('h3', {text: 'Atlassian Jira Integration'});

        new Setting(containerEl)
			.setName('Authorization')
			.setDesc('Enter bacic auth string')
			.addText(text => text
				.setPlaceholder('Basic Y29keS...')
				.setValue(this.plugin.settings.authorization)
				.onChange(async (value) => {
					this.plugin.settings.authorization = value;
					await this.plugin.saveSettings();
				}));

        new Setting(containerEl)
            .setName('Token')
            .setDesc('Enter Atlassian XSRF token')
            .addText(text => text
                .setPlaceholder('atlassian.xsrf.tokemn=...')
                .setValue(this.plugin.settings.token)
                .onChange(async (value) => {
                    this.plugin.settings.token = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Atlassian Host')
            .setDesc('Enter Atlassian host')
            .addText(text => text
                .setPlaceholder('mycco.atlassian.net')
                .setValue(this.plugin.settings.atlassianHost)
                .onChange(async (value) => {
                    this.plugin.settings.atlassianHost = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('Board ID')
            .setDesc('Enter Jira board id')
            .addText(text => text
                .setPlaceholder('')
                .setValue(this.plugin.settings.boardId)
                .onChange(async (value) => {
                    this.plugin.settings.boardId = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('JQL')
            .setDesc("Filters results using a JQL query. If you define an order in your JQL query, it will override the default order of the returned issues. Note that username and userkey can't be used as search terms for this parameter due to privacy reasons. Use accountId instead.")
            .addText(text => text
                .setPlaceholder('')
                .setValue(this.plugin.settings.jql)
                .onChange(async (value) => {
                    this.plugin.settings.jql = value;
                    await this.plugin.saveSettings();
                }));

	}

}
