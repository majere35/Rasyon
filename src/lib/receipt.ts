/**
 * Receipt Printing Service
 * Termal yazıcıya fiş yazdırma servisi
 * Windows varsayılan yazıcısına gönderir (Possify printer)
 */

export interface ReceiptItem {
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

export interface ReceiptData {
    orderNumber: number;
    orderDate: string;
    items: ReceiptItem[];
    totalAmount: number;
    paymentType?: string;
    customerName?: string;
    note?: string;
}

/**
 * Formats date for receipt display
 */
function formatDate(isoDate: string): string {
    const date = new Date(isoDate);
    return date.toLocaleString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Generates receipt HTML for thermal printer (58mm or 80mm width)
 * Style matches HemenYolda format for consistency
 */
function generateReceiptHTML(data: ReceiptData): string {
    const itemsHTML = data.items.map(item => `
        <tr>
            <td class="qty">${item.quantity}</td>
            <td class="name">${item.name}</td>
            <td class="price">${item.unitPrice.toFixed(2)}</td>
            <td class="total">${item.totalPrice.toFixed(2)}</td>
        </tr>
    `).join('');

    // Generate short order number (last 6 digits)
    const shortOrderNum = String(data.orderNumber).slice(-6);

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Fiş #${shortOrderNum}</title>
    <style>
        @page {
            size: 80mm auto;
            margin: 0;
        }
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            font-size: 13px;
            font-weight: 500;
            width: 80mm;
            padding: 4mm;
            background: white;
            color: #000;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        .header {
            text-align: left;
            margin-bottom: 8px;
            padding-bottom: 8px;
            border-bottom: 1px dashed #000;
        }
        .header .brand {
            font-size: 15px;
            font-weight: 700;
            margin-bottom: 3px;
        }
        .header .info {
            font-size: 12px;
        }
        .dashed-line {
            border-top: 1px dashed #000;
            margin: 8px 0;
        }
        .items-header {
            display: flex;
            justify-content: space-between;
            font-weight: 700;
            font-size: 12px;
            padding: 4px 0;
            border-bottom: 1px solid #000;
        }
        .items-header span:first-child {
            flex: 1;
        }
        .items {
            width: 100%;
            border-collapse: collapse;
            margin: 6px 0;
        }
        .items td {
            padding: 4px 2px;
            vertical-align: top;
            font-size: 13px;
            font-weight: 500;
        }
        .items .qty {
            width: 25px;
            text-align: center;
        }
        .items .name {
            text-align: left;
        }
        .items .price {
            width: 55px;
            text-align: right;
        }
        .items .total {
            width: 55px;
            text-align: right;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            font-size: 15px;
            font-weight: 700;
            padding: 8px 0;
            margin-top: 4px;
        }
        .payment-info {
            font-size: 12px;
            font-weight: 600;
            margin: 8px 0;
        }
        .footer {
            text-align: center;
            font-size: 12px;
            margin-top: 12px;
            padding-top: 8px;
            border-top: 1px dashed #000;
            line-height: 1.5;
        }
        .footer .brand-name {
            font-weight: 700;
            margin-top: 8px;
        }
        @media print {
            body {
                width: 80mm;
                -webkit-print-color-adjust: exact;
            }
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="brand">RASYON POS</div>
        <div class="info">Pedro Burger & More</div>
        <div class="info">Sipariş Zamanı: ${formatDate(data.orderDate)}</div>
        <div class="info">Sipariş Kaynağı: Restoran Servis</div>
    </div>
    
    <div class="dashed-line"></div>
    
    <div class="items-header">
        <span>Ürün Adet</span>
        <span style="width:55px;text-align:right;">Fiyat</span>
        <span style="width:55px;text-align:right;">Tutar</span>
    </div>
    
    <table class="items">
        ${itemsHTML}
    </table>
    
    <div class="total-row">
        <span>Toplam:</span>
        <span>${data.totalAmount.toFixed(2)}</span>
    </div>
    
    ${data.paymentType ? `<div class="payment-info">Ödeme Şekli: ${data.paymentType}</div>` : ''}
    
    <div class="footer">
        Teşekkür ederiz!<br>
        Afiyet olsun!
    </div>
</body>
</html>
    `;
}

/**
 * Print server URL for silent printing
 */
const PRINT_SERVER_URL = 'http://localhost:3939/print';

/**
 * Try to print via local print server (silent, no dialog)
 * Falls back to browser print if server is not available
 */
export async function printReceipt(data: ReceiptData): Promise<void> {
    // First, try the local print server for silent printing
    try {
        const response = await fetch(PRINT_SERVER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (response.ok) {
            console.log('Receipt printed successfully via print server');
            return;
        }
    } catch {
        console.log('Print server not available, falling back to browser print');
    }

    // Fallback: Use browser print
    printReceiptBrowser(data);
}

/**
 * Print receipt using browser print dialog (fallback method)
 */
function printReceiptBrowser(data: ReceiptData): void {
    const receiptHTML = generateReceiptHTML(data);

    // Create a hidden iframe for printing
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'absolute';
    printFrame.style.top = '-10000px';
    printFrame.style.left = '-10000px';
    printFrame.style.width = '80mm';
    printFrame.style.height = '0';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow?.document;
    if (frameDoc) {
        frameDoc.open();
        frameDoc.write(receiptHTML);
        frameDoc.close();

        // Wait for content to load then print
        printFrame.onload = () => {
            try {
                printFrame.contentWindow?.focus();
                printFrame.contentWindow?.print();
            } catch (e) {
                console.error('Print failed:', e);
            }

            // Remove iframe after printing
            setTimeout(() => {
                document.body.removeChild(printFrame);
            }, 1000);
        };
    }
}

/**
 * Check if print server is running
 */
export async function checkPrintServer(): Promise<boolean> {
    try {
        const response = await fetch('http://localhost:3939/status');
        return response.ok;
    } catch {
        return false;
    }
}

