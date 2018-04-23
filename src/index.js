const querystring = require('querystring');
const mongoose = require('mongoose');
const fastify = require('fastify')();
const cors = require('cors');

fastify.use(cors());

const DEFAULT_UNKNOWN = '(unknown)';
const MONGO_HOST = process.env.MONGO_HOST || 'localhost';

mongoose.connect(`mongodb://${MONGO_HOST}/hits`);

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
  hostHeader: { type: String, default: DEFAULT_UNKNOWN },
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
  console.log(hit.toJSON());
});

fastify.listen(8080, '0.0.0.0', function(err) {
  if (err) throw err;
  const { address, port } = fastify.server.address();
  console.log(`API istening on http://${address}:${port}`);
});
