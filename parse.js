const puppeteer = require('puppeteer');
const insertCamionData = require('./connect');
const fetch = require("node-fetch");

const emailList = [
    { email: "anghelenicis59@gmail.com", message: "Una dintre camere nu functioneaza." },
    { email: "dan@dotteam.co", message: "Una dintre camere nu functioneaza." },
    { email: "cridyson@gmail.com", message: "Una dintre camere nu functioneaza." },
    { email: "suharenco.sergiu@gmail.com", message: "Una dintre camere nu functioneaza." },
];


const getCurrentDateTime = () => {
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} ${year}, ${hours}:${minutes}`;
};

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
            emailHtml: "<html><body style='font-family: Arial, sans-serif; background-color: #f8f9fa;'><div style='background-color: #d9534f; color: white; padding: 15px; text-align: center; border-radius: 5px;'><h2>Atentie!!!</h2><p style='font-size: 18px;'><strong>Una dintre camerele noastre s-a oprit.</strong></p></div><div style='margin-top: 20px; padding: 15px; background-color: white; border: 1px solid #ddd; border-radius: 8px;'><h3 style='color: #d9534f;'>Detalii:</h3><table style='width: 100%; border-collapse: collapse;'><tr><td style='padding: 10px; border: 1px solid #ddd; background: #f8f9fa;'><strong>Mesaj:</strong></td><td style='padding: 10px; border: 1px solid #ddd;'>O cameră s-a oprit și nu mai funcționează.</td></tr><tr><td style='padding: 10px; border: 1px solid #ddd; background: #f8f9fa;'><strong>Data și ora:</strong></td><td style='padding: 10px; border: 1px solid #ddd;'>" + getCurrentDateTime() + "</td></tr></table><p style='margin-top: 20px; font-size: 16px;'>Te rugăm să iei măsurile necesare pentru a remedia problema.</p></div></body></html>"
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



// sendEmails();



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
    }, 3600000); // 3600000 ms = 1h
};

setInterval(async () => {
    monitorLinks()
}, 60000); // 60000 ms = 1 minut


module.exports = loginAndMonitor;
