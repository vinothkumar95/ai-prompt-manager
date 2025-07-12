# Publishing Guide for AI Prompt Manager

This guide will help you publish the AI Prompt Manager extension to the VS Code Marketplace.

## Prerequisites

### 1. Microsoft Account
- Create a Microsoft account if you don't have one
- Go to [Microsoft Partner Center](https://partner.microsoft.com/)

### 2. Publisher Account
- Sign up for a publisher account in the [Visual Studio Marketplace](https://marketplace.visualstudio.com/)
- Choose a unique publisher name (this will be your extension's namespace)

### 3. Personal Access Token (PAT)
- Go to [Azure DevOps](https://dev.azure.com/)
- Create a new organization or use existing one
- Go to User Settings → Personal Access Tokens
- Create a new token with "Marketplace (Publish)" scope
- Save the token securely

## Setup Steps

### 1. Update Configuration Files

#### Update package.json
Replace `"your-publisher-name"` with your actual publisher name:

```json
{
  "publisher": "your-actual-publisher-name",
  "repository": {
    "type": "git",
    "url": "https://github.com/your-username/ai-prompt-manager.git"
  },
  "bugs": {
    "url": "https://github.com/your-username/ai-prompt-manager/issues"
  },
  "homepage": "https://github.com/your-username/ai-prompt-manager#readme"
}
```

#### Update README.md
Replace all instances of `your-username` with your actual GitHub username.

#### Update .vscode/vsce-publisher-config.json
```json
{
  "publisher": "your-actual-publisher-name",
  "pat": "your-personal-access-token"
}
```

### 2. Install Publishing Tools

```bash
npm install -g vsce
```

### 3. Prepare Your Extension

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Run tests
npm run test

# Lint code
npm run lint
```

## Publishing Process

### 1. Package the Extension

```bash
# Create a .vsix package
vsce package
```

This creates `ai-prompt-manager-1.0.0.vsix`

### 2. Test the Package

```bash
# Install the package locally to test
code --install-extension ai-prompt-manager-1.0.0.vsix
```

### 3. Publish to Marketplace

```bash
# Publish using your PAT
vsce publish
```

Or publish with specific version:

```bash
vsce publish patch  # 1.0.0 -> 1.0.1
vsce publish minor  # 1.0.0 -> 1.1.0
vsce publish major  # 1.0.0 -> 2.0.0
```

## Marketplace Listing

### 1. Extension Icon
- Ensure `resources/prompt-templates.png` is high quality (128x128px minimum)
- Icon should be clear and recognizable

### 2. Description
- The README.md content will be used as your marketplace description
- Ensure it's comprehensive and user-friendly

### 3. Tags and Categories
Your extension is already configured with:
- Categories: "Other", "Productivity"
- Keywords: "ai", "prompt", "templates", "chatgpt", "productivity", "code", "snippets"

### 4. Screenshots and Videos
Consider adding:
- Screenshots of the extension in action
- GIF or video demonstrating key features
- Add to README.md or create separate media files

## Post-Publishing

### 1. Monitor
- Check the [Visual Studio Marketplace](https://marketplace.visualstudio.com/) for your extension
- Monitor downloads and ratings
- Respond to user feedback

### 2. Updates
For future updates:

1. **Update Version**
   ```bash
   # Update package.json version
   # Update CHANGELOG.md
   ```

2. **Compile and Test**
   ```bash
   npm run compile
   npm run test
   ```

3. **Package and Publish**
   ```bash
   vsce package
   vsce publish
   ```

## Troubleshooting

### Common Issues

#### "Publisher not found"
- Ensure your publisher name is correct in package.json
- Verify your PAT has the correct permissions

#### "Extension validation failed"
- Check that all required fields are filled
- Ensure README.md is properly formatted
- Verify icon file exists and is valid

#### "Version already exists"
- Increment the version number in package.json
- Update CHANGELOG.md

### Getting Help

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Marketplace Publishing](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [VS Code Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Security Notes

- Never commit your PAT to version control
- Use environment variables for sensitive data
- Regularly rotate your PAT

## Best Practices

### Before Publishing
- [ ] Test extension thoroughly
- [ ] Update all documentation
- [ ] Ensure no sensitive data in code
- [ ] Verify all links work
- [ ] Test on different platforms

### After Publishing
- [ ] Monitor user feedback
- [ ] Respond to issues promptly
- [ ] Plan regular updates
- [ ] Maintain documentation

## Success Metrics

Track these metrics after publishing:
- Download count
- User ratings and reviews
- GitHub stars and issues
- User engagement and feedback

Good luck with your extension! 🚀 