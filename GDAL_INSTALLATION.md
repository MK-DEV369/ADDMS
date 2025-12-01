# GDAL Installation Guide for Windows

Django's PostGIS support requires GDAL (Geospatial Data Abstraction Library). Here are installation options for Windows:

## Option 1: Install via Conda (Recommended - Since you have Anaconda)

```bash
# Activate your conda environment or base
conda install -c conda-forge gdal

# Or if you want to install in your virtual environment:
# First activate your venv, then:
conda install -c conda-forge gdal --prefix E:\5th SEM Data\CD252IA-Database Management Systems(DBMS)\ADDMS\backend\venv
```

## Option 2: Install via OSGeo4W (Alternative)

1. Download OSGeo4W from: https://trac.osgeo.org/osgeo4w/
2. Run the installer
3. Select "Express Desktop Install"
4. Choose GDAL package
5. After installation, add to your PATH or set in Django settings:

```python
# In settings.py, add:
import os
if os.name == 'nt':  # Windows
    GDAL_LIBRARY_PATH = r'C:\OSGeo4W64\bin\gdal306.dll'  # Adjust path and version
```

## Option 3: Use Pre-built Wheel (Quick but may have issues)

```bash
# Download appropriate wheel from: https://www.lfd.uci.edu/~gohlke/pythonlibs/#gdal
# For Python 3.12 on Windows 64-bit:
pip install GDAL-3.6.0-cp312-cp312-win_amd64.whl

# Or try:
pip install --find-links https://girder.github.io/large_image_wheels GDAL
```

## Option 4: Temporarily Disable PostGIS (For Testing)

If you just want to test the application without spatial features, you can temporarily use a regular PostgreSQL backend:

In `backend/addms/settings.py`, change:

```python
# From:
'ENGINE': 'django.contrib.gis.db.backends.postgis',

# To:
'ENGINE': 'django.db.backends.postgresql',
```

**Note:** This will disable all spatial features (PostGIS fields, spatial queries, etc.)

## Verify Installation

After installing GDAL, verify it works:

```python
python manage.py shell
>>> from django.contrib.gis import gdal
>>> gdal.gdal_version
```

## Recommended Approach

Since you have Anaconda, use **Option 1** (Conda installation). It's the most reliable on Windows.

After installing GDAL via conda, try running migrations again:

```bash
python manage.py migrate
```

