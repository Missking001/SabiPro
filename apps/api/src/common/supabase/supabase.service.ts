import { Injectable, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly logger = new Logger(SupabaseService.name);
  private client: SupabaseClient | null = null;
  private ensuredBuckets = new Set<string>();

  private getClient(): SupabaseClient {
    if (!this.client) {
      const url = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!url || !key) {
        throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set');
      }
      this.client = createClient(url, key, {
        auth: { persistSession: false },
      });
    }
    return this.client;
  }

  private async ensureBucket(bucket: string): Promise<void> {
    if (this.ensuredBuckets.has(bucket)) return;

    const client = this.getClient();

    const { data: buckets } = await client.storage.listBuckets();
    const exists = buckets?.some((b) => b.id === bucket);

    if (!exists) {
      this.logger.log(`Bucket "${bucket}" not found, creating...`);
      const { error } = await client.storage.createBucket(bucket, {
        public: true,
      });
      if (error) {
        this.logger.error(`Failed to create bucket "${bucket}": ${error.message}`);
        throw new Error(`Storage bucket "${bucket}" could not be created. Please create it in the Supabase dashboard.`);
      }
      this.logger.log(`Bucket "${bucket}" created successfully`);
    }

    this.ensuredBuckets.add(bucket);
  }

  async upload(
    bucket: string,
    path: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string> {
    await this.ensureBucket(bucket);

    const client = this.getClient();

    const { error } = await client.storage.from(bucket).upload(path, buffer, {
      contentType,
      upsert: true,
    });

    if (error) {
      this.logger.error(`Supabase upload failed: ${error.message}`);
      throw new Error(`File upload failed: ${error.message}`);
    }

    const { data: publicUrlData } = client.storage.from(bucket).getPublicUrl(path);
    return publicUrlData.publicUrl;
  }

  async delete(bucket: string, path: string): Promise<void> {
    const client = this.getClient();

    const { error } = await client.storage.from(bucket).remove([path]);
    if (error) {
      this.logger.error(`Supabase delete failed: ${error.message}`);
    }
  }
}
