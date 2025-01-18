const puppeteer = require('puppeteer');
const insertCamionData = require('./connect');
const fetch = require("node-fetch");

const emailList = [
    { email: "anghelenicis59@gmail.com", message: "Una dintre camere nu functioneaza." },
    { email: "dan@dotteam.co", message: "Una dintre camere nu functioneaza." },
    { email: "cridyson@gmail.com", message: "Una dintre camere nu functioneaza." },
    { email: "suharenco.sergiu@gmail.com", message: "Una dintre camere nu functioneaza." },
];

const sendEmails = async () => {
    for (const recipient of emailList) {
        const emails = Array.isArray(recipient.email) ? recipient.email : [recipient.email];

        const emailData = {
            subject: 'Atentie !!!',
            from: 'anghelenicis59@gmail.com',
            smtpUser: "anghelenicis59@gmail.com",
            smtpPass: "abss bugh pzlm gaif",
            to: emails.join(','),
            message: recipient.message,
        };

        try {
            const response = await fetch('https://send-mail-wine.vercel.app/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(emailData),
            });

            if (response.ok) {
                console.log(`Mesaj trimis cu succes către ${emails.join(', ')}`);
            } else {
                const errorData = await response.json();
                console.error(`Eroare la trimiterea mesajului către ${emails.join(', ')}:`, errorData);
            }
        } catch (error) {
            console.error(`Eroare la trimiterea mesajului către ${emails.join(', ')}:`, error);
        }
    }
};



sendEmails();



const checkLinkAvailability = async (url) => {
    try {
        const response = await fetch(url);
        if (response.ok) {
            console.log(`Conectare reușită la: ${url}`);
        } else {
            console.error(`Eroare la conectarea la: ${url} (Status: ${response.status})`);
            sendEmails();
        }
    } catch (error) {
        console.error(`Nu s-a putut conecta la: ${url} - Eroare: ${error.message}`);
        sendEmails();
    }
};

async function loginAndMonitor({ loginUrl, dataUrl, punctDeTrecere, loginData, idAgent }) {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    const processedElements = new Set();

    try {
        await page.goto(loginUrl, { waitUntil: 'domcontentloaded' });

        // Login
        await page.waitForSelector('input[placeholder="User Name"]', { timeout: 60000 });
        await page.type('input[placeholder="User Name"]', loginData.username);
        await page.type('input[placeholder="Password"]', loginData.password);
        await page.click('button[type="button"]');
        await page.waitForNavigation({ waitUntil: 'domcontentloaded' });

        console.log(`Autentificare cu succes! <- ${punctDeTrecere}`);

        await page.goto(dataUrl, { waitUntil: 'domcontentloaded' });
        console.log(`Am accesat pagina ${dataUrl}. Incep monitorizarea elementelor. <- ${punctDeTrecere}`);

        setInterval(async () => {
            const newElements = await page.evaluate(() => {
                const elements = document.querySelectorAll('.id-realtime-wrap');
                const results = [];

                elements.forEach(element => {
                    const vehicleDetails = Array.from(
                        element.querySelectorAll('.id-realtime-bottom-content-trans')
                    ).map(el => el.textContent.trim());

                    const numberPlate = vehicleDetails[0];
                    const dateTime = element.querySelector('.id-realtime-bottom-header > span:nth-child(2)')?.textContent.trim();

                    if (numberPlate && dateTime && numberPlate !== 'Unknown') {
                        results.push({
                            numberPlate,
                            dateTime,
                            details: vehicleDetails.slice(1),
                        });
                    }
                });

                return results;
            });

            const uniqueNewElements = newElements.filter(item => {
                const uniqueKey = `${item.numberPlate}_${item.dateTime}`;
                if (processedElements.has(uniqueKey)) {
                    return false;
                }
                processedElements.add(uniqueKey);
                return true;
            });

            if (uniqueNewElements.length > 0) {
                console.log(`Elemente noi detectate: <- ${punctDeTrecere}`);
                console.log(uniqueNewElements);

                for (const element of uniqueNewElements) {
                    await insertCamionData(element.numberPlate, element.dateTime, punctDeTrecere, idAgent);
                }
            }
        }, 5000);

    } catch (error) {
        console.error('Eroare:', error);
    } finally {
        console.log('Se colecteaza datele de pe camera ... ');
    }
}

const monitorLinks = (loginUrl, dataUrl) => {
    setInterval(async () => {
        await checkLinkAvailability(loginUrl);
        await checkLinkAvailability(dataUrl);
    }, 3600000);
};

monitorLinks()

module.exports = loginAndMonitor;
