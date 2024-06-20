import Request from '../../lib/request.js';

export default (request) => {
  const req = new Request({
    query: {},
    body: {},
    headers: {},
    method: 'GET',
    ...request,
  });

  req.is = function (header) {
    return this.headers['content-type'] === header;
  };

  return req;
};
