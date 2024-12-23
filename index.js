const loginAndMonitor = require('./parse');

const loginData1 = {
    username: 'admin',
    password: 'Test2024',
};

const params1 = {
    loginUrl: 'http://46.97.226.95:8005/doc/index.html#/portal/login',
    dataUrl: 'http://46.97.226.95:8005/doc/index.html#/intelligentDisplay',
    punctDeTrecere: '66eceab9-6b2a-4266-895f-1babcdf3023f',
    loginData: loginData1,
    idAgent : 3,
};

const params2 = {
    loginUrl: 'http://92.114.165.156:8002/doc/index.html#/portal/login',
    dataUrl: 'http://92.114.165.156:8002/doc/index.html#/intelligentDisplay',
    punctDeTrecere: '8aa3f7d9-8437-4214-bc3e-51fc8d425984',
    loginData: loginData1,
    idAgent : 2,
};


loginAndMonitor(params1);
loginAndMonitor(params2);
