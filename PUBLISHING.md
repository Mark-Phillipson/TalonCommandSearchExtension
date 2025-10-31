# 📦 Publishing Guide - Search Talon Commands VS Code Extension

This guide walks you through the complete process of publishing the VS Code extension to the Visual Studio Marketplace.

## 🎯 Prerequisites

1. **Visual Studio Code** installed
2. **Node.js** (v16 or higher)
3. **npm** package manager
4. **Azure DevOps Account** (for Personal Access Token)
5. **Visual Studio Marketplace Publisher Account**

## 🔧 Step 1: Install VSCE (VS Code Extension Manager)

Install the Visual Studio Code Extension Manager globally:

```powershell
npm install -g @vscode/vsce
```

## 🆔 Step 2: Create a Publisher Account

1. Go to [Visual Studio Marketplace Publisher Management](https://marketplace.visualstudio.com/manage)
2. Sign in with your Microsoft account
3. Click **"Create Publisher"**
4. Fill in the required information:
   - **Publisher ID**: `marcusvoicecoder` (already configured in package.json)
   - **Display Name**: Your display name
   - **Email**: Your contact email: MPhillipson0@Gmail.com
   - **Website**: Optional
5. Click **"Create"**

## 🔑 Step 3: Generate a Personal Access Token (PAT)

### 3.1 Access Azure DevOps

1. Go to [Azure DevOps](https://dev.azure.com)
2. Sign in with the same Microsoft account used for the publisher
3. Click on your profile picture in the top right
4. Select **"Personal access tokens"**

### 3.2 Create New Token

1. Click **"+ New Token"**
2. Fill in the token details:
   - **Name**: `VS Code Extension Publishing` (or any descriptive name)
   - **Organization**: Select **"All accessible organizations"**
   - **Expiration**: Choose your preferred duration (90 days recommended for security)
   - **Scopes**: Select **"Custom defined"**

### 3.3 Configure Token Permissions

Under **"Custom defined"**, expand **"Marketplace"** and select:
- ✅ **Acquire** (allows downloading extensions)
- ✅ **Publish** (allows publishing and updating extensions)
- ✅ **Manage** (allows managing extension metadata)

### 3.4 Generate and Save Token

1. Click **"Create"**
2. **⚠️ IMPORTANT**: Copy the token immediately and store it securely
3. The token will look like: `abcdef1234567890abcdef1234567890abcdef12`
4. Store it in a password manager - you won't be able to see it again!

## 📝 Step 4: Login to VSCE

Use your Personal Access Token to login:

```powershell
vsce login marcusvoicecoder
```

When prompted, paste your Personal Access Token.

## 🔢 Step 5: Version Management

### 5.1 Understanding Semantic Versioning

The extension uses semantic versioning (MAJOR.MINOR.PATCH):
- **MAJOR**: Breaking changes (e.g., 1.0.0 → 2.0.0)
- **MINOR**: New features, backward compatible (e.g., 1.0.0 → 1.1.0)
- **PATCH**: Bug fixes, backward compatible (e.g., 1.0.0 → 1.0.1)

### 5.2 Bump Version Methods

#### Method 1: Manual Edit
Edit `package.json` directly:
```json
{
  "version": "0.0.2"  // Changed from 0.0.1
}
```

#### Method 2: Using npm version
```powershell
# Patch version (0.0.1 → 0.0.2)
npm version patch

# Minor version (0.0.1 → 0.1.0)
npm version minor

# Major version (0.0.1 → 1.0.0)
npm version major
```

#### Method 3: Using VSCE
```powershell
# Patch version
vsce publish patch

# Minor version
vsce publish minor

# Major version
vsce publish major

# Specific version
vsce publish 1.2.3
```

## 🚀 Step 6: Pre-Publishing Checklist

### 6.1 Code Quality
- [x] **Compile**: Run `npm run compile` - ensure no TypeScript errors
- [x] **Test**: Verify extension works in development mode (F5)
- [x] **Clean**: Remove any debug console.log statements

### 6.2 Package.json Validation
- [x] **Version**: Ensure version is bumped appropriately
- [x] **Publisher**: Verify `"publisher": "marcusvoicecoder"`
- [x] **Display Name**: Check `"displayName": "Search Talon Commands"`
- [x] **Description**: Ensure description is compelling and accurate
- [x] **Categories**: Verify appropriate categorization
- [x] **Keywords**: Add relevant search keywords
- [x] **Repository**: Add repository URL if desired

### 6.3 Documentation
- [x] **README.md**: Update with latest features and instructions
- [x] **CHANGELOG.md**: Document changes (create if doesn't exist)
- [x] **License**: Ensure license file exists

### 6.4 Assets
- [x] **Icon**: Add extension icon (128x128 PNG recommended)
- [ ] **Screenshots**: Include in README for marketplace display

## 📦 Step 7: Package the Extension

Create a .vsix package file for testing:

```powershell
vsce package
```

This creates a file like `search-talon-commands-0.0.1.vsix`

### Test the Package
Install and test the packaged extension:
```powershell
code --install-extension search-talon-commands-0.0.1.vsix
```

## 🚀 Step 8: Publish the Extension

### 8.1 First Time Publishing
```powershell
vsce publish
```

### 8.2 Publishing with Version Bump
```powershell
# Publish with automatic patch version bump
vsce publish patch

# Publish with automatic minor version bump
vsce publish minor

# Publish with specific version
vsce publish 1.0.0
```

## ✅ Step 9: Verify Publication

1. **Marketplace Check**: Visit [VS Code Marketplace](https://marketplace.visualstudio.com/vscode)
2. **Search**: Search for "Search Talon Commands" or your extension name
3. **Install Test**: Install from marketplace in a clean VS Code instance
4. **Functionality Test**: Verify all features work correctly

## 🔄 Step 10: Post-Publishing Tasks

### 10.1 Update Repository
```powershell
# Commit version changes
git add package.json
git commit -m "Bump version to 0.0.2"
git push origin master

# Create release tag
git tag v0.0.2
git push origin v0.0.2
```

### 10.2 Create GitHub Release (Optional)
1. Go to your GitHub repository
2. Click **"Releases"** → **"Create a new release"**
3. Tag: `v0.0.2`
4. Title: `Release v0.0.2`
5. Description: Copy from CHANGELOG.md
6. Attach the .vsix file
7. Click **"Publish release"**

## 🔧 Common Issues and Solutions

### Issue: "Publisher not found"
**Solution**: Ensure you've created a publisher account and the publisher name in package.json matches exactly.

### Issue: "Personal access token is invalid"
**Solution**: 
- Generate a new PAT with correct permissions
- Ensure the token hasn't expired
- Run `vsce logout` then `vsce login` again

### Issue: "Version already exists"
**Solution**: Bump the version number in package.json before publishing.

### Issue: "Package size too large"
**Solution**: 
- Add `.vscodeignore` file to exclude unnecessary files
- Check for large files in node_modules

## 📋 Example .vscodeignore File

Create `.vscodeignore` to reduce package size:

```gitignore
.vscode/**
.vscode-test/**
src/**
.gitignore
.yarnrc
vsc-extension-quickstart.md
**/tsconfig.json
**/.eslintrc.json
**/*.map
**/*.ts
node_modules/**
out/test/**
.vscodeignore
PUBLISHING.md
```

## 📈 Version History Tracking

Keep track of your versions in a CHANGELOG.md:

```markdown
# Changelog

## [0.0.2] - 2024-10-30
### Added
- New search filtering options
- Repository breakdown statistics

### Fixed
- Performance improvements for large datasets

## [0.0.1] - 2024-10-29
### Added
- Initial release
- Basic command search functionality
```

## 🎯 Quick Publishing Workflow

For regular updates, use this streamlined workflow:

```powershell
# 1. Make your changes and test
npm run compile

# 2. Bump version and publish in one command
vsce publish patch

# 3. Commit and push changes
git add .
$version = (Get-Content package.json | ConvertFrom-Json).version
git commit -m "Release v$version"
git push origin master
```

## 🔒 Security Best Practices

1. **PAT Security**: 
   - Use minimum required permissions
   - Set reasonable expiration dates
   - Store securely in password manager
   - Rotate tokens regularly

2. **Code Security**:
   - Review all code before publishing
   - Don't include sensitive data in the package
   - Use .vscodeignore to exclude development files

3. **Version Control**:
   - Tag releases consistently
   - Maintain clean commit history
   - Use semantic versioning

## 📞 Support and Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [Marketplace Publisher Management](https://marketplace.visualstudio.com/manage)
- [Azure DevOps PAT Documentation](https://docs.microsoft.com/en-us/azure/devops/organizations/accounts/use-personal-access-tokens-to-authenticate)

---

**🎉 Congratulations!** Your Search Talon Commands extension is now published and available to VS Code users worldwide!