import { Router } from 'express';
import { getLocationTree, searchLocations } from '../services/location.service';

const router = Router();

/**
 * @openapi
 * /api/locations:
 *   get:
 *     tags: [Locations]
 *     summary: Get Maharashtra location hierarchy
 */
router.get('/', async (_req, res, next) => {
  try {
    const tree = await getLocationTree();
    res.json(tree);
  } catch (err) {
    next(err);
  }
});

router.get('/search', async (req, res, next) => {
  try {
    const q = (req.query.q as string) || '';
    if (q.length < 2) {
      res.json([]);
      return;
    }
    const results = await searchLocations(q);
    res.json(results);
  } catch (err) {
    next(err);
  }
});

export default router;
