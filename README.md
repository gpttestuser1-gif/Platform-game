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

This project is set up to deploy automatically using the **official
Vite + GitHub Pages** actions workflow. When you push to the **main**
branch, GitHub Actions will build the site and publish it for you.

### What happens automatically
1. GitHub runs `npm ci` and `npm run build`.
2. The output from `./dist` is uploaded as a Pages artifact (using
   the current `actions/upload-pages-artifact` release to avoid deprecated
   upload-artifact warnings).
3. GitHub's `deploy-pages` action publishes the artifact.
4. Your game is served at
   `https://gpttestuser1-gif.github.io/Platform-game/`.

### How to activate Pages on GitHub
1. Commit and push all changes to `main` (workflow, config, etc.).
2. Open your repo on GitHub and go to **Settings → Pages**.
3. Under **Build and deployment**, ensure **Source** is set to
   **GitHub Actions** (this is already configured).
4. Wait a minute, then visit the URL above to see the live game.

No manual branch or FTP pushing is required; every push to `main`
triggers a rebuild and redeploy.
