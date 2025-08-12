const { Firestore } = require('@google-cloud/firestore');
const { Storage } = require('@google-cloud/storage');
const { PubSub } = require('@google-cloud/pubsub');

// Initialize GCP clients using Application Default Credentials
// This will automatically use the Cloud Run service account when deployed
const firestore = new Firestore({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
  // No keyFilename needed - uses ADC automatically
});

const storage = new Storage({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
  // No keyFilename needed - uses ADC automatically
});

const pubsub = new PubSub({
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
  // No keyFilename needed - uses ADC automatically
});

// Get bucket and topic references
const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);
const topic = pubsub.topic(process.env.PUBSUB_TOPIC_NAME);

module.exports = {
  firestore,
  storage,
  pubsub,
  bucket,
  topic,
};
