/**
 * Rasyon POS Print Server
 * Termal yazıcıya doğrudan ESC/POS komutları gönderen Node.js servisi
 * Bu script arka planda çalışarak tarayıcıdan gelen istekleri yazıcıya iletir
 * 
 * Kullanım: node print-server.js
 * Port: 3939
 */

import http from 'http';
import net from 'net';

const PRINTER_IP = '192.168.1.42';
const PRINTER_PORT = 9100;
const SERVER_PORT = 3939;

// ESC/POS Commands
const ESC = '\x1B';
const GS = '\x1D';
const INIT = ESC + '@';           // Initialize printer
const ALIGN_CENTER = ESC + 'a' + '\x01';
const ALIGN_LEFT = ESC + 'a' + '\x00';
const ALIGN_RIGHT = ESC + 'a' + '\x02';
const BOLD_ON = ESC + 'E' + '\x01';
const BOLD_OFF = ESC + 'E' + '\x00';
const DOUBLE_HEIGHT = GS + '!' + '\x10';
const NORMAL_SIZE = GS + '!' + '\x00';
const CUT_PAPER = GS + 'V' + '\x00';
const FEED_LINE = '\n';

// Convert receipt data to ESC/POS commands
function generateESCPOS(data) {
    let commands = '';

    // Initialize printer
    commands += INIT;

    // Header - RASYON POS (centered, bold, large)
    commands += ALIGN_CENTER;
    commands += BOLD_ON;
    commands += DOUBLE_HEIGHT;
    commands += 'RASYON POS' + FEED_LINE;
    commands += NORMAL_SIZE;
    commands += BOLD_OFF;

    // Pedro Burger & More
    commands += 'Pedro Burger & More' + FEED_LINE;
    commands += FEED_LINE;

    // Order info (left aligned)
    commands += ALIGN_LEFT;
    commands += 'Siparis Zamani: ' + formatDate(data.orderDate) + FEED_LINE;
    commands += 'Siparis Kaynagi: Restoran Servis' + FEED_LINE;

    // Dashed line
    commands += '--------------------------------' + FEED_LINE;

    // Items header
    commands += BOLD_ON;
    commands += 'Urun                 Fiyat Tutar' + FEED_LINE;
    commands += BOLD_OFF;
    commands += '--------------------------------' + FEED_LINE;

    // Items
    for (const item of data.items) {
        const name = item.name.substring(0, 18).padEnd(18);
        const qty = String(item.quantity).padStart(2);
        const price = item.unitPrice.toFixed(2).padStart(6);
        const total = item.totalPrice.toFixed(2).padStart(6);
        commands += qty + ' ' + name + price + total + FEED_LINE;
    }

    // Dashed line
    commands += '--------------------------------' + FEED_LINE;

    // Total (bold, large)
    commands += BOLD_ON;
    commands += DOUBLE_HEIGHT;
    commands += 'TOPLAM: ' + data.totalAmount.toFixed(2) + ' TL' + FEED_LINE;
    commands += NORMAL_SIZE;
    commands += BOLD_OFF;

    // Footer
    commands += FEED_LINE;
    commands += ALIGN_CENTER;
    commands += 'Tesekkur ederiz!' + FEED_LINE;
    commands += 'Afiyet olsun!' + FEED_LINE;

    // Feed and cut
    commands += FEED_LINE;
    commands += FEED_LINE;
    commands += FEED_LINE;
    commands += CUT_PAPER;

    return commands;
}

function formatDate(isoDate) {
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hour}:${minute}`;
}

// Send to printer via raw socket
function sendToPrinter(escposData) {
    return new Promise((resolve, reject) => {
        const client = new net.Socket();

        client.connect(PRINTER_PORT, PRINTER_IP, () => {
            console.log('Connected to printer at ' + PRINTER_IP + ':' + PRINTER_PORT);
            client.write(escposData, 'binary');
            client.end();
        });

        client.on('close', () => {
            console.log('Print job sent successfully');
            resolve({ success: true });
        });

        client.on('error', (err) => {
            console.error('Printer error:', err.message);
            reject(err);
        });
    });
}

// HTTP Server
const server = http.createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === 'POST' && req.url === '/print') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const escpos = generateESCPOS(data);
                await sendToPrinter(escpos);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, message: 'Printed successfully' }));
            } catch (err) {
                console.error('Error:', err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
    } else if (req.method === 'GET' && req.url === '/status') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'running', printer: PRINTER_IP }));
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

server.listen(SERVER_PORT, () => {
    console.log('=================================');
    console.log('  Rasyon POS Print Server');
    console.log('=================================');
    console.log('Server running on: http://localhost:' + SERVER_PORT);
    console.log('Printer IP: ' + PRINTER_IP + ':' + PRINTER_PORT);
    console.log('');
    console.log('Endpoints:');
    console.log('  POST /print - Send print job');
    console.log('  GET /status - Check server status');
    console.log('');
    console.log('Press Ctrl+C to stop');
});
