export const env = {
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    cognitoUserPoolId: process.env.AWS_COGNITO_USER_POOL_ID,
    cognitoClientId: process.env.AWS_COGNITO_CLIENT_ID,
    s3Bucket: process.env.AWS_S3_BUCKET
  },
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_KEY
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY
  },
  assemblyai: {
    apiKey: process.env.ASSEMBLYAI_API_KEY
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379'
  }
};