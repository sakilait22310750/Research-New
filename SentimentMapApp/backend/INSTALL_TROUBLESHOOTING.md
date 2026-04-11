# Installation Troubleshooting Guide

## Common Installation Errors

### Error: Missing C Compiler (Windows)

**Error Message:**
```
ERROR: Unknown compiler(s): [['icl'], ['cl'], ['cc'], ['gcc'], ['clang'], ['clang-cl'], ['pgcc']]
```

**Cause:**
- Python 3.13 is very new and some packages don't have pre-built wheels yet
- pip tries to build packages from source, which requires a C compiler
- Windows doesn't have a C compiler installed by default

**Solutions:**

#### Option 1: Use Flexible Version Requirements (Recommended)
```bash
pip install -r requirements.txt
```

If that still fails, try:
```bash
pip install flask flask-cors pandas numpy transformers torch safetensors
```

This allows pip to find the best compatible versions with pre-built wheels.

#### Option 2: Install Pre-built Packages Only
```bash
pip install --only-binary :all: flask flask-cors pandas numpy transformers torch safetensors
```

#### Option 3: Install Visual Studio Build Tools
1. Download and install [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)
2. Select "Desktop development with C++" workload
3. Run `pip install -r requirements.txt` again

#### Option 4: Use Python 3.11 or 3.12
Python 3.11/3.12 have better package support:
```bash
# Install Python 3.11 or 3.12
# Then create a virtual environment
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### Error: NumPy/Pandas Build Fails

**Solution:** Install NumPy first (it often has better wheel support):
```bash
pip install numpy
pip install -r requirements.txt
```

### Error: Torch Installation Issues

**Solution:** Install PyTorch separately with CPU-only version:
```bash
pip install torch --index-url https://download.pytorch.org/whl/cpu
pip install -r requirements.txt
```

### Error: Package Not Found

**Solution:** Update pip first:
```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

## Minimal Installation (Without AI Models)

If you only need to serve pre-computed data (no real-time inference), you can skip heavy dependencies:

```bash
pip install flask flask-cors pandas numpy
```

This minimal setup will work for serving CSV/JSON data without the BERT model.

## Verify Installation

After installation, verify it works:
```bash
python -c "import flask, pandas, numpy; print('All packages installed successfully!')"
```

