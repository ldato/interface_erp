const express = require("express");
const router = express.Router();
const sql = require("mssql");
const bodyParser = require("body-parser");
const dbConfig = require("../dbConfig");
const bcrypt = require("bcrypt");
const JWT = require("jsonwebtoken");
const secret = require("../config");
const dbConfig2 = require("../dbConfig2");

router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

router.post("/login", async (req, res) => {
    const user = req.body;
    let username = user.username;
    let pass = user.pass;
    let tokenId = 0;
    try {
        const conn = await sql.connect(dbConfig);
        const request = new sql.Request(conn);
        request.input("nombre", username);
        const result = await request.query(
            "SELECT * FROM Usuarios WHERE Username = @nombre;"
        );
        const match = await bcrypt.compare(pass, result.recordset[0].Pass);
        if (match) {
            var token = JWT.sign({ id: tokenId }, secret, {
                expiresIn: 86400, //expira en 24 hs
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
});

router.post("/register", async (req, res) => {
    const user = req.body;
    let username = user.username;
    let pass = await bcrypt.hash(user.pass, 10);
    let insertId;
    try {
        const conn = await sql.connect(dbConfig);
        const request = new sql.Request(conn);
        request.input("nombre", username);
        request.input("password", pass);
        const result = await request.query(
            "INSERT INTO Usuarios (Username, Pass) VALUES (@nombre, @password)"
        );
        console.log(result);
        if (result) {
            console.log("Usuario Creado con exíto");
            res.send("El usuario fue creado con éxito");
        }
    } catch (error) {
        console.log(error);
    }
});

//-------------------ENDPOINT DE PRUEBA TOKEN-------------------------------------

router.post("/consultaestado", async (req, res) => {
    const identificadores = req.body.identificadores;
    let arrayResponse = [];
   
    try {
        const conn = await sql.connect(dbConfig);
        const request = new sql.Request(conn);
        for (let i = 0; i < identificadores.length; i++) {
             request.input("identificador" + i, identificadores[i]);
      
            let estadoId = await  request.query(`SELECT
            CASE SAR_FCRMVH_STATUS WHEN 'E' THEN 'ERROR' WHEN 'S' THEN 'PROCESADO' ELSE 'NO PROCESADO' END [ESTADO]
            , SAR_FCRMVH_ERRMSG [MENSAJE]
            , ISNULL(SAR_FCRMVH_MODFVT,SAR_FCRMVH_MODFOR) [MODULO]
            , ISNULL(SAR_FCRMVH_CODFVT,SAR_FCRMVH_CODFOR) [CODIGO]
            , ISNULL(SAR_FCRMVH_NROFVT,SAR_FCRMVH_NROFOR) [NUMERO]
     FROM SAR_FCRMVH
     WHERE SAR_FCRMVH_IDENTI = @identificador`+`${i}`)
            console.log('estadoId');
            console.log(estadoId.rowsAffected[0]);
            const objItems = {
             
                idOperacion: identificadores[i],
                estado: estadoId.rowsAffected[0] === 0 ? "Inexistente" : estadoId.recordset[0].ESTADO,
                mensaje: estadoId.rowsAffected[0] === 0 ? "Inexistente" : estadoId.recordset[0].MENSAJE,
                modulo: estadoId.rowsAffected[0] === 0 ? "Inexistente" : estadoId.recordset[0].MODULO,
                codigo: estadoId.rowsAffected[0] === 0 ? "Inexistente" : estadoId.recordset[0].CODIGO,
                numero: estadoId.rowsAffected[0] === 0 ? "Inexistente" : estadoId.recordset[0].NUMERO
            }
            arrayResponse.push(objItems);
            // console.log("consulta: " + i);
            // console.log(objItems);
            
        }
        console.log(arrayResponse);
        return res.status(200).json(arrayResponse);
    } catch (error) {
        console.log(error);
        return res.json({
            tipo: "error",
            message: "Ocurrio un error"
        })
    }
   
     
})


router.post("/pruebaendpoint", async (req, res) => {
    // var token = req.headers['authorization'];
    const token = req.headers["x-access-token"];
    if (!token) {
        res.status(401).send({
            error: "Es necesario el token de autenticación",
        });
        return;
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
                    salario: 0,
                };
                try {
                    const conn = await sql.connect(dbConfig);
                    const request = new sql.Request(conn);
                    request.input("username", nombre);
                    const result1 = await request.query(
                        "SELECT * FROM Usuarios WHERE Username = @username"
                    );
                    nombreDb = await result1.recordset[0].Username;
                    request.input("nombre", nombreDb);
                    const result2 = await request.query(
                        "SELECT * FROM Tabla1 WHERE Nombre = @nombre"
                    );
                    cargo = await result2.recordset[0].Cargo;
                    request.input("cargo", cargo);
                    const result3 = await request.query(
                        "SELECT * FROM Tabla2 WHERE Cargo = @cargo"
                    );
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
        });
    }
});

//-------------------FIN ENDPOINT DE PRUEBA TOKEN-------------------------------------

router.post("/registrofactura222", async (req, res) => {
    
    let objEscribir = {
        nroCliente: "",
        identificador: "",
        tipoProducto: "VISAC",
        empresaFC: "CAC01",
        cuit: "",
        listaPrecio: "",
        estado: "X", //Valor distinto de N - Se actualiza luego a N
        circuitoDelQueParte: "",
        observaciones: "",
        email: "",
        items: [],
    };

    const registro = req.body;
    objEscribir.identificador = registro.identificador;
    objEscribir.cuit = registro.cuit;
    objEscribir.observaciones = registro.observaciones;
    objEscribir.email = registro.email;
    let items = registro.items;
    // let circuitoParte = "";
    console.log(items);
    let itemsFaltantes = [];
    let itemsEnCero = [];
    let itemsMas60 = [];

    // let estado = "N";
    //let mensajeError; //ver como realizar el tratamiento del error

    const conn = await sql.connect(dbConfig);
    const request = new sql.Request(conn);
    request.input("cuit", objEscribir.cuit);
    const responseCliente = await request.query(`Select * from 
            vtmclh where vtmclh_nrodoc = @cuit;`);

    const cliente = await responseCliente;
    console.log("cliente:");
    console.log(responseCliente);
    //console.log("Circuito: " + cliente.recordset[0].USR_VTMCLH_CIRFAC);
    console.log("Cliente Vacio");
    console.log(responseCliente.recordset.length);
    console.log("responseCliente");
    console.log(responseCliente.recordset[0]);
    if (responseCliente.recordset[0]===undefined) {
        // res.send("No existe un cliente asociado con el cuit: " + registro.cuit);
        return res.status(400).json({
            "tipo": "error",
            "mensaje": "No existe un cliente asociado con el cuit: " + registro.cuit,
            "itemsInsertados": 0
        })
    } else {
        objEscribir.nroCliente = cliente.recordset[0].VTMCLH_NROCTA;
        objEscribir.listaPrecio = cliente.recordset[0].USR_VTMCLH_LISVIS;
        // objEscribir.circuitoDelQueParte = "0400";
        objEscribir.items = items;

        if (cliente.recordset[0].USR_VTMCLH_CIRFAC === "1") {
            objEscribir.circuitoDelQueParte = "0300";
        } else if (cliente.recordset[0].USR_VTMCLH_CIRFAC === "2") {
            objEscribir.circuitoDelQueParte = "0400";
        } else {
            return res.status(500).json({
                "tipo": "error",
                "mensaje": "Ocurrio un error con el circuito de facturación",
                "itemsInsertados": 0
            })
        }

        if (objEscribir.listaPrecio === "" || objEscribir.listaPrecio === null) {
            return res.status(400).json({
                "tipo": "error",
                "mensaje": "El cliente no tiene una lista de precios asociada",
                "itemsInsertados": 0
            })
        }
        if (objEscribir.items.length === 0) {
            return res.status(400).json({
                "tipo": "error",
                "mensaje": "Debe cargar al menos un item",
                "itemsInsertados": 0
            })
        }

        request.input("listaPrecio", objEscribir.listaPrecio);
        console.log("for de articulos");
        for (let i = 0; i < objEscribir.items.length; i++) {
            try {
                objEscribir.items[i].nroItem = i + 1;
                //console.log(i);
                request.input("artCode" + i, objEscribir.items[i].artCode);
                let responseArt = await request.query(
                    `SELECT * FROM USR_STTPRI
            WHERE USR_STTPRI_TIPPRO = 'VISAC'
            AND USR_STTPRI_CODLIS = ` +
                        objEscribir.listaPrecio +
                        `
            AND USR_STTPRI_ARTCOD = ` +
                        objEscribir.items[i].artCode +
                        ";"
                );
                
                let articulo = await responseArt;
                console.log("Lenght del Articulo");
                console.log(articulo.recordset.length);
                if (articulo.recordset.length < 1) {
                    itemsFaltantes.push(objEscribir.items[i].artCode);
                    // console.log(articulo);
                }
                if (objEscribir.items[i].cantidad === 0) {
                    itemsEnCero.push(objEscribir.items[i].artCode);
                }
                if (objEscribir.items[i].nrocertificado.length>59) {
                    itemsMas60.push(objEscribir.items[i].artCode);
                }
            } catch (error) {
                console.log(error);
            }
        }

        //objEscribir.circuitoDelQueParte = circuitoParte;

        //request.input("listaP", objEscribir.listaPrecio);
        console.log("objEscribir");
        console.log(objEscribir);
        // res.send(objEscribir);
        console.log("Articulos Faltantes LENGHT");
        console.log(itemsFaltantes.length);
        if (itemsFaltantes.length === 0 && itemsEnCero.length === 0 && itemsMas60.length === 0) {
            //res.send(objEscribir);
            request.input("identificador", objEscribir.identificador);
            request.input("estado", objEscribir.estado);
            request.input("nroCuenta", objEscribir.nroCliente);
            request.input("circuitoOrigen", objEscribir.circuitoDelQueParte);
            request.input("circuitoParte", objEscribir.circuitoDelQueParte);
            request.input("listaPrecioInsert", objEscribir.listaPrecio);
            request.input("periodoFact", 12345);
            request.input("observaciones", objEscribir.observaciones);
            request.input("email", objEscribir.email);
            request.input("EmpresaFC", "CAC01");

            try {
                let insertCabecera = await request.query(`INSERT INTO SAR_FCRMVH     
                (SAR_FCRMVH_IDENTI, SAR_FCRMVH_STATUS,  SAR_FCRMVH_ERRMSG,
                SAR_FCRMVH_NROCTA, SAR_FCRMVH_FCHMOV,  SAR_FCRMVH_CIRCOM,  
                SAR_FCRMVH_CIRAPL,  SAR_FCRMVH_CODEMP,
                SAR_FCRMVH_CODLIS,  USR_FCRMVH_PERFAC,  USR_FCRMVH_TEXTOS, USR_FCRMVH_DIREML)
                VALUES (@identificador, @estado, NULL, @nroCuenta, GETDATE(), @circuitoOrigen,
                @circuitoParte, @EmpresaFC, @listaPrecioInsert, @periodoFact, @observaciones, @email);`);
                console.log("Resultado insert Cabecera");
                console.log(insertCabecera);
                //res.send(insertCabecera);
                let consultaCabecera = await request.query(`SELECT * FROM SAR_FCRMVH 
                WHERE SAR_FCRMVH_IDENTI = @identificador;`)
                console.log("lenght del insertCabecera");
                console.log(consultaCabecera.recordset.length);
                // res.send(consultaCabecera);

                if (consultaCabecera.recordset.length === 0) {
                    return res.send("Ocurrio un problema al insertar la cabecera");
                } else {            
                    for (let i = 0; i < objEscribir.items.length; i++) {                    
                        
                        //SE MANDO MAIL A WILLIAM CON LOS ITEMS POR LA TABLA
                        request.input("identificador" + i, objEscribir.identificador);
                        request.input("nroItem" + i, objEscribir.items[i].nroItem);
                        request.input("tipPro" + i, objEscribir.tipoProducto);
                        request.input("producto" + i, (objEscribir.items[i].artCode).toString());
                        request.input("cantidad" + i, objEscribir.items[i].cantidad);
                        request.input("nroCert" + i, objEscribir.items[i].nrocertificado);
                        request.input("observaciones" + i, objEscribir.observaciones);
                       
                        try {
                            let insertItems = await request.query(`INSERT INTO SAR_FCRMVI
                            (SAR_FCRMVI_IDENTI, SAR_FCRMVI_NROITM,  SAR_FCRMVI_TIPPRO,  SAR_FCRMVI_ARTCOD,
                            SAR_FCRMVI_CANTID,  SAR_FCRMVI_PRECIO,  SAR_FCRMVI_NROCER,  SAR_FCRMVI_TEXTOS)
                            VALUES (@identificador`+`${i}, @nroItem`+`${i}, @tipPro`+`${i}, 
                            @producto`+`${i}, @cantidad`+`${i}, NULL,  @nroCert`+`${i}, @observaciones`+`${i});`);
                    
                        
                        } catch (error) {
                            console.log(error);
                        }
                                              
                    }
                    let consultaItems = await request.query(`SELECT * FROM SAR_FCRMVI 
                            WHERE SAR_FCRMVI_IDENTI = @identificador;`);
                            console.log("Respuesta Items:");
                            // console.log(consultaItems.recordset.length);
                            console.log(consultaItems.recordset);
                            console.log("Items del front");
                            console.log(objEscribir.items.length);
                    if (objEscribir.items.length === consultaItems.recordset.length) {
                        let updateEstado = await request.query(`UPDATE SAR_FCRMVH SET 
                        SAR_FCRMVH_STATUS = 'N' WHERE SAR_FCRMVH_IDENTI = @identificador;`);
                        let executeProcedure = await request.query(`EXEC DAR_KT000278InsCwJmSchedules 'USR_FC'`);
                        return res.status(200).json({
                            tipo: "ok",
                            mensaje: "Insercion Satisfactoria",
                            itemsInsertados: objEscribir.items.length
                        });
                    } else {
                        return res.status(500).json({
                            tipo: "error",
                            message: "Ocurrio un error al insertar los items",
                            itemsInsertados: 0
                        });
                    }  

                }
            } catch (error) {
                // console.log("error del insert Cabecera");
                // console.log(error);
                return res.status(500).json({
                    tipo: "error",
                    message: "Hubo un error al insertar la cabecera: " + error,
                    itemsInsertados: 0
                });
            }
        } else if (itemsFaltantes.length !== 0 && itemsEnCero.length !== 0) {
            return res.status(500).json({
                tipo: "error",
                message: "Items faltantes: " + itemsFaltantes + ", Items En Cero: " + itemsEnCero,
                itemsInsertados: 0
            })
          
        } else if (itemsFaltantes.length !== 0 && itemsEnCero.length === 0) {
            return res.status(500).json({
                tipo: "error",
                message: "Items faltantes: " + itemsFaltantes,
                itemsInsertados: 0
            })
            // res.send("Items faltantes: " + itemsFaltantes);
        } else if (itemsFaltantes.length === 0 && itemsEnCero.length !== 0) {
            return res.status(500).json({
                tipo: "error",
                message: "Items En Cero: " + itemsEnCero,
                itemsInsertados: 0
            })
            // res.send(" Items en cero: " + itemsEnCero);
        } else if (itemsMas60.length !== 0) {
            return res.status(500).json({
                tipo: "error",
                message: "Items que superan caracteres: " + itemsMas60,
                itemsInsertados: 0
            })
        }
        
    }
});

router.get("/conexionBasedatos", async (req, res) => {
    const dbConn = new sql.ConnectionPool(dbConfig2);
    let cuit = req.body.cuit;
    dbConn.connect().then(async function () {
        let request = new sql.Request(dbConn);
        request.input("cuit", cuit);
        let response = await request
            .query("Select * from vtmclh where vtmclh_nrodoc = @cuit;")
            .then(async function (resp) {
                let nrocta = await resp.recordset[0].VTMCLH_NROCTA;
                console.log(nrocta);
                //console.log(resp);
                //res.send(resp);
                res.send(nrocta);
                dbConn.close();
            });
    });
});

module.exports = router;
