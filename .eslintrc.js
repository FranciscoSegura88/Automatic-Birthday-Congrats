module.exports = {
  // ... other ESLint configurations
  extends: [
    // ... other extends
    'plugin:prettier/recommended', // Enables eslint-plugin-prettier and eslint-config-prettier
    'prettier', // Disables ESLint rules that conflict with Prettier
  ],
  // ... other ESLint configurations
};
