const cluster  = require('cluster');
const numCPUs  = require('os').cpus().length;

///// Cluster Code /////

if (cluster.isMaster) {
  console.log(`Master here (pid: ${process.pid}):`);
  console.log(`Based on your current hardware ${numCPUs} workers will be started...`);
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster
    .on('SIGTERM', () => cluster.off('exit'))
    .on('exit', (deadWorker) => {
      console.warn(`${deadWorker.process.pid} died, forking new process...`);
      cluster.fork();
    });
  return;
}

///// Worker Code /////

const path     = require('path');
const fs       = require('fs');
const http     = require('http');
const zlib     = require('zlib');
const mime     = require('mime');
const Throttle = require('stream-throttle').Throttle;

const rateLimit = 3 * 1024 * 1024; // bps == 3 MB/s
const baseUrl   = './www';

http.createServer((request, response) => {
  const url = path.join(baseUrl, path.normalize(decodeURIComponent(request.url)));

  console.log(`#${cluster.worker.id}: HTTP/${request.httpVersion} ${request.method} ${request.url}`);

  fs.stat(url, (error, stat) => {
    if (error || stat.isDirectory()) {
      response.writeHead(404);
      return response.end('Not found');
    }

    const acceptEncoding = (request.headers['accept-encoding'] || '').split(',').map(s => s.trim());
    const contentType    = mime.lookup(url);
    const isBinary       = ['application/javascript', 'text/'].every(s => !contentType.startsWith(s));

    response.setHeader('Content-Type', contentType);

    let compressionStream;

    if (!isBinary) {
      ['deflate', 'gzip'].some((encoding) => {
        if (acceptEncoding.includes(encoding)) {
          response.setHeader('Content-Encoding', encoding);
          const method = 'create' + encoding.replace(/^./, c => c.toUpperCase());
          compressionStream = zlib[method]({
            flush: zlib.Z_PARTIAL_FLUSH,
            level: zlib.Z_BEST_COMPRESSION,
          });
          return true;
        }
      });
    }

    let data;
    let partial;

    if (request.headers.range) {
      const {range} = request.headers;
      const [partialStart, partialEnd] = range.replace(/bytes=/, '').split('-');
      const start = parseInt(partialStart, 10);
      const end = partialEnd ? parseInt(partialEnd, 10) : stat.size - 1;
      const chunksize = (end - start) + 1;

      partial = {
        start,
        end,
        chunksize,
      };

      data = fs.createReadStream(url, partial);
    } else {
      data = fs.createReadStream(url);
    }

    if (!compressionStream) {
      response.setHeader('Content-Length', partial ? partial.chunksize : stat.size);
    } else {
      data = data.pipe(compressionStream);
    }

    if (rateLimit > 0) {
      data = data.pipe(new Throttle({rate: rateLimit}));
    }

    if (!partial) {
      response.writeHead(200);
    } else {
      response.writeHead(206, {'Content-Range': 'bytes ' + partial.start + '-' + partial.end + '/' + stat.size, 'Accept-Ranges': 'bytes'});
    }
    data.pipe(response);
  });
}).listen(8000, () => console.log(`${cluster.worker.id} is ready (pid: ${process.pid})`));
