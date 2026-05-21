import { Router } from 'express';
import {
  autocomplete,
  getPlaceDetails,
  nearbyPlaces,
  geocodeAddress,
  isPlacesConfigured,
} from '../services/osmPlaces.service';

const router = Router();

router.get('/status', (_req, res) => {
  res.json({ enabled: isPlacesConfigured(), provider: 'openstreetmap' });
});

router.get('/autocomplete', async (req, res, next) => {
  try {
    const input = (req.query.input as string) || '';
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;
    const results = await autocomplete(input, lat, lng);
    res.json(results);
  } catch (err) {
    next(err);
  }
});

router.get('/details', async (req, res, next) => {
  try {
    const placeId = req.query.placeId as string;
    if (!placeId) {
      res.status(400).json({ error: 'placeId required' });
      return;
    }
    const details = await getPlaceDetails(placeId);
    if (!details) {
      res.status(404).json({ error: 'Place not found' });
      return;
    }
    res.json(details);
  } catch (err) {
    next(err);
  }
});

router.get('/nearby', async (req, res, next) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radius = req.query.radius ? parseInt(req.query.radius as string, 10) : 2000;
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      res.status(400).json({ error: 'lat and lng required' });
      return;
    }
    const results = await nearbyPlaces(lat, lng, radius);
    res.json(results);
  } catch (err) {
    next(err);
  }
});

router.get('/geocode', async (req, res, next) => {
  try {
    const address = (req.query.address as string) || '';
    if (address.length < 3) {
      res.status(400).json({ error: 'address required' });
      return;
    }
    const coords = await geocodeAddress(address);
    if (!coords) {
      res.status(404).json({ error: 'Address not found' });
      return;
    }
    res.json(coords);
  } catch (err) {
    next(err);
  }
});

export default router;
