# Contributing to AI Prompt Manager

Thank you for your interest in contributing to AI Prompt Manager! This document provides guidelines and information for contributors.

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn
- VS Code (for testing the extension)

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/ai-prompt-manager.git
   cd ai-prompt-manager
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Compile the Extension**
   ```bash
   npm run compile
   ```

4. **Start Development**
   - Press `F5` in VS Code to start debugging
   - A new VS Code window will open with your extension loaded
   - Make changes and reload the extension window to see updates

## Development Workflow

### Making Changes

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Follow the coding standards below
   - Add tests for new functionality
   - Update documentation if needed

3. **Test Your Changes**
   ```bash
   npm run test
   npm run lint
   ```

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push and Create Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

### Code Standards

- **TypeScript**: Use TypeScript for all new code
- **ESLint**: Follow the ESLint configuration
- **Prettier**: Use consistent formatting
- **Comments**: Add JSDoc comments for public functions
- **Error Handling**: Always handle errors gracefully
- **Accessibility**: Ensure keyboard navigation works

### Testing

- **Unit Tests**: Add tests for new functionality
- **Integration Tests**: Test the extension in VS Code
- **Manual Testing**: Test all user workflows

## Pull Request Guidelines

### Before Submitting

1. **Ensure Quality**
   - Code compiles without errors
   - All tests pass
   - Linting passes
   - No console errors

2. **Update Documentation**
   - Update README.md if adding new features
   - Update CHANGELOG.md for user-facing changes
   - Add inline documentation for complex code

3. **Test Thoroughly**
   - Test on different platforms if possible
   - Test with different VS Code versions
   - Test edge cases and error conditions

### Pull Request Template

```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing completed
- [ ] No breaking changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
```

## Issue Reporting

### Before Creating an Issue

1. **Check Existing Issues**: Search for similar issues
2. **Reproduce the Issue**: Ensure it's reproducible
3. **Provide Details**: Include steps to reproduce, expected vs actual behavior

### Issue Template

```markdown
## Description
Clear description of the issue

## Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g., Windows 10, macOS 12, Ubuntu 20.04]
- VS Code Version: [e.g., 1.85.0]
- Extension Version: [e.g., 1.0.0]

## Additional Information
Any other relevant information
```

## Release Process

### For Maintainers

1. **Update Version**
   - Update version in `package.json`
   - Update `CHANGELOG.md` with release notes

2. **Create Release**
   ```bash
   npm run compile
   npm run package
   ```

3. **Publish**
   ```bash
   npm run publish
   ```

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow
- Follow the project's coding standards

## Questions?

If you have questions about contributing, please:

1. Check the [documentation](README.md)
2. Search existing [issues](https://github.com/your-username/ai-prompt-manager/issues)
3. Start a [discussion](https://github.com/your-username/ai-prompt-manager/discussions)

Thank you for contributing to AI Prompt Manager! 🚀 