# Git Hooks

This repository includes git hooks to enforce best practices and prevent direct pushes to the main branch.

## Pre-Push Hook

The pre-push hook prevents developers from pushing directly to the `main` branch, encouraging the use of feature branches and pull requests.

### Setup

The hook is automatically installed in `.git/hooks/pre-push`. If you need to reinstall it:

```bash
# Copy the hook to your local git hooks directory
cp .githooks/pre-push .git/hooks/pre-push
chmod +x .git/hooks/pre-push
```

### How It Works

- When you try to push to `main`, the hook will block the push
- You'll see a helpful error message with instructions
- The hook allows pushing to any other branch (feature branches, etc.)

### Workflow

1. **Create a feature branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes and commit:**
   ```bash
   git add .
   git commit -m "Your commit message"
   ```

3. **Push your feature branch:**
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create a Pull Request on GitHub** to merge into main

### Emergency Override

If you absolutely need to push to main (emergency situations only), you can bypass the hook:

```bash
git push origin main --no-verify
```

⚠️ **Warning:** Use `--no-verify` sparingly and only in emergencies. The hook exists to protect the main branch.

## Sharing Hooks with Team

To share hooks with your team:

1. Create a `.githooks` directory in the repository root
2. Store hook files there (they're tracked by git)
3. Team members can install them by running:
   ```bash
   cp .githooks/pre-push .git/hooks/pre-push
   chmod +x .git/hooks/pre-push
   ```

Or use a tool like [husky](https://github.com/typicode/husky) for automatic hook management in Node.js projects.
