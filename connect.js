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
        const SuccesPending = 'pending';
        const SuccesTrue = 'true';
        const id_agent = idAgent;
        const id_punct_de_trecere = punct;
        const id_punct_de_devamare = null;
        const isDeleted = '0';

        // Verifică dacă există o înregistrare activă (Succes = 'pending') pentru acest număr de înmatriculare
        const [activeEntries] = await connection.execute(
            `SELECT id_camion, id_agent FROM Camioane WHERE Numar_inmatriculare = ? AND Succes = ? LIMIT 1`,
            [numberPlate, SuccesPending]
        );

        if (activeEntries.length > 0) {
            const idCamion = activeEntries[0].id_camion;
            const existingAgent = activeEntries[0].id_agent;

            // Verifică dacă agentul curent este diferit de cel care a înregistrat inițial camionul
            if (existingAgent === id_agent) {
                console.log(`Agentul ${id_agent} nu are permisiunea să actualizeze succesul pentru camionul ${numberPlate}, deoarece tot el l-a înregistrat inițial.`);
                return;
            }

            // Actualizează înregistrarea activă
            await connection.execute(
                `UPDATE Camioane 
                SET Succes = ?, Timp_iesire = ?, id_agent = ? 
                WHERE id_camion = ?`,
                [SuccesTrue, dateTime, id_agent, idCamion]
            );
            console.log(`Numarul de inmatriculare ${numberPlate} actualizat cu Succes = 'true' și Timp_iesire = ${dateTime} de agentul ${id_agent}. <-${punct}`);
        } else {
            // Creează o nouă înregistrare pentru o nouă intrare
            await connection.execute(
                `INSERT INTO Camioane 
                (Numar_inmatriculare, Timp_intrare, Succes, id_agent, id_punct_de_trecere, id_punct_de_devamare, isDeleted)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [numberPlate, dateTime, SuccesPending, id_agent, id_punct_de_trecere, id_punct_de_devamare, isDeleted]
            );
            console.log(`Inserare reusita pentru camion: ${numberPlate} la ${dateTime} de agentul ${id_agent}. <-${punct}`);
        }
    } catch (error) {
        console.error(`Eroare la procesarea camionului: ${numberPlate} la ${dateTime} <-${punct}`, error);
    } finally {
        await connection.end();
    }
}

module.exports = insertCamionData;
