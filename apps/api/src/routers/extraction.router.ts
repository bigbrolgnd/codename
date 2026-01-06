import { router, publicProcedure } from '../trpc';
import { z } from 'zod';
import { VisionService } from '../services/vision.service';
import { ExtractionStatus } from '@codename/api';

const visionService = new VisionService();

// Mock in-memory storage for status
export const extractionJobs = new Map<string, ExtractionStatus>();

export const extractionRouter = router({
  start: publicProcedure
    .input(z.object({ imageUrl: z.string().url() }))
    .mutation(async ({ input }) => {
      const jobId = crypto.randomUUID();
      extractionJobs.set(jobId, { phase: 'uploading', progress: 0 });

      // Simulate async processing
      (async () => {
           await new Promise(r => setTimeout(r, 500));
           extractionJobs.set(jobId, { phase: 'enhancing', progress: 25 });
           
           await new Promise(r => setTimeout(r, 1500));
           extractionJobs.set(jobId, { phase: 'reading', progress: 60 });
           
           await new Promise(r => setTimeout(r, 1500));
           extractionJobs.set(jobId, { phase: 'structuring', progress: 85 });

           await new Promise(r => setTimeout(r, 1000));
           const result = await visionService.processImage(input.imageUrl);
           extractionJobs.set(jobId, { phase: 'complete', result });
      })();

      return { jobId };
    }),

  status: publicProcedure
    .input(z.object({ jobId: z.string() }))
    .query(({ input }) => {
      const status = extractionJobs.get(input.jobId);
      if (!status) throw new Error('Job not found');
      return status;
    }),

  result: publicProcedure
    .input(z.object({ jobId: z.string() }))
    .query(({ input }) => {
      const status = extractionJobs.get(input.jobId);
      if (!status) throw new Error('Job not found');
      if (status.phase !== 'complete') {
        throw new Error('Extraction not complete');
      }
      return status.result;
    }),
});
