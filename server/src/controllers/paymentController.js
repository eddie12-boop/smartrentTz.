const prisma = require('../prismaClient');
const { generateControlNumber, generateReceiptNumber, formatTZS } = require('../utils/gepgService');

// 1. Generate GePG Control Number for Lease Invoicing
const generateGePGControlNumber = async (req, res, next) => {
  try {
    const { leaseId, amount, dueDate, notes } = req.body;
    const userId = req.user.id;

    const lease = await prisma.lease.findUnique({
      where: { id: leaseId },
      include: { property: true, unit: true, tenant: true }
    });

    if (!lease) {
      return res.status(404).json({ success: false, message: 'Mkataba (Lease) haukupatikana.' });
    }

    // Verify permission (Tenant or Landlord/Admin)
    if (req.user.role === 'TENANT' && lease.tenantId !== userId) {
      return res.status(403).json({ success: false, message: 'Huna idhini ya kuomba Control Number kwa mkataba huu.' });
    }

    const payableAmount = amount ? parseFloat(amount) : lease.monthlyRent;
    const controlNum = generateControlNumber();
    const invoiceDueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const payment = await prisma.payment.create({
      data: {
        leaseId,
        tenantId: lease.tenantId,
        amount: payableAmount,
        paymentMethod: 'MOBILE_MONEY',
        controlNumber: controlNum,
        gepgStatus: 'GENERATED',
        dueDate: invoiceDueDate,
        status: 'PENDING',
        notes: notes || `Ankara ya kodi ya nyumba - ${lease.property.title} (Unit ${lease.unit.unitNumber})`
      },
      include: {
        lease: {
          include: { property: true, unit: true }
        },
        tenant: {
          select: { firstName: true, lastName: true, phone: true, email: true, nidaNumber: true }
        }
      }
    });

    // Create Notification
    await prisma.notification.create({
      data: {
        userId: lease.tenantId,
        title: 'Namba Mpya ya Malipo (Control Number)',
        message: `Control Number yako ya malipo ya TZS ${payableAmount.toLocaleString()} ni: ${controlNum}. Unaweza kulipa kupitia M-Pesa, Tigo Pesa, Airtel Money au Benki.`,
        type: 'PAYMENT'
      }
    });

    res.status(201).json({
      success: true,
      message: 'Control Number imetengenezwa kikamilifu.',
      data: {
        controlNumber: controlNum,
        amount: payableAmount,
        formattedAmount: formatTZS(payableAmount),
        dueDate: invoiceDueDate,
        paymentId: payment.id,
        payment
      }
    });
  } catch (error) {
    next(error);
  }
};

