const querystring = require('querystring');
const fastify = require('fastify')();

const cors = require('cors');
fastify.use(cors());

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/hits');

const DEFAULT_UNKNOWN = '(unknown)';

const HitSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  type: { type: String, default: 'event', enum: ['event', 'pageview'] },
  acceptLanguage: { type: String, default: DEFAULT_UNKNOWN },
  userAgent: { type: String, default: DEFAULT_UNKNOWN },
  category: { type: String, default: DEFAULT_UNKNOWN },
  referer: { type: String, default: DEFAULT_UNKNOWN },
  action: { type: String, default: DEFAULT_UNKNOWN },
  label: { type: String, default: DEFAULT_UNKNOWN },
  host: { type: String, default: DEFAULT_UNKNOWN },
  page: { type: String, default: DEFAULT_UNKNOWN },
  url: { type: String, default: DEFAULT_UNKNOWN }
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
  console.log(request.body);
  console.log(request.headers);
  const hit = new Hit({
    acceptLanguage: request.headers['accept-language'],
    userAgent: request.headers['user-agent'],
    referer: request.headers['referer'],
    host: request.headers['host'],
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
