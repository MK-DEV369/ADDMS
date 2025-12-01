# PostGIS Installation Guide for Windows

PostGIS is required for spatial database operations. Here's how to install it on Windows:

## Option 1: Install PostGIS via Stack Builder (Recommended)

If you installed PostgreSQL via the official installer:

1. **Download Stack Builder** (if not already installed):
   - Go to: https://www.postgresql.org/download/windows/
   - Download and run Stack Builder

2. **Install PostGIS via Stack Builder**:
   - Open Stack Builder
   - Select your PostgreSQL installation
   - Expand "Spatial Extensions"
   - Select "PostGIS Bundle for PostgreSQL" (matching your PostgreSQL version)
   - Follow the installation wizard

3. **Enable PostGIS in your database**:
   ```sql
   -- Connect to your database
   psql -U addms_user -d addms
   
   -- Create the extension
   CREATE EXTENSION postgis;
   CREATE EXTENSION postgis_topology;
   ```

## Option 2: Use Docker with PostGIS (Easiest)

If you're using Docker, use the PostGIS-enabled image:

1. **Update docker-compose.yml**:
   ```yaml
   services:
     db:
       image: postgis/postgis:15-3.4  # PostGIS-enabled PostgreSQL
       # ... rest of config
   ```

2. **The extension will be available automatically**

## Option 3: Manual Installation

1. **Download PostGIS for Windows**:
   - Go to: https://postgis.net/windows_downloads/
   - Download the installer matching your PostgreSQL version

2. **Run the installer**:
   - Follow the installation wizard
   - Make sure it installs to the same PostgreSQL installation

3. **Enable in database**:
   ```sql
   CREATE EXTENSION postgis;
   ```

## Option 4: Use TimescaleDB with PostGIS (If using TimescaleDB)

If you're using TimescaleDB (as in docker-compose.yml), use:

```yaml
services:
  db:
    image: timescale/timescaledb:latest-pg15-postgis
    # This includes both TimescaleDB and PostGIS
```

## Verify Installation

After installation, verify PostGIS is available:

```sql
psql -U addms_user -d addms
SELECT PostGIS_Version();
```

Should return something like:
```
POSTGIS="3.4.0" ...
```

## Quick Fix for Current Setup

If you're using the docker-compose.yml provided, update it to use a PostGIS-enabled image:

```yaml
services:
  db:
    image: timescale/timescaledb:latest-pg15-postgis  # Changed from latest-pg15
    # ... rest stays the same
```

Then restart:
```bash
docker-compose down
docker-compose up -d
```

## Troubleshooting

- **"extension postgis is not available"**: PostGIS is not installed in PostgreSQL
- **"Could not open extension control file"**: PostGIS files are missing or in wrong location
- **Version mismatch**: Ensure PostGIS version matches PostgreSQL version

