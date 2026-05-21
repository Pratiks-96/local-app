import { Router } from 'express';
import { authenticate, optionalAuth } from '../middleware/auth';
import { getMapContent, findNearestSociety } from '../services/map.service';

const router = Router();

/**
 * @openapi
 * /api/map/content:
 *   get:
 *     tags: [Map]
 *     summary: Map markers for posts, marketplace, societies, and Google places
 */
router.get('/content', optionalAuth, async (req, res, next) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;
    const radiusKm = req.query.radiusKm ? parseFloat(req.query.radiusKm as string) : undefined;
    const includeGooglePlaces = req.query.places !== 'false';

    const data = await getMapContent({
      userId: req.user?.userId,
      lat,
      lng,
      radiusKm,
      includeGooglePlaces,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

router.post('/match-location', async (req, res, next) => {
  try {
    const { lat, lng } = req.body as { lat?: number; lng?: number };
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      res.status(400).json({ error: 'lat and lng are required' });
      return;
    }
    const match = await findNearestSociety(lat, lng);
    if (!match) {
      res.status(404).json({ error: 'No nearby society found. Try the dropdown or a different area.' });
      return;
    }
    res.json(match);
  } catch (err) {
    next(err);
  }
});

router.get('/my-area', authenticate, async (req, res, next) => {
  try {
    const data = await getMapContent({ userId: req.user!.userId });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
