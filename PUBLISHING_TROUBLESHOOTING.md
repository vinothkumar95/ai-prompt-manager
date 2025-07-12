# Publishing Troubleshooting Guide

## Error: "Value cannot be null. Parameter name: v1"

This error typically occurs when the Personal Access Token (PAT) is not configured correctly or is missing.

## Step-by-Step Solution

### 1. Create a Personal Access Token (PAT)

1. **Go to Azure DevOps**
   - Visit: https://dev.azure.com/
   - Sign in with your Microsoft account

2. **Create or Select Organization**
   - If you don't have an organization, create one
   - Or use an existing organization

3. **Generate PAT**
   - Click on your profile picture (top right)
   - Select "Personal access tokens"
   - Click "New Token"
   - Set the following:
     - **Name**: "VS Code Extension Publishing"
     - **Organization**: Select your organization
     - **Expiration**: Choose appropriate date (e.g., 1 year)
     - **Scopes**: Select "Marketplace (Publish)"
   - Click "Create"
   - **Copy the token immediately** (you won't see it again)

### 2. Configure the PAT

#### Option A: Using Environment Variable (Recommended)

```bash
# Set the PAT as an environment variable
export VSCE_PAT="your-actual-pat-token-here"

# Then publish
vsce publish
```

#### Option B: Using Configuration File

1. **Update the configuration file**:
   ```bash
   # Edit .vscode/vsce-publisher-config.json
   {
     "publisher": "vinothkumarchellapandi",
     "pat": "your-actual-pat-token-here"
   }
   ```

2. **Publish**:
   ```bash
   vsce publish
   ```

### 3. Alternative Publishing Methods

#### Method 1: Direct PAT in Command
```bash
vsce publish -p your-actual-pat-token-here
```

#### Method 2: Interactive Login
```bash
vsce login vinothkumarchellapandi
# Enter your PAT when prompted
```

### 4. Verify Publisher Account

1. **Check Publisher Status**
   - Go to: https://marketplace.visualstudio.com/manage
   - Sign in with your Microsoft account
   - Verify your publisher account is active

2. **Verify Publisher Name**
   - Ensure "vinothkumarchellapandi" is your exact publisher name
   - Publisher names are case-sensitive

### 5. Test Publishing Process

```bash
# 1. Package the extension
vsce package

# 2. Test the package locally
code --install-extension ai-prompt-manager-1.0.0.vsix

# 3. If everything works, publish
vsce publish
```

## Common Issues and Solutions

### Issue 1: "Publisher not found"
**Solution**: 
- Verify publisher name in package.json matches exactly
- Ensure publisher account is created and active

### Issue 2: "PAT has insufficient permissions"
**Solution**:
- Create new PAT with "Marketplace (Publish)" scope
- Ensure PAT is not expired

### Issue 3: "Version already exists"
**Solution**:
- Increment version in package.json
- Update CHANGELOG.md

### Issue 4: "Extension validation failed"
**Solution**:
- Check all required fields in package.json
- Ensure README.md is properly formatted
- Verify icon file exists

## Complete Publishing Checklist

Before publishing, ensure:

- [ ] PAT is created with "Marketplace (Publish)" scope
- [ ] Publisher account is active
- [ ] Publisher name matches exactly in package.json
- [ ] Version number is unique
- [ ] All placeholder text is replaced
- [ ] Extension packages successfully
- [ ] Extension works when installed locally

## Quick Test Commands

```bash
# Test compilation
npm run compile

# Test packaging
vsce package

# Test installation
code --install-extension ai-prompt-manager-1.0.0.vsix

# Test publishing (with PAT)
vsce publish
```

## Getting Help

If you're still having issues:

1. **Check VSCE Version**: `vsce --version`
2. **Check Node.js Version**: `node --version`
3. **Verify PAT Permissions**: Ensure it has "Marketplace (Publish)" scope
4. **Check Publisher Status**: Verify account is active at marketplace.visualstudio.com

## Security Notes

- Never commit your PAT to version control
- Use environment variables when possible
- Regularly rotate your PAT
- Keep your PAT secure and private

## Success Indicators

When publishing is successful, you should see:
- No error messages
- Extension appears on marketplace within a few minutes
- You receive a success confirmation

If you see any of these, the publishing was successful:
- "Published successfully"
- "Extension uploaded"
- No error messages 