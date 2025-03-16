# Obsidian Gemini Rewrite Plugin

This plugin allows you to select text in your Obsidian notes and rewrite it using Google's Gemini AI API.

## Features

- Select text and rewrite it with a single hotkey
- Customize the prompt sent to Gemini
- Configure your API key in settings or via `.env` file
- View loading indicator in status bar
- Cancel ongoing rewrites if needed
- Store and browse history of rewrites
- Copy original or rewritten text from history
- Choose from multiple Gemini models (2.0 Flash, 2.0 Pro, 1.5 Pro, Pro)

## Installation

1. In Obsidian, go to Settings → Community plugins → Browse
2. Search for "Gemini Rewrite"
3. Install the plugin
4. Enable the plugin in Settings → Community plugins

## Manual Installation

1. Download the latest release from GitHub
2. Extract the ZIP file into your Obsidian vault's `.obsidian/plugins` directory
3. Reload Obsidian
4. Enable the plugin in Settings → Community plugins

## Setup

### Using .env file (Recommended)

1. Create a `.env` file in your plugin directory (`.obsidian/plugins/gemini-rewrite/`)
2. Add your Gemini API key to the file:
   ```
   GEMINI_API_KEY=your_api_key_here
   GEMINI_DEFAULT_PROMPT=Please rewrite the following text:
   ```
3. Restart Obsidian or reload the plugin

### Using Plugin Settings

1. Get an API key from Google AI Studio (https://aistudio.google.com/)
2. Go to plugin settings and enter your API key
3. Disable the "Use API Key from .env file" option
4. Customize the prompt if desired
5. Select your preferred Gemini model (default is Gemini 2.0 Flash)

## Usage

1. Select text in your note
2. Use the command palette (Ctrl+P) and search for "Rewrite Selection with Gemini"
3. The selected text will be sent to Gemini and replaced with the AI-generated response
4. A loading indicator will appear in the status bar during the request
5. To cancel an ongoing rewrite, use the command palette and select "Cancel Ongoing Rewrite"

### Available Models

- **Gemini 2.0 Flash** (Default): Faster responses with good quality
- **Gemini 2.0 Pro**: Higher quality but may be slower
- **Gemini 1.5 Pro**: Previous generation model
- **Gemini Pro**: Original model

### History

- View your rewrite history using the command palette and select "Show Rewrite History"
- From the history, you can:
  - Copy the original text
  - Copy the rewritten text
  - See which model was used
  - Delete individual history items
  - Clear all history
- Configure how many history items to keep in the plugin settings

## Commands

- **Rewrite Selection with Gemini**: Rewrites the currently selected text
- **Show Rewrite History**: Opens a modal with your rewrite history
- **Cancel Ongoing Rewrite**: Cancels any in-progress rewrite request

## Development

This plugin is built using TypeScript and the Obsidian API.

```bash
# Install dependencies
bun install

# Create .env file from example
cp .env.example .env
# Edit .env with your API key

# Build the plugin in development mode
bun run dev

# Build the plugin for production
bun run build
```

## License

MIT
