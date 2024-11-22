module.exports = {
    host: 'dotteam.mysql.tools',
    user: 'dotteam_digi',
    password: 'Y!uJ92r9&m',
    database: 'dotteam_digi',
    port: 3306,
    // Șterge secțiunea ssl sau comentează-o dacă nu o folosești
    // ssl: {
    //     rejectUnauthorized: false
    // },

    pool: {
        max: 5,
        min: 0,
        acquire: 3000,
        idle: 10000
    },
};
