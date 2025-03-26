import {
  App,
  Editor,
  MarkdownView,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
} from "obsidian";
import "dotenv/config";

interface GeminiRewriteSettings {
  geminiApiKey: string;
  customPrompt: string;
  useEnvApiKey: boolean;
  maxHistoryItems: number;
  rewriteHistory: RewriteHistoryItem[];
  selectedModel: string;
}

interface RewriteHistoryItem {
  originalText: string;
  rewrittenText: string;
  prompt: string;
  timestamp: number;
  model: string;
}

type GeminiModelKey =
  | "gemini-pro"
  | "gemini-1.5-pro"
  | "gemini-2.0-pro"
  | "gemini-2.0-flash"
  | "gemini-2.5-pro-exp-03-25";

const GEMINI_MODELS: Record<GeminiModelKey, string> = {
  "gemini-pro": "Gemini Pro",
  "gemini-1.5-pro": "Gemini 1.5 Pro",
  "gemini-2.0-pro": "Gemini 2.0 Pro",
  "gemini-2.0-flash": "Gemini 2.0 Flash (Faster)",
  "gemini-2.5-pro-exp-03-25": "Gemini 2.5 Pro (Experimental)",
};

const DEFAULT_SETTINGS: GeminiRewriteSettings = {
  geminiApiKey: "",
  customPrompt:
    process.env.GEMINI_DEFAULT_PROMPT || "Please rewrite the following text:",
  useEnvApiKey: true,
  maxHistoryItems: 10,
  rewriteHistory: [],
  selectedModel: "gemini-2.5-pro-exp-03-25",
};

export default class GeminiRewritePlugin extends Plugin {
  settings: GeminiRewriteSettings;
  statusBarItem: HTMLElement;

  async onload() {
    await this.loadSettings();

    // Create a status bar item for loading indicator
    this.statusBarItem = this.addStatusBarItem();
    this.statusBarItem.setText("");

    this.addCommand({
      id: "gemini-rewrite-selection",
      name: "Rewrite Selection with Gemini",
      editorCallback: (editor: Editor, view: MarkdownView) => {
        this.rewriteWithGemini(editor);
      },
    });

    // Add command to view rewrite history
    this.addCommand({
      id: "gemini-show-history",
      name: "Show Rewrite History",
      callback: () => {
        this.showRewriteHistory();
      },
    });

    // Add command to cancel ongoing rewrite
    this.addCommand({
      id: "gemini-cancel-rewrite",
      name: "Cancel Ongoing Rewrite",
      callback: () => {
        // This will be implemented with the AbortController for fetch
        new Notice("Attempting to cancel ongoing rewrite request");
        this.cancelOngoingRewrite();
      },
    });

    this.addSettingTab(new GeminiRewriteSettingTab(this.app, this));
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  // Store for the abort controller to cancel requests
  private abortController: AbortController | null = null;

  // Method to cancel ongoing request
  cancelOngoingRewrite() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
      this.setLoadingState(false);
      new Notice("Rewrite request cancelled");
    }
  }

  // Set loading state in UI
  setLoadingState(isLoading: boolean) {
    if (isLoading) {
      const modelDisplay =
        GEMINI_MODELS[this.settings.selectedModel as GeminiModelKey] ||
        this.settings.selectedModel;
      this.statusBarItem.setText(`🔄 Rewriting with ${modelDisplay}...`);
    } else {
      this.statusBarItem.setText("");
    }
  }

  // Add a rewrite to history
  addToHistory(originalText: string, rewrittenText: string, prompt: string) {
    const historyItem: RewriteHistoryItem = {
      originalText,
      rewrittenText,
      prompt,
      timestamp: Date.now(),
      model: this.settings.selectedModel,
    };

    // Add to beginning of array and limit size
    this.settings.rewriteHistory.unshift(historyItem);
    if (this.settings.rewriteHistory.length > this.settings.maxHistoryItems) {
      this.settings.rewriteHistory = this.settings.rewriteHistory.slice(
        0,
        this.settings.maxHistoryItems
      );
    }

    this.saveSettings();
  }

  // Show history modal
  showRewriteHistory() {
    if (this.settings.rewriteHistory.length === 0) {
      new Notice("No rewrite history available");
      return;
    }

    const modal = new RewriteHistoryModal(this.app, this);
    modal.open();
  }

  async rewriteWithGemini(editor: Editor) {
    const selection = editor.getSelection();

    if (!selection) {
      new Notice("No text selected");
      return;
    }

    // Set loading state
    this.setLoadingState(true);

    try {
      const rewrittenText = await this.callGeminiAPI(selection);
      editor.replaceSelection(rewrittenText);

      // Add to history
      this.addToHistory(selection, rewrittenText, this.settings.customPrompt);

      // Success notification
      new Notice("Text successfully rewritten");
    } catch (error) {
      if (error.name !== "AbortError") {
        // Don't show error for user cancellations
        console.error("Error calling Gemini API:", error);
        new Notice(`Error: ${error.message || "Failed to rewrite text"}`);
      }
    } finally {
      // Clear loading state
      this.setLoadingState(false);
    }
  }

  async callGeminiAPI(text: string): Promise<string> {
    // Create new abort controller for this request
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    // Get API key from environment variable if useEnvApiKey is true, otherwise use settings
    const apiKey = this.settings.useEnvApiKey
      ? process.env.GEMINI_API_KEY || this.settings.geminiApiKey
      : this.settings.geminiApiKey;

    if (!apiKey) {
      throw new Error(
        "Gemini API key is not set. Please add it to your .env file or plugin settings."
      );
    }

    const prompt = this.settings.customPrompt;
    const model = this.settings.selectedModel;

    // Gemini API endpoint with selected model
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    try {
      const response = await fetch(`${endpoint}?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${prompt}\n\n${text}`,
                },
              ],
            },
          ],
        }),
        signal, // Add abort signal
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errorMessage =
          errorData?.error?.message || `Status: ${response.status}`;
        throw new Error(`API request failed: ${errorMessage}`);
      }

      const data = await response.json();

      // Check if response has expected structure
      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new Error("Invalid response from Gemini API");
      }

      // Extract the response text from Gemini's response structure
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      throw error;
    } finally {
      this.abortController = null;
    }
  }
}

