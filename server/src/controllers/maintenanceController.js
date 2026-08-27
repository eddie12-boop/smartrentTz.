const prisma = require('../prismaClient');

const createMaintenanceRequest = async (req, res, next) => {
  try {
    const { propertyId, unitId, title, description, priority, estimatedCost } = req.body;
    const tenantId = req.user.id;

    const request = await prisma.maintenanceRequest.create({
      data: {
        tenantId,
        propertyId,
        unitId,
        title,
        description,
        priority: priority || 'MEDIUM',
        estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null,
        status: 'OPEN'
      },
      include: {
        property: { select: { title: true, address: true, region: true } },
        unit: { select: { unitNumber: true } }
      }
    });

    // Notify landlord
    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    if (property) {
      await prisma.notification.create({
        data: {
          userId: property.ownerId,
          title: `Ombi Jipya la Matengenezo (${priority || 'MEDIUM'})`,
          message: `Mpangaji ameripoti tatizo: "${title}" kwenye ${property.title}.`,
          type: 'MAINTENANCE'
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Ombi la matengenezo limewasilishwa kikamilifu.',
      data: { request }
    });
  } catch (error) {
    next(error);
  }
};

const getMaintenanceRequests = async (req, res, next) => {
  try {
    const role = req.user.role;
    let requests = [];

    if (role === 'TENANT') {
      requests = await prisma.maintenanceRequest.findMany({
        where: { tenantId: req.user.id },
        include: {
          property: { select: { title: true, address: true, region: true } },
          unit: { select: { unitNumber: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else if (role === 'LANDLORD') {
      requests = await prisma.maintenanceRequest.findMany({
        where: { property: { ownerId: req.user.id } },
        include: { 
          tenant: { select: { firstName: true, lastName: true, phone: true, email: true, nidaNumber: true } },
          property: { select: { title: true, address: true, region: true } }, 
          unit: { select: { unitNumber: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      // ADMIN or AGENT
      requests = await prisma.maintenanceRequest.findMany({
        include: {
          tenant: { select: { firstName: true, lastName: true, phone: true, email: true, nidaNumber: true } },
          property: { select: { title: true, address: true, region: true, ownerId: true } },
          unit: { select: { unitNumber: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    res.json({ success: true, data: { requests } });
  } catch (error) {
    next(error);
  }
};

const updateMaintenanceStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, assignedTo, estimatedCost, actualCost, technicianNotes } = req.body;

    const existing = await prisma.maintenanceRequest.findUnique({
      where: { id },
      include: { property: true }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Ombi la matengenezo halikupatikana.' });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo;
    if (estimatedCost !== undefined) updateData.estimatedCost = parseFloat(estimatedCost) || null;
    if (actualCost !== undefined) updateData.actualCost = parseFloat(actualCost) || null;
    if (technicianNotes !== undefined) updateData.technicianNotes = technicianNotes;
    if (status === 'RESOLVED' || status === 'CLOSED') {
      updateData.completionDate = new Date();
    }

    const updated = await prisma.maintenanceRequest.update({
      where: { id },
      data: updateData,
      include: {
        property: { select: { title: true } },
        unit: { select: { unitNumber: true } },
        tenant: { select: { id: true, firstName: true, lastName: true } }
      }
    });

    // Notify tenant on progress/resolution
    await prisma.notification.create({
      data: {
        userId: existing.tenantId,
        title: `Sasisho la Matengenezo: ${status || 'Limesasishwa'}`,
        message: `Ombi lako la "${existing.title}" limebadilishwa kuwa: ${status || 'Linafanyiwa kazi'}. ${technicianNotes ? `Maelezo ya Fundi: ${technicianNotes}` : ''}`,
        type: 'MAINTENANCE'
      }
    });

    res.json({
      success: true,
      message: 'Taarifa za matengenezo zimesasishwa.',
      data: { request: updated }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createMaintenanceRequest,
  getMaintenanceRequests,
  updateMaintenanceStatus
};
