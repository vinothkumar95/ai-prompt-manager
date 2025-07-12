# Publishing Checklist for AI Prompt Manager

Use this checklist to ensure your extension is ready for publishing to the VS Code Marketplace.

## ✅ Pre-Publishing Checklist

### Configuration Files
- [ ] **package.json**
  - [ ] Publisher name is correct (replace "your-publisher-name")
  - [ ] Version is set to "1.0.0"
  - [ ] Display name is "AI Prompt Manager"
  - [ ] Description is clear and compelling
  - [ ] Categories include "Productivity"
  - [ ] Keywords are relevant and comprehensive
  - [ ] Repository URL is correct
  - [ ] License is "MIT"
  - [ ] Engine version is compatible (^1.85.0)

### Documentation
- [ ] **README.md**
  - [ ] All "your-username" placeholders replaced with actual GitHub username
  - [ ] Features are clearly described
  - [ ] Installation instructions are clear
  - [ ] Usage examples are provided
  - [ ] Screenshots or GIFs are included (optional but recommended)
  - [ ] Requirements are listed
  - [ ] Known issues are documented
  - [ ] Support information is provided

- [ ] **CHANGELOG.md**
  - [ ] Follows Keep a Changelog format
  - [ ] Version 1.0.0 is documented
  - [ ] All features are listed under "Added"
  - [ ] Breaking changes are documented (if any)
  - [ ] Bug fixes are listed

- [ ] **LICENSE**
  - [ ] MIT License is included
  - [ ] Copyright year is correct

### Code Quality
- [ ] **TypeScript Compilation**
  - [ ] `npm run compile` passes without errors
  - [ ] All TypeScript errors are resolved
  - [ ] No JavaScript linter errors

- [ ] **Testing**
  - [ ] `npm run test` passes
  - [ ] `npm run lint` passes
  - [ ] Manual testing completed

- [ ] **Extension Functionality**
  - [ ] Extension activates correctly
  - [ ] Activity bar icon appears
  - [ ] Webview loads properly
  - [ ] All features work as expected
  - [ ] Error handling is robust

### Assets
- [ ] **Icon**
  - [ ] `resources/prompt-templates.png` exists
  - [ ] Icon is high quality (128x128px minimum)
  - [ ] Icon is clear and recognizable
  - [ ] Icon represents the extension well

- [ ] **Screenshots** (Optional but recommended)
  - [ ] Screenshot of the extension in action
  - [ ] Screenshot showing key features
  - [ ] Screenshots are high quality

### Security & Privacy
- [ ] **No Sensitive Data**
  - [ ] No API keys in code
  - [ ] No personal information in code
  - [ ] No hardcoded credentials

- [ ] **Data Handling**
  - [ ] Local storage only (no external data collection)
  - [ ] Privacy policy if needed
  - [ ] User data is handled securely

## ✅ Publishing Setup

### Marketplace Account
- [ ] **Microsoft Account**
  - [ ] Created Microsoft account
  - [ ] Verified email address

- [ ] **Publisher Account**
  - [ ] Created publisher account
  - [ ] Chosen unique publisher name
  - [ ] Publisher name matches package.json

- [ ] **Personal Access Token (PAT)**
  - [ ] Created PAT with "Marketplace (Publish)" scope
  - [ ] PAT is securely stored
  - [ ] PAT is not committed to repository

### Publishing Tools
- [ ] **VSCE Installation**
  - [ ] `npm install -g vsce` completed
  - [ ] VSCE is working correctly

- [ ] **Configuration**
  - [ ] `.vscode/vsce-publisher-config.json` is set up
  - [ ] Publisher name is correct
  - [ ] PAT is configured

## ✅ Testing Checklist

### Local Testing
- [ ] **Extension Package**
  - [ ] `vsce package` creates .vsix file
  - [ ] Package installs correctly: `code --install-extension ai-prompt-manager-1.0.0.vsix`
  - [ ] Extension works in fresh VS Code instance

- [ ] **Functionality Testing**
  - [ ] Categories can be created, edited, deleted
  - [ ] Prompts can be created, edited, deleted
  - [ ] Template variables work correctly
  - [ ] Code insertion works
  - [ ] Copy to clipboard works
  - [ ] Error handling works
  - [ ] Keyboard navigation works

### Cross-Platform Testing
- [ ] **Windows** (if possible)
  - [ ] Extension installs and works
  - [ ] All features function correctly

- [ ] **macOS** (if possible)
  - [ ] Extension installs and works
  - [ ] All features function correctly

- [ ] **Linux** (if possible)
  - [ ] Extension installs and works
  - [ ] All features function correctly

## ✅ Final Publishing Steps

### Before Publishing
- [ ] **Final Review**
  - [ ] All placeholder text replaced
  - [ ] All links work correctly
  - [ ] Documentation is complete
  - [ ] Code is clean and well-documented

- [ ] **Package Creation**
  - [ ] `npm run compile` completed
  - [ ] `vsce package` completed
  - [ ] .vsix file is created successfully

### Publishing
- [ ] **Marketplace Publishing**
  - [ ] `vsce publish` executed
  - [ ] No errors during publishing
  - [ ] Extension appears on marketplace

- [ ] **Post-Publishing Verification**
  - [ ] Extension page loads correctly
  - [ ] Description displays properly
  - [ ] Icon appears correctly
  - [ ] Installation instructions work

## ✅ Post-Publishing Tasks

### Monitoring
- [ ] **Set up monitoring**
  - [ ] Check marketplace listing regularly
  - [ ] Monitor user feedback
  - [ ] Track download statistics

### Maintenance
- [ ] **Plan for updates**
  - [ ] Set up issue templates
  - [ ] Plan feature roadmap
  - [ ] Schedule regular maintenance

### Community
- [ ] **Engage with users**
  - [ ] Respond to reviews
  - [ ] Address issues promptly
  - [ ] Consider user feedback for updates

## 🚨 Common Issues to Check

### Before Publishing
- [ ] Publisher name matches exactly in all files
- [ ] No console errors in extension
- [ ] All TypeScript compilation errors resolved
- [ ] Extension activates without errors
- [ ] Webview loads correctly
- [ ] All features work as documented

### During Publishing
- [ ] PAT has correct permissions
- [ ] Publisher account is active
- [ ] Version number is unique
- [ ] All required fields are filled

### After Publishing
- [ ] Extension appears in marketplace search
- [ ] Installation works for users
- [ ] No critical bugs reported immediately

## 📝 Notes

- **Publisher Name**: Must be unique across the entire marketplace
- **Version Numbers**: Must be semantic versioning (e.g., 1.0.0, 1.0.1)
- **PAT Security**: Never commit your PAT to version control
- **Testing**: Always test the packaged extension before publishing
- **Documentation**: Good documentation increases adoption

## 🎉 Success!

Once you've completed all items on this checklist, your extension should be ready for publishing. Good luck! 🚀 