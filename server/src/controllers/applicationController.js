const prisma = require('../prismaClient');
const sendEmail = require('../utils/email');

const createApplication = async (req, res, next) => {
  try {
    const { propertyId, unitId, message } = req.body;
    const tenantId = req.user.id;

    // Check if property exists
    const property = await prisma.property.findUnique({ 
      where: { id: propertyId },
      include: { owner: true }
    });
    
    if (!property) return res.status(404).json({ success: false, message: 'Property not found' });

    // Check if application already exists for this tenant and property/unit
    const existing = await prisma.rentalApplication.findFirst({
      where: {
        tenantId,
        propertyId,
        unitId,
        status: { in: ['PENDING', 'UNDER_REVIEW'] }
      }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'You already have an active application for this property.' });
    }

    const application = await prisma.rentalApplication.create({
      data: {
        tenantId,
        propertyId,
        unitId,
        message,
        status: 'PENDING'
      }
    });

    // Notify landlord
    sendEmail({
      email: property.owner.email,
      subject: `New Rental Application for ${property.title}`,
      message: `You have received a new rental application from a tenant for your property: ${property.title}. Please log in to your dashboard to review it.`,
      html: `
        <h3>New Rental Application</h3>
        <p>You have received a new rental application from a tenant for your property: <strong>${property.title}</strong>.</p>
        <p><strong>Message from tenant:</strong> ${message || 'No additional message provided.'}</p>
        <p>Please log in to your Landlord Dashboard to review and approve/reject the application.</p>
      `
    });

    res.status(201).json({ success: true, data: { application } });
  } catch (error) {
    next(error);
  }
};

const getMyApplications = async (req, res, next) => {
  try {
    const applications = await prisma.rentalApplication.findMany({
      where: { tenantId: req.user.id },
      include: {
        property: { select: { title: true, address: true, images: true } },
        unit: { select: { unitNumber: true, monthlyRent: true } }
      },
      orderBy: { submittedAt: 'desc' }
    });

    res.json({ success: true, data: { applications } });
  } catch (error) {
    next(error);
  }
};

const getApplicationsForLandlord = async (req, res, next) => {
  try {
    const applications = await prisma.rentalApplication.findMany({
      where: {
        property: {
          ownerId: req.user.id
        }
      },
      include: {
        tenant: { select: { firstName: true, lastName: true, email: true, phone: true } },
        property: { select: { title: true } },
        unit: { select: { unitNumber: true, monthlyRent: true } }
      },
      orderBy: { submittedAt: 'desc' }
    });

    res.json({ success: true, data: { applications } });
  } catch (error) {
    next(error);
  }
};

const updateApplicationStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const application = await prisma.rentalApplication.findUnique({
      where: { id },
      include: { 
        property: true,
        tenant: true
      }
    });

    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

    // Verify ownership
    if (application.property.ownerId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const updated = await prisma.rentalApplication.update({
      where: { id },
      data: {
        status,
        reviewedAt: new Date(),
        reviewedBy: req.user.id
      }
    });

    // Notify tenant
    sendEmail({
      email: application.tenant.email,
      subject: `Application Update for ${application.property.title}`,
      message: `Your rental application for ${application.property.title} has been updated to: ${status}.`,
      html: `
        <h3>Application Status Updated</h3>
        <p>Your rental application for <strong>${application.property.title}</strong> has been updated.</p>
        <p>New Status: <strong>${status}</strong></p>
        <p>Please log in to your Tenant Dashboard for more details.</p>
      `
    });

    res.json({ success: true, data: { application: updated } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createApplication,
  getMyApplications,
  getApplicationsForLandlord,
  updateApplicationStatus
};
