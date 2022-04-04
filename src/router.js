const apiRoutes = require('../rutas/routes');


function router (app) {
    app.use('/api', apiRoutes);
}

module.exports = router;