import { S3Client, PutObjectCommand, PutObjectCommandInput, HeadObjectCommand } from "@aws-sdk/client-s3";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !R2_PUBLIC_URL) {
  throw new Error("Cloudflare R2 environment variables are not fully set.");
}

const S3 = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export async function uploadToR2(
  key: string, 
  body: Buffer, 
  contentType: string,
  metadata?: Record<string, string>
): Promise<string> {
  const params: PutObjectCommandInput = {
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
    ACL: 'public-read', // Optional: if you want files to be publicly readable by default
  };

  if (metadata) {
    params.Metadata = metadata; // Add metadata if provided
  }

  const command = new PutObjectCommand(params);

  await S3.send(command);
  return `${R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`; // Ensure no double slashes
}

export async function getObjectMetadata(key: string): Promise<Record<string, string> | undefined> {
  try {
    const command = new HeadObjectCommand({ // Use HeadObjectCommand to get metadata without fetching the body
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });
    const response = await S3.send(command);
    return response.Metadata;
  } catch (error: any) {
    if (error.name === 'NotFound' || error.name === 'NoSuchKey') { // R2 might return NotFound for non-existent keys with HeadObject
      return undefined;
    }
    console.error(`Error fetching metadata for ${key} from R2:`, error);
    throw error; // Re-throw other errors
  }
}

export { S3, R2_BUCKET_NAME, R2_PUBLIC_URL }; 