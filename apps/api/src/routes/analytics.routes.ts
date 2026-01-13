import { Router } from 'express';
import { DatabaseManager } from '@codename/database';
import { AnalyticsService } from '../services/analytics.service';

const router = Router();
const db = new DatabaseManager();
const analyticsService = new AnalyticsService(db);

/**
 * Server-Sent Events endpoint for real-time analytics
 */
router.get('/live', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const sendEvent = (data: any) => {
        res.write(`data: ${JSON.stringify(data)}

`);
    };

    // Send initial update
    analyticsService.getKFactor().then(k => {
        sendEvent({ type: 'welcome', message: 'Connected to live analytics', kFactor: k });
    });

    // Update every 5 minutes as per specs (simulating every 10s for demo/dev)
    const interval = setInterval(async () => {
        try {
            const kFactor = await analyticsService.getKFactor();
            sendEvent({
                type: 'metrics_update',
                kFactor,
                visitorCount: Math.floor(Math.random() * 500) + 100,
                timestamp: new Date().toISOString()
            });
        } catch (e) {
            console.error('[AnalyticsSSE] Error:', e);
        }
    }, 10000);

    req.on('close', () => {
        clearInterval(interval);
        res.end();
    });
});

export default router;
