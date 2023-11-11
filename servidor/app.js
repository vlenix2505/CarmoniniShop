const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const sql = require('mssql');
const bcrypt = require('bcrypt');
const configdb = {
    server: 'carmoniniserver.database.windows.net',
    database: 'carmoninidb',
    user: 'csfb',
    password: 'Enfrienatito$',
    options: {
        encrypt: true,
        trustServerCertificate: true,
    },
};
app.use(bodyParser.urlencoded({
    extended: false,
    limit: '10mb',
    parameterLimit: 100000,
    type: 'application/x-www-form-urlencoded',

}));
app.use(cors());
app.use(async (req, res, next) => {
    if (req.body && req.body.contrasena) {
        const esRutaRegistro = req.path === '/api/registrar';
        if (esRutaRegistro) {
            const hashedPassword = await bcrypt.hash(req.body.contrasena, 10);
            req.body.contrasena = hashedPassword;
          }
    }
    next();
});
app.post('/api/registrar', async (req, res) => {

    try {
        const { nombreUsuario, correo, contrasena } = req.body;
        await sql.connect(configdb);

        const result = await sql.query`INSERT INTO usuarios (nombre_usuario, correo, contraseña) VALUES (${nombreUsuario}, ${correo}, ${contrasena})`;

        await sql.close();
        console.log('Usuario registrado correctamente');
        res.send('Usuario registrado correctamente');
    } catch (error) {
        console.error('Error al registrar el usuario:', error.message);
        res.status(500).send('Error al registrar el usuario');
    }
});
app.post('/api/iniciar_sesion', async (req, res) => {
    try {
        const { nombreUsuario, contrasena } = req.body;
        await sql.connect(configdb);

        const result = await sql.query`SELECT nombre_usuario, contraseña FROM usuarios WHERE nombre_usuario = ${nombreUsuario}`;

        const usuario = result.recordset[0];

        if (!usuario) {
            return res.status(401).send('Credenciales incorrectas');
        }

        const contrasenaValida = await bcrypt.compare(contrasena, usuario.contraseña);

        if (contrasenaValida) {
            res.send('Inicio de sesión exitoso');
        } else {
            res.status(401).send('Credenciales incorrectas');
        }
    } catch (error) {
        console.error('Error en el inicio de sesión:', error.message);
        res.status(500).send('Error en el inicio de sesión');
    }

});

const port = 3000;
app.listen(port, () => {
    console.log(`El servidor está escuchando en el puerto ${port}`);
});