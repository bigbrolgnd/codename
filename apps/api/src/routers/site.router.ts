import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { IngestIntakeSchema, IngestIntakeResponseSchema, InstagramFeedResponseSchema } from '@codename/api';
import { VisionService } from '../services/vision.service';
import { extractionJobs } from './extraction.router';
import { InstagramSyncService } from '../services/admin/instagram.service';
import { DatabaseManager } from '@codename/database';

const visionService = new VisionService();
const dbManager = new DatabaseManager();
const instagramService = new InstagramSyncService(dbManager);

export const siteRouter = router({
  getInstagramFeed: publicProcedure
    .input(z.object({
      tenantId: z.string().regex(/^tenant_[a-z0-9_]+$/),
      limit: z.number().min(1).max(20).default(9),
    }))
    .output(InstagramFeedResponseSchema)
    .query(async ({ input }) => {
      // Validate tenant exists before querying (prevents enumeration)
      const tenantExists = await dbManager.query(
        `SELECT 1 FROM tenants WHERE schema_name = $1 LIMIT 1`,
        [input.tenantId]
      );

      if (!tenantExists.rows.length) {
        return { posts: [] }; // Return empty instead of error (graceful degradation)
      }

      // For MVP, we'll try to sync first if empty, then return
      let posts = await instagramService.getPosts(input.tenantId, input.limit);

      if (posts.length === 0) {
        await instagramService.syncLatestPosts(input.tenantId);
        posts = await instagramService.getPosts(input.tenantId, input.limit);
      }

      return { posts };
    }),

  ingestIntakeData: publicProcedure
    .input(IngestIntakeSchema)
    .output(IngestIntakeResponseSchema)
    .mutation(async ({ input }) => {
      console.log(`[SiteRouter] Ingesting intake data via ${input.method}`);
      
      const jobId = crypto.randomUUID();
      
      // Initialize the extraction job status
      extractionJobs.set(jobId, { phase: 'uploading', progress: 0 });

      // Start the background extraction process
      (async () => {
          try {
              // Simulate phases
              await new Promise(r => setTimeout(r, 500));
              extractionJobs.set(jobId, { phase: 'enhancing', progress: 30 });
              
              await new Promise(r => setTimeout(r, 1000));
              extractionJobs.set(jobId, { phase: 'reading', progress: 60 });
              
              // In production, input.content would be the image URL or text
              const result = await visionService.processImage(input.content);
              
              extractionJobs.set(jobId, { phase: 'complete', result });
          } catch (error) {
              extractionJobs.set(jobId, { 
                  phase: 'error', 
                  error: { 
                      code: 'SERVER_ERROR', 
                      message: 'Failed to process intake data', 
                      canRetry: true 
                  } 
              });
          }
      })();

      return {
        success: true,
        extractionJobId: jobId,
        message: 'Intake data received, processing started.',
      };
    }),
});
