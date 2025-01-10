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

        // Verifică dacă există un camion cu Succes = 'true'
        const [existingSuccess] = await connection.execute(
            `SELECT id_camion, id_agent FROM Camioane WHERE Numar_inmatriculare = ? AND Succes = ? LIMIT 1`,
            [numberPlate, SuccesTrue]
        );

        if (existingSuccess.length > 0) {
            const existingAgent = existingSuccess[0].id_agent;

            if (existingAgent === id_agent) {
                console.log(`Agentul ${id_agent} nu poate actualiza succesul pentru camionul ${numberPlate}, deoarece el este deja setat de același agent.`);
                return;
            }

            // Permite actualizarea doar de către un alt agent
            const idCamion = existingSuccess[0].id_camion;
            await connection.execute(
                `UPDATE Camioane 
                SET Timp_iesire = ?, id_agent = ? 
                WHERE id_camion = ?`,
                [dateTime, id_agent, idCamion]
            );
            console.log(`Camionul ${numberPlate} a fost actualizat de agentul ${id_agent} cu Timp_iesire la ${dateTime}. <-${punct}`);
        } else {
            // Verifică dacă există un camion cu Succes = 'pending'
            const [existingPending] = await connection.execute(
                `SELECT id_camion FROM Camioane WHERE Numar_inmatriculare = ? AND Succes = ? LIMIT 1`,
                [numberPlate, SuccesPending]
            );

            if (existingPending.length > 0) {
                const idCamion = existingPending[0].id_camion;
                await connection.execute(
                    `UPDATE Camioane 
                    SET Succes = 'true', Timp_iesire = ?, id_agent = ? 
                    WHERE id_camion = ?`,
                    [dateTime, id_agent, idCamion]
                );
                console.log(`Numarul de inmatriculare ${numberPlate} exista deja, actualizat cu succesul true si Timp_iesire la ${dateTime}. <-${punct}`);
            } else {
                // Inserează un nou camion dacă nu există
                await connection.execute(
                    `INSERT INTO Camioane 
                    (Numar_inmatriculare, Timp_intrare, Succes, id_agent, id_punct_de_trecere, id_punct_de_devamare, isDeleted)
                    VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [numberPlate, dateTime, SuccesPending, id_agent, id_punct_de_trecere, id_punct_de_devamare, isDeleted]
                );
                console.log(`Inserare reusita pentru camion: ${numberPlate} la ${dateTime} <-${punct}`);
            }
        }
    } catch (error) {
        console.error(`Eroare la procesarea camionului: ${numberPlate} la ${dateTime} <-${punct}`, error);
    } finally {
        await connection.end();
    }
}

module.exports = insertCamionData;
