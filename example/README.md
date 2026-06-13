# Example App

This folder contains a React Native example app that demonstrates the markdown chat flow for this repo:

- message list rendered with `Markdown`
- composer fixed to the bottom
- expandable markdown input using `MarkdownComposer`
- send button that appends the drafted markdown to the chat

## Run It

From [example/package.json](/Users/ronradtke/react-native-markdown-display/example/package.json):

```sh
npm install
npm start
```

In another terminal:

```sh
npm run android
```

Or on iOS:

```sh
bundle install
cd ios
bundle exec pod install
cd ..
npm run ios
```

## Local Package Resolution

The example imports the local source from `../src`, and [metro.config.js](/Users/ronradtke/react-native-markdown-display/example/metro.config.js) watches the repo root so changes to the library are reflected in the app during development.
