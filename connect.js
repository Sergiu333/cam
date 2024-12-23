const mysql = require('mysql2/promise');
const dbConfig = require('./config/db.config');

async function insertCamionData(numberPlate, dateTime, punct, idAgent) {
    const connection = await mysql.createConnection({
        host: dbConfig.host,
        user: dbConfig.user,
        password: dbConfig.password,
        database: dbConfig.database,
        port: dbConfig.port,
    });

    try {
        const Succes = 'pending';
        const id_agent = idAgent;
        const id_punct_de_trecere = punct;
        const id_punct_de_devamare = null;
        const isDeleted = '0';

        const [existing] = await connection.execute(
            `SELECT id_camion, Succes, Timp_intrare, Timp_iesire FROM Camioane WHERE Numar_inmatriculare = ? AND Succes = ? LIMIT 1`,
            [numberPlate, Succes]
        );

        if (existing.length > 0) {
            const idCamion = existing[0].id_camion;
            await connection.execute(
                `UPDATE Camioane 
                SET Succes = 'true', Timp_iesire = ? 
                WHERE id_camion = ?`,
                [dateTime, idCamion]
            );
            console.log(`Numarul de inmatriculare ${numberPlate} exista deja, actualizat cu succesul true si Timp_iesire la ${dateTime}. <-${punct}`);
        } else {
            await connection.execute(
                `INSERT INTO Camioane 
                (Numar_inmatriculare, Timp_intrare, Succes, id_agent, id_punct_de_trecere, id_punct_de_devamare, isDeleted)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [numberPlate, dateTime, Succes, id_agent, id_punct_de_trecere, id_punct_de_devamare, isDeleted]
            );
            console.log(`Inserare reusita pentru camion: ${numberPlate} la ${dateTime} <-${punct}`);
        }
    } catch (error) {
        console.error(`Eroare la procesarea camionului: ${numberPlate} la ${dateTime} <-${punct}`, error);
    } finally {
        await connection.end();
    }
}

module.exports = insertCamionData;
