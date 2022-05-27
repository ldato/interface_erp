var Service = require('node-windows').Service;

// Create a new service object
var svc = new Service({
  name:'Node Servicio Prueba Interface',
  description: 'Servicio De Prueba Interface Sauken Softland',
  script: 'index.js'
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install',function(){
  svc.start();
});

svc.install();