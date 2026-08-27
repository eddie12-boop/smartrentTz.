const prisma = require('../prismaClient');

const getProperties = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      search, 
      region, 
      district, 
      propertyType, 
      minRent, 
      maxRent,
      bedrooms,
      bathrooms,
      status,
      minLat,
      maxLat,
      minLng,
      maxLng
    } = req.query;

    const isLimitAll = limit === 'all';
    const take = isLimitAll ? undefined : parseInt(limit);
    const skip = isLimitAll ? undefined : (parseInt(page) - 1) * take;

    // Build filter
    const where = {};
    if (status) {
      where.status = status;
    } else {
      where.status = 'PUBLISHED'; // default for public view
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { address: { contains: search } }
      ];
    }
    if (region) where.region = region;
    if (district) where.district = district;
    if (propertyType) where.propertyType = propertyType;

    if (minLat || maxLat || minLng || maxLng) {
      where.latitude = {};
      where.longitude = {};
      if (minLat) where.latitude.gte = parseFloat(minLat);
      if (maxLat) where.latitude.lte = parseFloat(maxLat);
      if (minLng) where.longitude.gte = parseFloat(minLng);
      if (maxLng) where.longitude.lte = parseFloat(maxLng);
    }

    // We can filter by units if rent, beds, baths are specified
    const unitFilters = {};
    if (minRent) unitFilters.monthlyRent = { gte: parseFloat(minRent) };
    if (maxRent) {
      if (!unitFilters.monthlyRent) unitFilters.monthlyRent = {};
      unitFilters.monthlyRent.lte = parseFloat(maxRent);
    }
    if (bedrooms) unitFilters.bedrooms = { gte: parseInt(bedrooms) };
    if (bathrooms) unitFilters.bathrooms = { gte: parseInt(bathrooms) };

    if (Object.keys(unitFilters).length > 0) {
      where.units = {
        some: unitFilters
      };
    }

    const properties = await prisma.property.findMany({
      where,
      ...(take && { skip, take }),
      include: {
        images: true,
        units: {
          select: {
            monthlyRent: true,
            bedrooms: true,
            bathrooms: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.property.count({ where });

    res.json({
      success: true,
      data: {
        properties,
        pagination: {
          total,
          page: isLimitAll ? 1 : parseInt(page),
          pages: isLimitAll ? 1 : Math.ceil(total / take)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

const getProperty = async (req, res, next) => {
  try {
    const { id } = req.params;
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        images: true,
        units: true,
        amenities: {
          include: { amenity: true }
        },
        owner: {
          select: { firstName: true, lastName: true, phone: true, profileImage: true }
        },
        agent: {
          select: { firstName: true, lastName: true, phone: true, profileImage: true }
        }
      }
    });

    if (!property) {
      return res.status(404).json({
        success: false,
        message: 'Property not found'
      });
    }

    res.json({ success: true, data: { property } });
  } catch (error) {
    next(error);
  }
};

const createProperty = async (req, res, next) => {
  try {
    const { title, description, propertyType, address, region, district, ward, latitude, longitude } = req.body;
    
    // For landlord/agent
    const ownerId = req.user.role === 'LANDLORD' ? req.user.id : req.body.ownerId;
    const agentId = req.user.role === 'AGENT' ? req.user.id : req.body.agentId;

    // Handle images
    const imageFiles = req.files || [];
    const imagesData = imageFiles.map((file, index) => ({
      url: `http://localhost:5000/uploads/${file.filename}`,
      isPrimary: index === 0, // First image is primary
      sortOrder: index
    }));

    const property = await prisma.property.create({
      data: {
        title,
        description,
        propertyType,
        address,
        region,
        district,
        ward,
        latitude: latitude ? parseFloat(latitude) : null,
        longitude: longitude ? parseFloat(longitude) : null,
        ownerId,
        agentId,
        status: 'PENDING_APPROVAL',
        images: {
          create: imagesData
        }
      },
      include: {
        images: true
      }
    });

    res.status(201).json({
      success: true,
      data: { property },
      message: 'Property created successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProperties,
  getProperty,
  createProperty
};