// 2. Pay using GePG Control Number (M-Pesa, Airtel Money, Tigo Pesa, Bank)
const payWithControlNumber = async (req, res, next) => {
  try {
    const { controlNumber, paymentMethod, transactionReference, paidAmount, phoneNumber } = req.body;

    if (!controlNumber) {
      return res.status(400).json({ success: false, message: 'Control Number inahitajika.' });
    }

    const payment = await prisma.payment.findFirst({
      where: { controlNumber },
      include: {
        lease: {
          include: { property: true, unit: true, landlord: true }
        },
        tenant: true
      }
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Control Number hii haijapatikana kwenye mfumo.' });
    }

    if (payment.status === 'PAID') {
      return res.status(400).json({
        success: false,
        message: 'Malipo ya Control Number hii tayari yalikwishalipwa.',
        data: { receiptNumber: payment.receiptNumber }
      });
    }

    const receiptNum = generateReceiptNumber();
    const finalPaidAmount = paidAmount ? parseFloat(paidAmount) : payment.amount;
    const finalTxRef = transactionReference || `TXN-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: 'PAID',
        gepgStatus: 'PAID',
        paymentDate: new Date(),
        paidAmount: finalPaidAmount,
        paymentMethod: paymentMethod || 'MOBILE_MONEY',
        transactionReference: finalTxRef,
        receiptNumber: receiptNum
      },
      include: {
        lease: {
          include: { property: true, unit: true }
        },
        tenant: true
      }
    });

    // Notify Tenant
    await prisma.notification.create({
      data: {
        userId: payment.tenantId,
        title: 'Malipo Yamethibitishwa (GePG)',
        message: `Malipo ya TZS ${finalPaidAmount.toLocaleString()} kupitia Control Number ${controlNumber} yamethibitishwa. Stakabadhi Namba: ${receiptNum}.`,
        type: 'PAYMENT'
      }
    });

    // Notify Landlord / NHC Officer
    await prisma.notification.create({
      data: {
        userId: payment.lease.landlordId,
        title: 'Malipo ya Kodi Yamepokelewa',
        message: `Mpangaji ${payment.tenant.firstName} ${payment.tenant.lastName} amelipa TZS ${finalPaidAmount.toLocaleString()} kwa Unit ${payment.lease.unit.unitNumber}.`,
        type: 'PAYMENT'
      }
    });

    res.json({
      success: true,
      message: 'Malipo yamekamilika na kuthibitishwa na GePG.',
      data: {
        payment: updatedPayment,
        receipt: {
          receiptNumber: receiptNum,
          controlNumber,
          amountPaid: finalPaidAmount,
          formattedAmount: formatTZS(finalPaidAmount),
          transactionReference: finalTxRef,
          paymentDate: updatedPayment.paymentDate,
          payerName: `${payment.tenant.firstName} ${payment.tenant.lastName}`,
          payerPhone: phoneNumber || payment.tenant.phone,
          property: payment.lease.property.title,
          unitNumber: payment.lease.unit.unitNumber,
          issuedBy: 'SmartRent TZ / Shirika la Nyumba la Taifa (NHC) Integration Gateway'
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// 3. Get Digital Receipt by Receipt Number or Payment ID
const getReceipt = async (req, res, next) => {
  try {
    const { identifier } = req.params;

    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { receiptNumber: identifier },
          { id: identifier },
          { controlNumber: identifier }
        ]
      },
      include: {
        lease: {
          include: { property: true, unit: true, landlord: true }
        },
        tenant: {
          select: { firstName: true, lastName: true, email: true, phone: true, nidaNumber: true }
        }
      }
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Stakabadhi haikupatikana.' });
    }

    res.json({
      success: true,
      data: {
        receipt: {
          receiptNumber: payment.receiptNumber || 'N/A',
          controlNumber: payment.controlNumber || 'N/A',
          status: payment.status,
          amount: payment.amount,
          paidAmount: payment.paidAmount || payment.amount,
          penaltyAmount: payment.penaltyAmount || 0,
          paymentMethod: paymentMethodLabel(payment.paymentMethod),
          transactionReference: payment.transactionReference,
          paymentDate: payment.paymentDate,
          dueDate: payment.dueDate,
          tenant: {
            name: `${payment.tenant.firstName} ${payment.tenant.lastName}`,
            phone: payment.tenant.phone,
            email: payment.tenant.email,
            nidaNumber: payment.tenant.nidaNumber || 'HAIJAWEKWA'
          },
          property: {
            title: payment.lease.property.title,
            address: payment.lease.property.address,
            region: payment.lease.property.region,
            district: payment.lease.property.district,
            unitNumber: payment.lease.unit.unitNumber
          },
          landlordName: `${payment.lease.landlord.firstName} ${payment.lease.landlord.lastName}`,
          issuer: 'SmartRent TZ - Shirika la Nyumba la Taifa (NHC) Institutional Portal'
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

function paymentMethodLabel(method) {
  switch (method) {
    case 'MOBILE_MONEY': return 'M-Pesa / Tigo Pesa / Airtel Money';
    case 'BANK': return 'NMB / CRDB / NBC Bank';
    case 'CARD': return 'Visa / MasterCard';
    case 'CASH': return 'Cash at Agency';
    default: return method;
  }
}

// 4. Record Manual Payment
const recordPayment = async (req, res, next) => {
  try {
    const { leaseId, amount, paymentMethod, transactionReference, dueDate } = req.body;
    
    const lease = await prisma.lease.findUnique({ where: { id: leaseId } });
    if (!lease) return res.status(404).json({ success: false, message: 'Lease not found' });

    const controlNum = generateControlNumber();
    const receiptNum = generateReceiptNumber();

    const payment = await prisma.payment.create({
      data: {
        leaseId,
        tenantId: lease.tenantId,
        amount: parseFloat(amount),
        paidAmount: parseFloat(amount),
        controlNumber: controlNum,
        receiptNumber: receiptNum,
        gepgStatus: 'PAID',
        paymentMethod: paymentMethod || 'MOBILE_MONEY',
        transactionReference: transactionReference || `TXN-${Date.now()}`,
        dueDate: dueDate ? new Date(dueDate) : new Date(),
        paymentDate: new Date(),
        status: 'PAID'
      }
    });

    res.status(201).json({ success: true, data: { payment } });
  } catch (error) {
    next(error);
  }
};

// 5. Get My Payments
const getMyPayments = async (req, res, next) => {
  try {
    const role = req.user.role;
    let payments = [];

    if (role === 'TENANT') {
      payments = await prisma.payment.findMany({
        where: { tenantId: req.user.id },
        include: { lease: { include: { property: true, unit: true } } },
        orderBy: { createdAt: 'desc' }
      });
    } else if (role === 'LANDLORD') {
      payments = await prisma.payment.findMany({
        where: { lease: { landlordId: req.user.id } },
        include: { 
          tenant: { select: { firstName: true, lastName: true, phone: true, email: true, nidaNumber: true } },
          lease: { include: { property: true, unit: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      payments = await prisma.payment.findMany({
        include: {
          tenant: { select: { firstName: true, lastName: true, phone: true, email: true, nidaNumber: true } },
          lease: { include: { property: true, unit: true, landlord: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    res.json({ success: true, data: { payments } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateGePGControlNumber,
  payWithControlNumber,
  getReceipt,
  recordPayment,
  getMyPayments
};
