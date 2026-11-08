# Self-Hosting Routing Services (OSRM & OpenRouteService)

Smart Pushkaralu 2027 routes are powered by OpenStreetMap-based routing services. To run independently of free-tier hosted limits (OpenRouteService free tier: ~2,000 directions/day), you can self-host OSRM or OpenRouteService locally or on a cloud virtual machine.

> [!IMPORTANT]
> The public OSRM demo server (`router.project-osrm.org`) is strictly prohibited in production and blocked by our backend configuration. Self-hosting ensures 100% reliability with zero external quota caps.

---

## 1. Option A: Self-Hosted OSRM (Lightweight & Fast)

OSRM (Open Source Routing Machine) is extremely fast (sub-10ms response times) and memory-efficient.

### Step 1: Download Geofabrik OSM Extract (Southern India)
```bash
mkdir -p osrm-data
cd osrm-data
# Download the Southern Zone extract (~450MB) covering AP, Telangana, Karnataka, Tamil Nadu:
wget https://download.geofabrik.de/asia/india/southern-zone-latest.osm.pbf
```

### Step 2: Extract and Build Graph with Docker
```bash
# 1. Extract using car profile
docker run -t -v "${PWD}:/data" ghcr.io/project-osrm/osrm-backend osrm-extract -p /opt/car.lua /data/southern-zone-latest.osm.pbf

# 2. Partition
docker run -t -v "${PWD}:/data" ghcr.io/project-osrm/osrm-backend osrm-partition /data/southern-zone-latest.osrm

# 3. Customize
docker run -t -v "${PWD}:/data" ghcr.io/project-osrm/osrm-backend osrm-customize /data/southern-zone-latest.osrm
```

### Step 3: Run OSRM Server
```bash
docker run -d --name osrm-car -p 5000:5000 -v "${PWD}:/data" ghcr.io/project-osrm/osrm-backend osrm-routed --algorithm mld /data/southern-zone-latest.osrm
```

### Step 4: Configure Backend
In `backend/.env`:
```env
ROUTING_PROVIDER=osrm
OSRM_BASE_URL=http://localhost:5000
```

---

## 2. Option B: Self-Hosted OpenRouteService (ORS)

ORS provides turn-by-turn navigation, elevation, isochrones, and multi-modal routing.

### Step 1: Docker Compose Configuration
Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  ors-app:
    image: openrouteservice/openrouteservice:v8.0.0
    container_name: ors-app
    ports:
      - "8082:8082"
    environment:
      - BUILD_GRAPHS=True
      - "JAVA_OPTS=-Djava.awt.headless=true -server -XX:TargetSurvivorRatio=75 -XX:SurvivorRatio=64 -XX:MaxTenuringThreshold=3 -XX:+UseG1GC -XX:+ScavengeBeforeFullGC -XX:ParallelGCThreads=4 -Xms2g -Xmx4g"
    volumes:
      - ./graphs:/home/ors/graphs
      - ./elevation_cache:/home/ors/elevation_cache
      - ./southern-zone-latest.osm.pbf:/home/ors/files/southern-zone-latest.osm.pbf
```

### Step 2: Start Container
```bash
docker compose up -d
```

### Step 3: Configure Backend
In `backend/.env`:
```env
ROUTING_PROVIDER=ors
ORS_BASE_URL=http://localhost:8082/ors
```

---

## 3. Mandatory Attribution Requirements

Whether hosted locally or via HeiGIT, every user-facing map and route response must show:
- `© OpenStreetMap contributors`
- Provider acknowledgment (`Directions powered by OSRM` or `openrouteservice.org by HeiGIT`)
- Emergency Pushkaralu safety disclaimer:
  > *"Routes and times are estimates. Roads, closures, and police diversions can change suddenly during Pushkaralu. Follow official signs and personnel on the ground."*

