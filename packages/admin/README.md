This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Dev Environment

### formatting

You can configure a eslint plugin to format code on save.
The configuration for vscode is already on the repo, all you need to do is install the eslint plugin.

This project has a husky pre commit hook to format the staged changes using our styleguide.
To take advantage of that make sure to run `git commit` from within this folder.

### Sanctuary

Sanctuary has a runtime typechecker that can make be quite slow, but its turned off by default.

To turn it on add the following line to a `.env.local` file.

```
REACT_APP_TYPE_CHECK_SANCTUARY=true
```

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.<br>
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br>
You will also see any lint errors in the console.

### `npm fix`

Runs eslint --fix on the src folder

### `npm storybook`

Runs the storybook server

### `npm test`

Launches the test runner in the interactive watch mode.<br>
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.<br>
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.
