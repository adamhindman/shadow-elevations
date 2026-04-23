# Shadow Elevation System

An interactive design tool for creating and testing layered shadow elevation systems. Adjust shadow parameters in real-time and preview them on a responsive grid of boxes.

## Features

- **Interactive Shadow Controls**: Adjust distance, blur, intensity, and layers
- **Per-Box Overrides**: Lock individual boxes to override global shadow settings
- **Live Preview**: See changes instantly on a 12×12 grid layout
- **Preset System**: Save and restore shadow configurations
- **Multiple Export Formats**:
  - CSS variables
  - Tokens Studio JSON (for Figma)
- **Persistent Storage**: Layout and presets are saved to localStorage
- **Keyboard Shortcuts**: Shift+Arrow keys for fine-tuning sliders

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The dev server will start at `http://localhost:5173`

### Build

```bash
npm run build
```

## Usage

1. **Adjust Global Shadows**: Use the sidebar controls to modify shadow parameters
2. **Lock Boxes**: Click the lock icon on any box to override its shadow independently
3. **Save Presets**: Click "Save preset" to store your configuration
4. **Export**: Use "Copy CSS" to copy CSS variables or "Copy tokens" for Figma integration

## Technical Details

This tool implements the layered shadow technique described in [Tobias Ahlin's article](https://tobiasahlin.com/blog/layered-smooth-box-shadows/), where each shadow layer doubles the y-offset and blur radius for a smooth, naturalistic effect.

## Tech Stack

- Vite
- Vanilla JavaScript (ES modules)
- CSS custom properties
