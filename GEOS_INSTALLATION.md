# GEOS Installation Guide for Windows

GEOS (Geometry Engine Open Source) is required for Django's PostGIS support. Here's how to install it:

## Install via Conda (Recommended)

Since you're using Anaconda, install GEOS via conda:

```bash
conda install -c conda-forge geos
```

This will install GEOS and its DLL files to your conda environment.

## Verify Installation

After installation, check if GEOS DLL is available:

```bash
python -c "import os; path = r'E:\Anaconda\Library\bin'; files = [f for f in os.listdir(path) if 'geos' in f.lower() and f.endswith('.dll')]; print('GEOS DLL files:', files)"
```

You should see files like:
- `geos_c.dll` (most common)
- `libgeos_c-1.dll`
- `geos.dll`

## Manual Configuration

If the automatic detection doesn't work, you can manually set the path in your `.env` file:

```env
GEOS_LIBRARY_PATH=E:\Anaconda\Library\bin\geos_c.dll
```

Or directly in `settings.py`:

```python
GEOS_LIBRARY_PATH = r'E:\Anaconda\Library\bin\geos_c.dll'
```

## What is GEOS?

GEOS is a C++ library for performing geometric operations. Django's PostGIS backend uses it for:
- Spatial geometry operations
- Point, LineString, Polygon calculations
- Spatial queries and transformations

## After Installation

After installing GEOS, restart your Django server and try migrations again:

```bash
python manage.py migrate
```

The settings.py file has been updated to automatically detect GEOS in common conda installation paths.

