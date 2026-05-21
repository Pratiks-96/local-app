# OpenStreetMap (free maps)

LocalConnect uses **OpenStreetMap** — completely **free**, no API key, no Google account, no credit card.

## What works out of the box

| Feature | How |
|--------|-----|
| Interactive map | Leaflet + OSM tiles |
| Search area (register) | Photon API (free) |
| Match pin → society | Your database + coordinates |
| Nearby shops/amenities | Overpass API (free) |
| Map page | `/map` |

## Deploy on your Docker VM

No extra env variables needed. Copy updated code to the VM, then:

```bash
cd ~/localconnect-maharashtra
docker compose up -d --build
docker compose exec backend npx prisma db seed
```

Open: `http://20.192.29.50:8080`

- **Register** → **Pick on map** → search "Wakad" or "Powai"
- **Map** tab after login

## Verify

```bash
curl http://20.192.29.50:8080/api/places/status
# {"enabled":true,"provider":"openstreetmap"}
```

## Attribution

Map tiles and data are © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors. The app shows attribution on the map.

## Limits (fair use)

- **Nominatim**: ~1 request per second (handled in backend)
- **Overpass**: don’t spam; normal app usage is fine
- **Photon**: generous free use for autocomplete

For heavy production traffic, consider hosting your own Nominatim instance later.
