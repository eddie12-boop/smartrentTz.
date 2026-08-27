const prisma = require('../prismaClient');

const createLease = async (req, res, next) => {
  try {
    const { tenantId, propertyId, unitId, startDate, endDate, monthlyRent, securityDeposit } = req.body;

    // Verify property ownership
    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!property || (property.ownerId !== req.user.id && req.user.role !== 'ADMIN')) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Wrap in transaction to update unit status
    const result = await prisma.$transaction(async (tx) => {
      const lease = await tx.lease.create({
        data: {
          tenantId,
          landlordId: property.ownerId,
          propertyId,
          unitId,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          monthlyRent: parseFloat(monthlyRent),
          securityDeposit: parseFloat(securityDeposit),
          status: 'ACTIVE'
        }
      });

      await tx.unit.update({
        where: { id: unitId },
        data: { status: 'OCCUPIED' }
      });

      return lease;
    });

    res.status(201).json({ success: true, data: { lease: result } });
  } catch (error) {
    next(error);
  }
};

const getMyLeases = async (req, res, next) => {
  try {
    const leases = await prisma.lease.findMany({
      where: {
        OR: [
          { tenantId: req.user.id },
          { landlordId: req.user.id }
        ]
      },
      include: {
        property: { select: { title: true, address: true } },
        unit: { select: { unitNumber: true } },
        tenant: { select: { firstName: true, lastName: true, phone: true } },
        landlord: { select: { firstName: true, lastName: true, phone: true } }
      }
    });

    res.json({ success: true, data: { leases } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createLease,
  getMyLeases
};
