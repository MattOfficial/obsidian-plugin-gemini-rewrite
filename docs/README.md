# Obsidian Gemini Rewrite Plugin Documentation

## Project Structure

```
obsidian-plugin-ai-rewrite/
├── main.ts              # Main plugin file with the core functionality
├── manifest.json        # Plugin manifest with metadata
├── package.json         # Node.js package configuration
├── tsconfig.json        # TypeScript configuration
├── esbuild.config.mjs   # Build configuration
├── version-bump.mjs     # Version update script
├── .env.example         # Example environment variables template
└── docs/                # Documentation directory
    └── README.md        # This file
```

## Current Progress

- [x] Created basic project structure
- [x] Set up TypeScript and build configuration
- [x] Implemented plugin settings management
- [x] Created text selection and replacement mechanism
- [x] Added Gemini API integration
- [x] Added .env file support for API key
- [x] Add loading state while API call is in progress
- [x] Add error handling for better user experience
- [x] Add support for remembering previous rewrites
- [x] Add ability to cancel ongoing requests
- [x] Add support for multiple Gemini models
- [ ] Improve UX and styling

## Plugin Usage

This plugin allows you to select text in your Obsidian notes and rewrite it using Google's Gemini API with a custom prompt.

### Features

- Select text and have it rewritten by Gemini
- Configure a custom prompt
- Save your API key in the settings or .env file
- Toggle between using .env file or settings for API key
- View loading state in the status bar
- Cancel ongoing rewrite requests
- View and manage rewrite history
- Copy original or rewritten text from history
- Choose different Gemini models (Pro, 1.5 Pro, 2.0 Pro, 2.0 Flash)

### Configuration Options

- **Use API Key from .env file**: Toggle to use GEMINI_API_KEY from .env file
- **Gemini API Key**: Manual API key input (used only if not using .env)
- **Gemini Model**: Select which Gemini model to use (Gemini 2.0 Flash is the default)
- **Custom Prompt**: The prompt that's sent to Gemini with your selected text
- **Max History Items**: Control how many history items to store (0-50)

### Commands

The plugin adds the following commands that can be accessed from the command palette:

- **Rewrite Selection with Gemini**: Rewrites the currently selected text
- **Show Rewrite History**: Opens a modal showing your rewrite history
- **Cancel Ongoing Rewrite**: Cancels any in-progress API request

### How to Use

1. Select text you want to rewrite
2. Use command palette and search for "Rewrite Selection with Gemini" or set up a custom hotkey
3. The selected text will be replaced with Gemini's response
4. A loading indicator will appear in the status bar during the request
5. View your history of rewrites using the "Show Rewrite History" command

## Environment Variables

The plugin supports the following environment variables in a .env file:

- `GEMINI_API_KEY`: Your Gemini API key
- `GEMINI_DEFAULT_PROMPT`: Default prompt template (optional)

## Gemini Models

The plugin supports several Gemini models:

| Model            | Description                                  |
| ---------------- | -------------------------------------------- |
| Gemini 2.0 Flash | Faster responses with good quality (default) |
| Gemini 2.0 Pro   | High quality but may be slower               |
| Gemini 1.5 Pro   | Previous generation model                    |
| Gemini Pro       | Original model                               |

## Implementation Details

### Loading State

- Status bar indicator shows when a rewrite is in progress
- User gets visual feedback during API calls
- Shows which model is being used

### Error Handling

- Improved error messages from the API with details
- User-friendly notifications
- Proper error handling for network issues, API errors, and more

### Request Cancellation

- Uses AbortController to allow cancelling ongoing API requests
- Command to cancel rewrite if it's taking too long

### History Management

- Stores rewrite history with timestamps
- Shows original text, rewritten text, prompt used, and model used
- Ability to copy either original or rewritten text
- Delete individual history items or clear all history
- Configure maximum history items to store

## TODO

- Add more customization options for the UI
- Implement keyboard shortcuts for history navigation
- Add ability to export/import history
- Add more robust error handling