import { Modal, Setting as ModalSetting } from "obsidian";

class RewriteHistoryModal extends Modal {
  plugin: GeminiRewritePlugin;

  constructor(app: App, plugin: GeminiRewritePlugin) {
    super(app);
    this.plugin = plugin;
  }

  onOpen() {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Rewrite History" });

    const historyContainer = contentEl.createDiv({
      cls: "gemini-history-container",
    });

    // Add some styles
    historyContainer.style.maxHeight = "400px";
    historyContainer.style.overflow = "auto";
    historyContainer.style.margin = "10px 0";

    this.plugin.settings.rewriteHistory.forEach((item, index) => {
      const itemEl = historyContainer.createDiv({ cls: "gemini-history-item" });

      // Style the item
      itemEl.style.marginBottom = "20px";
      itemEl.style.padding = "10px";
      itemEl.style.border = "1px solid var(--background-modifier-border)";
      itemEl.style.borderRadius = "5px";

      // Add timestamp and model
      const date = new Date(item.timestamp);
      const headerEl = itemEl.createDiv({ cls: "gemini-history-header" });
      headerEl.style.display = "flex";
      headerEl.style.justifyContent = "space-between";
      headerEl.style.marginBottom = "5px";
      headerEl.createEl("div", {
        text: `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`,
        cls: "gemini-history-timestamp",
      });

      // Display model name
      const modelName =
        GEMINI_MODELS[item.model as GeminiModelKey] || item.model;
      headerEl.createEl("div", {
        text: `Model: ${modelName}`,
        cls: "gemini-history-model",
      });

      // Add prompt
      itemEl.createEl("div", {
        text: `Prompt: ${item.prompt}`,
        cls: "gemini-history-prompt",
      }).style.marginBottom = "5px";

      // Create container for original and rewritten text
      const textContainer = itemEl.createDiv({
        cls: "gemini-history-text-container",
      });
      textContainer.style.display = "flex";
      textContainer.style.gap = "10px";

      // Original text
      const originalEl = textContainer.createDiv({
        cls: "gemini-history-original",
      });
      originalEl.style.flex = "1";
      originalEl.style.padding = "5px";
      originalEl.style.border = "1px solid var(--background-modifier-border)";
      originalEl.style.borderRadius = "3px";
      originalEl.style.backgroundColor = "var(--background-primary)";
      originalEl.createEl("div", {
        text: "Original:",
        cls: "gemini-history-label",
      });
      originalEl.createEl("div", { text: item.originalText });

      // Rewritten text
      const rewrittenEl = textContainer.createDiv({
        cls: "gemini-history-rewritten",
      });
      rewrittenEl.style.flex = "1";
      rewrittenEl.style.padding = "5px";
      rewrittenEl.style.border = "1px solid var(--background-modifier-border)";
      rewrittenEl.style.borderRadius = "3px";
      rewrittenEl.style.backgroundColor = "var(--background-primary)";
      rewrittenEl.createEl("div", {
        text: "Rewritten:",
        cls: "gemini-history-label",
      });
      rewrittenEl.createEl("div", { text: item.rewrittenText });

      // Add buttons
      const buttonContainer = itemEl.createDiv({
        cls: "gemini-history-buttons",
      });
      buttonContainer.style.marginTop = "10px";
      buttonContainer.style.display = "flex";
      buttonContainer.style.gap = "5px";

      // Copy original button
      const copyOriginalBtn = buttonContainer.createEl("button", {
        text: "Copy Original",
      });
      copyOriginalBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(item.originalText);
        new Notice("Original text copied to clipboard");
      });

      // Copy rewritten button
      const copyRewrittenBtn = buttonContainer.createEl("button", {
        text: "Copy Rewritten",
      });
      copyRewrittenBtn.addEventListener("click", () => {
        navigator.clipboard.writeText(item.rewrittenText);
        new Notice("Rewritten text copied to clipboard");
      });

      // Delete item button
      const deleteBtn = buttonContainer.createEl("button", { text: "Delete" });
      deleteBtn.style.marginLeft = "auto";
      deleteBtn.addEventListener("click", () => {
        this.plugin.settings.rewriteHistory.splice(index, 1);
        this.plugin.saveSettings();
        this.close();
        this.open();
        new Notice("History item deleted");
      });
    });

    // Add clear all button at the bottom
    const clearAllBtn = contentEl.createEl("button", {
      text: "Clear All History",
    });
    clearAllBtn.addEventListener("click", () => {
      this.plugin.settings.rewriteHistory = [];
      this.plugin.saveSettings();
      this.close();
      new Notice("History cleared");
    });
  }

  onClose() {
    const { contentEl } = this;
    contentEl.empty();
  }
}

