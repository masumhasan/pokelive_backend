import zlib from 'zlib';
import { Order } from '../models/Order.js';
import { Store } from '../models/Store.js';
import { SenderAddress } from '../models/SenderAddress.js';
import { NotFoundError } from '../utils/errors.js';

function sanitize(str) {
  return String(str || '').replace(/[()\\\r\n]/g, ' ').slice(0, 75);
}

export async function getShippingLabel(userId, orderId) {
  const store = await Store.findOne({ user: userId });
  if (!store) throw new NotFoundError('Store not found.');

  // Find order by Mongo _id or friendly orderId string
  const order = await Order.findOne({
    $or: [
      { _id: orderId.match(/^[0-9a-fA-F]{24}$/) ? orderId : null },
      { orderId }
    ].filter(Boolean),
    store: store._id,
  });

  if (!order) throw new NotFoundError('Order not found.');

  // Generate tracking number if not yet assigned
  if (!order.trackingNumber) {
    const cleanId = (order.orderId || 'PL00').replace(/[^a-zA-Z0-9]/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    order.trackingNumber = `GB-ROYAL-${cleanId}-${rand}`;
    if (order.status === 'Pending') {
      order.status = 'Processing';
    }
    await order.save();
  }

  const senderAddr = await SenderAddress.findOne({ store: store._id }).lean();
  const buyerAddr = order.shippingAddress || {};

  return {
    orderId: order.orderId,
    orderDbId: order._id.toString(),
    trackingNumber: order.trackingNumber,
    carrier: order.shippingPartner || 'Royal Shipping',
    service: 'Royal Tracked 24 Priority',
    createdAt: order.createdAt,
    sender: {
      storeName: store.name || 'PokeLive Store',
      fullName: senderAddr?.fullName || store.name || 'PokeLive Merchant',
      streetAddress: senderAddr?.streetAddress || 'Warehouse 4, Docklands',
      city: senderAddr?.city || 'London',
      state: senderAddr?.state || '',
      postalCode: senderAddr?.postalCode || 'E16 2QY',
      country: senderAddr?.country || 'United Kingdom',
      phone: senderAddr?.phone || '+44 20 7946 0912',
    },
    recipient: {
      fullName: `${buyerAddr.firstName || ''} ${buyerAddr.lastName || ''}`.trim() || order.buyerName || 'Valued Buyer',
      streetAddress: buyerAddr.streetAddress || 'Delivery Address',
      apartment: buyerAddr.apartment || '',
      city: buyerAddr.city || '',
      state: buyerAddr.state || '',
      postalCode: buyerAddr.postalCode || '',
      country: buyerAddr.country || 'United Kingdom',
      phone: buyerAddr.contactNumber || 'N/A',
    },
    items: (order.items || []).map((item) => ({
      title: item.title,
      quantity: item.quantity,
      price: item.price,
    })),
    totalItems: (order.items || []).reduce((acc, i) => acc + (i.quantity || 1), 0),
    totalAmount: order.totalAmount,
    pdfDownloadUrl: `/api/v1/orders/seller/${order._id}/shipping-label/pdf`,
    pngDownloadUrl: `/api/v1/orders/seller/${order._id}/shipping-label/png`,
  };
}

export function generatePdf(data) {
  let stream = '';
  const text = (t, x, y, size = 10, bold = false) => {
    const font = bold ? '/F2' : '/F1';
    stream += `BT ${font} ${size} Tf ${x} ${y} Td (${sanitize(t)}) Tj ET\n`;
  };
  const rect = (x, y, w, h, fill = false) => {
    stream += `${x} ${y} ${w} ${h} re ${fill ? 'f' : 'S'}\n`;
  };
  const line = (x1, y1, x2, y2) => {
    stream += `${x1} ${y1} m ${x2} ${y2} l S\n`;
  };

  // Outer label border (400 x 600 pt)
  stream += '1.5 w\n';
  rect(20, 20, 360, 560);

  // Top header banner
  rect(20, 530, 360, 50, true);
  stream += '1 1 1 rg\n';
  text('ROYAL SHIPPING - TRACKED 24', 35, 550, 16, true);
  stream += '0 0 0 rg\n';

  // Tracking # & Order ID
  text(`TRACKING #: ${data.trackingNumber}`, 35, 505, 12, true);
  text(`ORDER: ${data.orderId}`, 250, 505, 11, true);

  // Barcode pattern
  let bx = 35;
  for (let i = 0; i < 48; i++) {
    const bw = (i % 4 === 0) ? 3 : (i % 2 === 0 ? 2 : 1);
    rect(bx, 445, bw, 45, true);
    bx += bw + 3;
    if (bx > 365) break;
  }

  stream += '1 w\n';
  line(20, 430, 380, 430);

  // SHIP FROM
  text('SHIP FROM:', 35, 412, 10, true);
  text(data.sender.storeName, 35, 397, 11, true);
  text(data.sender.streetAddress, 35, 382, 10);
  text(`${data.sender.city}, ${data.sender.postalCode}, ${data.sender.country}`, 35, 367, 10);
  text(`Phone: ${data.sender.phone}`, 35, 352, 9);

  line(20, 338, 380, 338);

  // SHIP TO (Prominent for sorting)
  text('DELIVER TO:', 35, 318, 11, true);
  text(data.recipient.fullName, 35, 300, 14, true);
  text(`${data.recipient.streetAddress}${data.recipient.apartment ? ', ' + data.recipient.apartment : ''}`, 35, 282, 12);
  text(`${data.recipient.city}, ${data.recipient.postalCode} ${data.recipient.country}`, 35, 265, 12, true);
  text(`Contact: ${data.recipient.phone}`, 35, 248, 10);

  line(20, 228, 380, 228);

  // PACKAGE DETAILS
  text(`PACKAGE CONTENTS (${data.totalItems} ITEMS):`, 35, 208, 10, true);
  let py = 190;
  (data.items || []).slice(0, 4).forEach((item) => {
    text(`- ${item.title} (x${item.quantity})`, 40, py, 9);
    py -= 15;
  });

  // Footer banner
  rect(25, 30, 350, 40);
  text('POKELIVE VERIFIED SHIPMENT - FRAGILE', 70, 48, 11, true);
  text('PRIORITY DISPATCH - SCAN AT DESTINATION', 95, 36, 8);

  const streamObj = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 400 600] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj',
    `4 0 obj\n${streamObj}\nendobj`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj',
    '6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj',
  ];

  let body = '%PDF-1.4\n';
  const xref = [0];
  for (const obj of objects) {
    xref.push(body.length);
    body += obj + '\n';
  }
  const xrefPos = body.length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    body += String(xref[i]).padStart(10, '0') + ' 00000 n \n';
  }
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefPos}\n%%EOF`;
  return Buffer.from(body);
}

// Generate valid standard PNG raster image (360x540)
export function generatePng(data) {
  const width = 360;
  const height = 540;
  const rowSize = 1 + width * 3;
  const raw = Buffer.alloc(height * rowSize, 255);

  // Draw black borders and barcode lines
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    raw[rowOffset] = 0; // Filter byte none

    for (let x = 0; x < width; x++) {
      const px = rowOffset + 1 + x * 3;
      const isOuterBorder = x < 8 || x >= width - 8 || y < 8 || y >= height - 8;
      const isHeaderBanner = y >= 16 && y <= 60;
      const isBarcode = y >= 100 && y <= 160 && x >= 30 && x <= 330 && (x % 5 === 0 || x % 7 === 0);
      const isDivider1 = y >= 180 && y <= 182;
      const isDivider2 = y >= 290 && y <= 292;
      const isDivider3 = y >= 420 && y <= 422;
      const isFooter = y >= 490 && y <= 520 && (x < 15 || x >= width - 15 || y === 490 || y === 520);

      if (isOuterBorder || isHeaderBanner || isBarcode || isDivider1 || isDivider2 || isDivider3 || isFooter) {
        raw[px] = 0;
        raw[px + 1] = 0;
        raw[px + 2] = 0;
      }
    }
  }

  const compressed = zlib.deflateSync(raw);

  function crc32(buf) {
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      crc ^= buf[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
      }
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, chunkData) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(chunkData.length, 0);
    const typeBuf = Buffer.from(type);
    const toCrc = Buffer.concat([typeBuf, chunkData]);
    const crcVal = Buffer.alloc(4);
    crcVal.writeUInt32BE(crc32(toCrc), 0);
    return Buffer.concat([len, typeBuf, chunkData, crcVal]);
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2; // RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}
