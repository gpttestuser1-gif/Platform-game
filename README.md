# Tri World Odyssey: Platform Game

Tri World Odyssey is a platform game built with React, TypeScript, and Vite. Explore unique levels, overcome obstacles, and enjoy smooth gameplay in a modern web environment.

## Features
- Multiple levels with increasing difficulty
- Responsive controls and smooth animations
- Modern UI with React and Tailwind CSS
- Fun effects using Konva and canvas-confetti
- Easy to extend and customize

## Getting Started

Follow these steps to run the game locally:

1. **Install Node.js**
   - Download and install Node.js from [nodejs.org](https://nodejs.org/).

2. **Install dependencies**
   - Open a terminal in the project folder.
   - Run:
     ```sh
     npm install
     ```

3. **Start the development server**
   - Run:
     ```sh
     npm run dev
     ```
   - Open your browser and go to [http://localhost:3000](http://localhost:3000).

## Building the Project

To create a production build:

```sh
npm run build
```

The output will be in the `dist` folder.

## Project Structure

```
Platform-game/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── App.tsx          # Main React component
│   ├── index.css        # Global styles
│   ├── main.tsx         # Entry point
│   ├── types.ts         # Type definitions
│   └── game/
│       └── levels.ts    # Game level data
```

## Troubleshooting

- **npm install errors**: Make sure you have a stable internet connection and the latest version of Node.js.
- **npm run dev fails**: Check for error messages in the terminal. Try running `npm install` again.
- **Port already in use**: If port 3000 is busy, stop other running apps or change the port in `package.json`.
- **Build issues**: Delete the `dist` folder and run `npm run build` again.
- **General tips**:
  - Restart your terminal if you see strange errors.
  - If you get stuck, search for the error message online or ask for help.

Enjoy building and playing Tri World Odyssey!

## Deploy to GitHub Pages

This project can be hosted for free using GitHub Pages. The setup
is already included via a GitHub Actions workflow that runs when you
push to the **main** branch.

### What happens automatically
1. The action installs dependencies and runs `npm run build`.
2. The built files in `dist/` are pushed to the `gh-pages` branch.
3. GitHub Pages serves the site from that branch at:
   `https://gpttestuser1-gif.github.io/Platform-game/`

### What you need to do on GitHub
1. Push your changes (the workflow file, config updates, etc.) to
   `main`.
2. In the repository on GitHub, go to **Settings → Pages**.
3. Under **Source**, choose the `gh-pages` branch and `/ (root)` folder,
   then click **Save**.
4. After a minute, visit the URL above to see your game live.

GitHub Pages will rebuild automatically on every subsequent push to
`main`.
