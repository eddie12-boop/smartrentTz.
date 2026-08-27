const prisma = require('../prismaClient');

// Get NHC & Institutional Executive Dashboard Metrics
const getExecutiveOverview = async (req, res, next) => {
  try {
    // 1. Property and Unit Occupancy Metrics
    const totalProperties = await prisma.property.count();
    const allUnits = await prisma.unit.findMany({
      select: { id: true, status: true, monthlyRent: true, property: { select: { region: true } } }
    });

    const totalUnits = allUnits.length;
    const occupiedUnits = allUnits.filter(u => u.status === 'OCCUPIED').length;
    const availableUnits = allUnits.filter(u => u.status === 'AVAILABLE').length;
    const maintenanceUnits = allUnits.filter(u => u.status === 'MAINTENANCE').length;
    const reservedUnits = allUnits.filter(u => u.status === 'RESERVED').length;

    const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

    // 2. Financial Collections & Arrears (GePG)
    const payments = await prisma.payment.findMany();
    let totalRevenueCollected = 0;
    let totalPendingInvoices = 0;
    let totalArrearsAmount = 0;
    let gepgTransactionsCount = 0;

    const now = new Date();

    payments.forEach(p => {
      if (p.status === 'PAID') {
        totalRevenueCollected += (p.paidAmount || p.amount);
        if (p.controlNumber) gepgTransactionsCount++;
      } else {
        totalPendingInvoices += p.amount;
        if (new Date(p.dueDate) < now) {
          totalArrearsAmount += p.amount + (p.penaltyAmount || 0);
        }
      }
    });

    // 3. Maintenance Requests Overview
    const allMaintenance = await prisma.maintenanceRequest.findMany();
    const totalMaintenanceRequests = allMaintenance.length;
    const openMaintenance = allMaintenance.filter(m => m.status === 'OPEN' || m.status === 'ACKNOWLEDGED').length;
    const inProgressMaintenance = allMaintenance.filter(m => m.status === 'IN_PROGRESS').length;
    const resolvedMaintenance = allMaintenance.filter(m => m.status === 'RESOLVED' || m.status === 'CLOSED').length;
    const totalMaintenanceCost = allMaintenance.reduce((sum, m) => sum + (m.actualCost || m.estimatedCost || 0), 0);

    // 4. Regional Distribution
    const regionalMap = {};
    allUnits.forEach(u => {
      const reg = u.property?.region || 'Dar es Salaam';
      if (!regionalMap[reg]) {
        regionalMap[reg] = { region: reg, totalUnits: 0, occupiedUnits: 0, monthlyPotential: 0 };
      }
      regionalMap[reg].totalUnits += 1;
      if (u.status === 'OCCUPIED') regionalMap[reg].occupiedUnits += 1;
      regionalMap[reg].monthlyPotential += u.monthlyRent;
    });

    const regionalBreakdown = Object.values(regionalMap);

    // 5. Tenant Verification (NIDA)
    const totalTenants = await prisma.user.count({ where: { role: 'TENANT' } });
    const verifiedTenants = await prisma.user.count({ where: { role: 'TENANT', isNidaVerified: true } });
    const nidaVerificationRate = totalTenants > 0 ? Math.round((verifiedTenants / totalTenants) * 100) : 0;

    res.json({
      success: true,
      data: {
        occupancy: {
          totalProperties,
          totalUnits,
          occupiedUnits,
          availableUnits,
          maintenanceUnits,
          reservedUnits,
          occupancyRate
        },
        financials: {
          totalRevenueCollected,
          totalPendingInvoices,
          totalArrearsAmount,
          gepgTransactionsCount,
          collectionEfficiencyRate: (totalRevenueCollected + totalPendingInvoices) > 0 
            ? Math.round((totalRevenueCollected / (totalRevenueCollected + totalPendingInvoices)) * 100) 
            : 100
        },
        maintenance: {
          totalRequests: totalMaintenanceRequests,
          open: openMaintenance,
          inProgress: inProgressMaintenance,
          resolved: resolvedMaintenance,
          totalCost: totalMaintenanceCost,
          resolutionRate: totalMaintenanceRequests > 0 
            ? Math.round((resolvedMaintenance / totalMaintenanceRequests) * 100) 
            : 100
        },
        governance: {
          totalTenants,
          verifiedTenants,
          nidaVerificationRate
        },
        regionalBreakdown
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getExecutiveOverview };
