// __Dependencies__
var url = require('url');
var deco = require('deco');

// __Private Module Members__

// Figure out the basePath for Swagger API definition
function getBase (request, extra) {
  var parts = request.originalUrl.split('/');
  // Remove extra path parts.
  parts.splice(-extra, extra);
  return request.protocol + '://' + request.headers.host + parts.join('/');
};

// A method for generating a Swagger resource listing
function generateResourceListing (options) {
  var plurals = options.controllers.map(function (controller) {
    return controller.get('plural');
  });
  var listing = {
    apiVersion: options.version,
    swaggerVersion: '1.1',
    basePath: options.basePath,
    apis: plurals.map(function (plural) {
      return { path: '/api-docs/' + plural, description: 'Operations about ' + plural + '.' };
    })
  };

  return listing;
}

// __Module Definition__
var decorator = module.exports = function (options) {
  var release = this;

  release.enable('trust proxy');

  // Activate Swagger resource listing.
  release.get('/api-docs', function (request, response, next) {
    response.set('X-Powered-By', 'Baucis');
    response.json(generateResourceListing({
      version: options.release,
      controllers: options.controllers,
      basePath: getBase(request, 1)
    }));
  });

  // Add routes for the controller's Swagger API definitions.
  options.controllers.forEach(function (controller) {
    var route = url.resolve('/', controller.get('plural'));

    release.get('/api-docs' + route, function (request, response, next) {
      response.set('X-Powered-By', 'Baucis');
      response.json(deco.merge(controller.swagger, {
        apiVersion: options.release,
        swaggerVersion: '1.1',
        basePath: getBase(request, 2),
        resourcePath: route
      }));
    });
  });

  return release;
};
