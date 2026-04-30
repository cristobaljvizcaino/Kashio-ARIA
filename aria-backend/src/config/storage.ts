import { Bucket, Storage } from '@google-cloud/storage';
import { env } from './env';

const storage = new Storage();

/** Bucket único de biblioteca/artefactos (`GCS_BUCKET_NAME`, default `karia-library-files`). */
export const bucket: Bucket = storage.bucket(env.storage.bucketName);

export const bucketName: string = env.storage.bucketName;
