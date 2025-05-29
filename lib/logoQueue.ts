interface LogoJob {
  id: string;
  companySlug: string;
  logoUrl: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  processedUrl?: string;
  error?: string;
}

class LogoQueue {
  private jobs: Map<string, LogoJob> = new Map();
  private processing = false;

  async addJob(companySlug: string, logoUrl: string): Promise<string> {
    const jobId = `${companySlug}-${Date.now()}`;
    
    const job: LogoJob = {
      id: jobId,
      companySlug,
      logoUrl,
      status: 'pending',
      createdAt: new Date()
    };

    this.jobs.set(jobId, job);
    
    // Start processing if not already running
    if (!this.processing) {
      this.processQueue();
    }

    return jobId;
  }

  async getJobStatus(jobId: string): Promise<LogoJob | null> {
    return this.jobs.get(jobId) || null;
  }

  private async processQueue(): Promise<void> {
    if (this.processing) return;
    
    this.processing = true;

    try {
      while (true) {
        const pendingJob = Array.from(this.jobs.values()).find(job => job.status === 'pending');
        
        if (!pendingJob) {
          break; // No more pending jobs
        }

        await this.processJob(pendingJob);
      }
    } finally {
      this.processing = false;
    }
  }

  private async processJob(job: LogoJob): Promise<void> {
    try {
      // Update job status
      job.status = 'processing';
      
      // Import processLogo dynamically to avoid blocking main thread
      const { processLogo } = await import('./processLogo');
      
      // Process the logo
      const processedUrl = await processLogo(job.companySlug, job.logoUrl);
      
      // Update job with success
      job.status = 'completed';
      job.completedAt = new Date();
      job.processedUrl = processedUrl || undefined;
      
    } catch (error) {
      // Update job with failure
      job.status = 'failed';
      job.completedAt = new Date();
      job.error = error instanceof Error ? error.message : 'Unknown error';
      
      console.error(`Logo processing failed for job ${job.id}:`, error);
    }
  }

  // Clean up old jobs (called periodically)
  cleanupOldJobs(maxAgeHours: number = 24): void {
    const cutoff = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);
    
    for (const [jobId, job] of Array.from(this.jobs.entries())) {
      if (job.createdAt < cutoff && ['completed', 'failed'].includes(job.status)) {
        this.jobs.delete(jobId);
      }
    }
  }

  // Get queue stats
  getStats(): { pending: number; processing: number; completed: number; failed: number } {
    const jobs = Array.from(this.jobs.values());
    return {
      pending: jobs.filter(j => j.status === 'pending').length,
      processing: jobs.filter(j => j.status === 'processing').length,
      completed: jobs.filter(j => j.status === 'completed').length,
      failed: jobs.filter(j => j.status === 'failed').length,
    };
  }
}

// Create singleton instance
export const logoQueue = new LogoQueue();

// Clean up old jobs every hour
setInterval(() => {
  logoQueue.cleanupOldJobs();
}, 60 * 60 * 1000);