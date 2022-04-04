const express = require('express');
const router = express.Router();
const sql = require('mssql');
const bodyParser = require('body-parser');
const dbConfig = require('../dbConfig');
const bcrypt = require('bcrypt');
const JWT = require('jsonwebtoken');
const secret = require('../config');

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

router.post('/login', async (req, res) => {
    const user = req.body;
    let username = user.username;
    let pass = user.pass;
    let tokenId = 0;
    try {
        const conn = await sql.connect(dbConfig);
        const request = new sql.Request(conn)
        request.input("nombre", username);
        const result = await request.query("SELECT * FROM Usuarios WHERE Username = @nombre;");
        const match = await bcrypt.compare(pass, result.recordset[0].Pass);
        if (match) {
            var token = JWT.sign({ id: tokenId }, secret, {
                expiresIn: 86400 //expira en 24 hs
            });
            console.log("El usuario se ha logeado con éxito");
            // res.send({ auth: true, token: token });
            res.send({ auth: true, token: token });
        } else {
            res.send("usuario o password incorrectos");
        }
    } catch (error) {
        res.send("usuario o password incorrectos");
        console.log(error);
    }
})

router.post('/register', async (req, res) => {
    const user = req.body;
    let username = user.username;
    let pass = await bcrypt.hash(user.pass, 10);
    let insertId;
    try {
        const conn = await sql.connect(dbConfig);
        const request = new sql.Request(conn);
        request.input('nombre', username);
        request.input('password', pass);
        const result = await request.query("INSERT INTO Usuarios (Username, Pass) VALUES (@nombre, @password)");
        console.log(result);
        if (result) {
            console.log("Usuario Creado con exíto");
            res.send("El usuario fue creado con éxito");
        }
    } catch (error) {
        console.log(error);
    }
})

//-------------------ENDPOINT DE PRUEBA TOKEN-------------------------------------

router.post('/pruebaendpoint', async (req, res) => {
    // var token = req.headers['authorization'];
    const token = req.headers['x-access-token'];
    if (!token) {
        res.status(401).send({ error: "Es necesario el token de autenticación" })
        return
    } else {
        JWT.verify(token, secret, async (error, user) => {
            if (error) {
                return res.json({ message: "Token invalido" });
            } else {
                const user = req.body;
                let nombre = user.nombre;
                let cargo;
                let nombreDb;
                let salario;
                let consulta = {
                    nombre: "nombre",
                    cargo: "cargo",
                    salario: 0
                }
                try {
                    const conn = await sql.connect(dbConfig);
                    const request = new sql.Request(conn);
                    request.input("username", nombre);
                    const result1 = await request.query("SELECT * FROM Usuarios WHERE Username = @username");
                    nombreDb = await result1.recordset[0].Username;
                    request.input("nombre", nombreDb);
                    const result2 = await request.query("SELECT * FROM Tabla1 WHERE Nombre = @nombre");
                    cargo = await result2.recordset[0].Cargo;
                    request.input("cargo", cargo);
                    const result3 = await request.query("SELECT * FROM Tabla2 WHERE Cargo = @cargo");
                    salario = await result3.recordset[0].Salario;
                    consulta.cargo = cargo;
                    consulta.salario = salario;
                    consulta.nombre = nombreDb;
                    res.send(consulta);
                    console.log(consulta);

                } catch (error) {
                    res.send("error" + error);
                    console.log("error");
                    console.log(error);
                }
            }
        })
    }
})


//-------------------FIN ENDPOINT DE PRUEBA TOKEN-------------------------------------

router.post('/registrofactura', async (req, res) => {
    const token = req.headers['x-access-token'];
    if (!token) {
        res.status(401).send({message: "Es necesario enviar token de autenticación"});
        return;
    } else {
        JWT.verify(token, secret, async (error, user) => {
            if (error) {
                return res.json({message: "Token invalido"})
            } else {
                const registro = req.body;
                let identificador = registro.identificador;
                let estado = "N";
                let mensajeError; //ver como realizar el tratamiento del error
                let cuit = registro.cuit;
                // la variable fecha se insertara desde la query en SQL
                let circuitoAGenerarBody = registro.circuitoAGenerar
                let circuitoAGenerar;
                if (circuitoAGenerarBody==="S") {
                    circuitoAGenerar = 0300;
                } else {
                    circuitoAGenerar = 0400;
                }
                let circuitoDelQueParte = circuitoAGenerar;
                let empresaFC = "CAC01";
                let listaPrecios;
                let periodoFacturacion;
                let texto = registro.texto;
                let nroCliente;
                try {
                    const conn = await sql.connect(dbConfig);
                    const request = new sql.Request(conn);
                    request.input("cuit", cuit);
                    const responseCliente = await fetch("QUERY QUE TRAE DATOS DE CLIENTE CON CUIT EN EL WHERE");
                    const cliente = await responseCliente.json();
                    nroCliente = await cliente.numero; //VER NOMBRE DEL CAMPO EN EL QUE VIENE EL NUMERO DE CLIENTE DE SOFTLAND
                    
                } catch (error) {
                    
                }
            }
        })
    }
})


module.exports = router;