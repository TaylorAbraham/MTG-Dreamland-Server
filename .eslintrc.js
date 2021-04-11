module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: ['plugin:react/recommended', 'airbnb'],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['react', 'prettier'],
  rules: {
    // Only ok in server files
    'no-console': 0,
    // Allow braces around return-only arrow functions, for better readability
    'arrow-body-style': 0,
    // Allow arrow functions without return statements
    'consistent-return': 0,
    // Allow the convention where the non-connected component is exported, and the
    // component using connect is exported as default. This is made to allow mocking Redux.
    'import/no-named-as-default': 0,
    'no-nested-ternary': 0,
    'no-plusplus': 0,
    // Allow unused variables if they are prefixed with an underscore
    'no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
      },
    ],
    // Allow the use of non-template strings when it would be cleaner to do so
    'prefer-template': 0,
    // Disable prop types. Instead, create TypeScript prop interfaces
    'react/prop-types': 0,
    // This rule conflicts with Prettier
    'react/jsx-curly-newline': 0,
    // RN has trouble with jsx files, so we can't use them
    'react/jsx-filename-extension': 0,
    // Allow prop spreading for custom components
    'react/jsx-props-no-spreading': 0,
  },
};