class GeminiRewriteSettingTab extends PluginSettingTab {
  plugin: GeminiRewritePlugin;

  constructor(app: App, plugin: GeminiRewritePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    containerEl.createEl("h2", { text: "Gemini Rewrite Settings" });

    // API Key settings
    containerEl.createEl("h3", { text: "API Configuration" });

    new Setting(containerEl)
      .setName("Use API Key from .env file")
      .setDesc(
        "If enabled, the plugin will use the GEMINI_API_KEY from your .env file instead of the setting below"
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.useEnvApiKey)
          .onChange(async (value) => {
            this.plugin.settings.useEnvApiKey = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName("Gemini API Key")
      .setDesc("Your Gemini API key (only used if not using .env file)")
      .addText((text) =>
        text
          .setPlaceholder("Enter your API key")
          .setValue(this.plugin.settings.geminiApiKey)
          .onChange(async (value) => {
            this.plugin.settings.geminiApiKey = value;
            await this.plugin.saveSettings();
          })
      );

    // Model selection
    new Setting(containerEl)
      .setName("Gemini Model")
      .setDesc("Select which Gemini model to use")
      .addDropdown((dropdown) => {
        Object.entries(GEMINI_MODELS).forEach(([key, name]) => {
          dropdown.addOption(key, name);
        });

        dropdown
          .setValue(this.plugin.settings.selectedModel)
          .onChange(async (value) => {
            this.plugin.settings.selectedModel = value;
            await this.plugin.saveSettings();
          });
      });

    // Rewrite settings
    containerEl.createEl("h3", { text: "Rewrite Settings" });

    new Setting(containerEl)
      .setName("Custom Prompt")
      .setDesc("The prompt to send to Gemini along with the selected text")
      .addTextArea((text) =>
        text
          .setPlaceholder("Please rewrite the following text:")
          .setValue(this.plugin.settings.customPrompt)
          .onChange(async (value) => {
            this.plugin.settings.customPrompt = value;
            await this.plugin.saveSettings();
          })
      );

    // History settings
    containerEl.createEl("h3", { text: "History Settings" });

    new Setting(containerEl)
      .setName("Max History Items")
      .setDesc("Maximum number of rewrite history items to store")
      .addSlider((slider) =>
        slider
          .setLimits(0, 50, 1)
          .setValue(this.plugin.settings.maxHistoryItems)
          .setDynamicTooltip()
          .onChange(async (value) => {
            this.plugin.settings.maxHistoryItems = value;

            // Trim history if needed
            if (this.plugin.settings.rewriteHistory.length > value) {
              this.plugin.settings.rewriteHistory =
                this.plugin.settings.rewriteHistory.slice(0, value);
            }

            await this.plugin.saveSettings();
          })
      );

    // View history button
    new Setting(containerEl)
      .setName("Rewrite History")
      .setDesc(
        `You have ${this.plugin.settings.rewriteHistory.length} items in your history.`
      )
      .addButton((button) =>
        button.setButtonText("View History").onClick(() => {
          this.plugin.showRewriteHistory();
        })
      )
      .addButton((button) =>
        button.setButtonText("Clear History").onClick(async () => {
          this.plugin.settings.rewriteHistory = [];
          await this.plugin.saveSettings();
          new Notice("History cleared");
          this.display(); // Refresh the settings view
        })
      );
  }
}
