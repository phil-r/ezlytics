const querystring = require('querystring');
const mongoose = require('mongoose');
const fastify = require('fastify')();
const cors = require('cors');

fastify.use(cors());

const DEFAULT_UNKNOWN = '(unknown)';
const MONGO_HOST = process.env.MONGO_HOST || 'localhost';

async function connectMongo() {
  console.log('connect mongo');
  return await mongoose.connect(`mongodb://${MONGO_HOST}/hits`, {
    poolSize: 10,
    autoReconnect: true,
    reconnectTries: Number.MAX_VALUE,
    reconnectInterval: 1000
  });
}

async function initializeConnection() {
  // api starts faster then mongo service 😰
  try {
    await connectMongo();
  } catch (e) {
    setTimeout(initializeConnection, 1000);
  }
}

initializeConnection();
const db = mongoose.connection;
db.on('error', err => console.error('Mongo connection error:', err));
db.on('connected', () => console.log('Mongo connected!'));
db.on('disconnected', () => console.log('Mongo disconnected!'));

const HitSchema = new mongoose.Schema({
  type: { type: String, default: 'event', enum: ['event', 'pageview'] },
  date: { type: Date, default: Date.now },
  url: { type: String, default: DEFAULT_UNKNOWN },
  page: { type: String, default: DEFAULT_UNKNOWN },
  host: { type: String, default: DEFAULT_UNKNOWN },
  referrer: { type: String, default: DEFAULT_UNKNOWN },
  // event
  category: { type: String, default: DEFAULT_UNKNOWN },
  action: { type: String, default: DEFAULT_UNKNOWN },
  label: { type: String, default: DEFAULT_UNKNOWN },
  // headers
  acceptLanguageHeader: { type: String, default: DEFAULT_UNKNOWN },
  userAgentHeader: { type: String, default: DEFAULT_UNKNOWN },
  referrerHeader: { type: String, default: DEFAULT_UNKNOWN },
  hostHeader: { type: String, default: DEFAULT_UNKNOWN }
});

const Hit = mongoose.model('Hit', HitSchema);

fastify.addContentTypeParser(
  'text/plain',
  { parseAs: 'string' },
  async function(req, body) {
    return querystring.parse(body);
  }
);

fastify.post('/', async (request, reply) => {
  reply.code(204).send();
  console.log('body:', request.body);
  console.log('headers:', request.headers);
  const hit = new Hit({
    acceptLanguageHeader: request.headers['accept-language'],
    userAgentHeader: request.headers['user-agent'],
    referrerHeader: request.headers['referer'],
    hostHeader: request.headers['host'],
    ...request.body
  });
  const result = await hit.save();
  console.log('hit:', hit.toJSON());
});

fastify.listen(8080, '0.0.0.0', function(err) {
  if (err) throw err;
  const { address, port } = fastify.server.address();
  console.log(`API istening on http://${address}:${port}`);
});
