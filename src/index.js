const express = require('express');
const router = require('./router');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');

const app = express();
const port = 3003;

app.options('*', cors());
app.use(cors());
app.use(bodyParser.json());
app.use(morgan('tiny'));

router(app);

app.listen(port, () => {
    console.log("app esta escuchando en el puesto " + port);
})
