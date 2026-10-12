import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { AuthenticatedRequest, requireAuth } from '../middlewares/auth.middleware';
import { checkPermission } from '../types/auth';

const router = Router();

// GET /api/inventory
router.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const category = req.query.category as string;
  const alertOnly = req.query.alertOnly === 'true';

  try {
    const whereClause: any = {};
    if (category && category !== 'all') {
      whereClause.category = category;
    }

    const items = await prisma.inventoryItem.findMany({
      where: whereClause,
      orderBy: { name: 'asc' },
      include: {
        batches: {
          orderBy: { expirationDate: 'asc' },
        },
      },
    });

    const now = new Date();
    const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

    const itemsWithStatus = items.map((item) => {
      const isLowStock = item.currentStock <= item.minStockAlert;
      const isExpiringSoon = item.batches.some(
        (b) => new Date(b.expirationDate) <= in60Days && b.remainingQuantity > 0
      );
      const isExpired = item.batches.some(
        (b) => new Date(b.expirationDate) < now && b.remainingQuantity > 0
      );

      return {
        ...item,
        isLowStock,
        isExpiringSoon,
        isExpired,
      };
    });

    const filteredItems = alertOnly
      ? itemsWithStatus.filter((i) => i.isLowStock || i.isExpiringSoon || i.isExpired)
      : itemsWithStatus;

    const totalItems = items.length;
    const lowStockCount = itemsWithStatus.filter((i) => i.isLowStock).length;
    const expiringCount = itemsWithStatus.filter((i) => i.isExpiringSoon || i.isExpired).length;

    return res.json({
      items: filteredItems,
      metrics: {
        totalItems,
        lowStockCount,
        expiringCount,
      },
      canManage: checkPermission(user.role, 'canManageInventory'),
    });
  } catch (error) {
    console.error('Error al obtener inventario:', error);
    return res.status(500).json({ error: 'Error al consultar inventario' });
  }
});

// POST /api/inventory
router.post('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const canManage = checkPermission(user.role, 'canManageInventory');
  if (!canManage) {
    return res.status(403).json({
      error: `El rol ${user.role} no tiene permisos para crear insumos.`,
    });
  }

  try {
    const { name, code, category, unit, minStockAlert, initialStock, location, batchNumber, expirationDate } = req.body;

    if (!name || !code || !category || !unit) {
      return res.status(400).json({ error: 'Nombre, código, categoría y unidad son obligatorios' });
    }

    const existing = await prisma.inventoryItem.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (existing) {
      return res.status(409).json({ error: 'Ya existe un insumo con ese código/SKU' });
    }

    const stock = initialStock ? parseInt(initialStock) : 0;
    const minAlert = minStockAlert ? parseInt(minStockAlert) : 10;

    const newItem = await prisma.inventoryItem.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        category,
        unit,
        minStockAlert: minAlert,
        currentStock: stock,
        location: location ? location.trim() : null,
        batches:
          stock > 0 && batchNumber && expirationDate
            ? {
                create: [
                  {
                    batchNumber: batchNumber.trim(),
                    expirationDate: new Date(expirationDate),
                    initialQuantity: stock,
                    remainingQuantity: stock,
                  },
                ],
              }
            : undefined,
      },
      include: { batches: true },
    });

    if (stock > 0) {
      await prisma.inventoryMovement.create({
        data: {
          itemId: newItem.id,
          userId: user.id,
          type: 'INGRESO',
          quantity: stock,
          reference: 'Alta inicial de stock',
        },
      });
    }

    return res.status(201).json({ success: true, item: newItem });
  } catch (error) {
    console.error('Error al registrar insumo:', error);
    return res.status(500).json({ error: 'Error al registrar insumo' });
  }
});

// GET /api/inventory/movements
router.get('/movements', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const movements = await prisma.inventoryMovement.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        item: { select: { id: true, name: true, code: true, unit: true } },
        user: { select: { id: true, name: true, role: true } },
      },
    });

    return res.json({ movements });
  } catch (error) {
    console.error('Error al obtener movimientos:', error);
    return res.status(500).json({ error: 'Error al consultar movimientos' });
  }
});

// POST /api/inventory/movements
router.post('/movements', requireAuth, async (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const canManage = checkPermission(user.role, 'canManageInventory');
  if (!canManage) {
    return res.status(403).json({
      error: `El rol ${user.role} no tiene permisos para mover inventario.`,
    });
  }

  try {
    const { itemId, type, quantity, reference } = req.body;

    if (!itemId || !type || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Insumo, tipo y cantidad válida son requeridos' });
    }

    const item = await prisma.inventoryItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      return res.status(404).json({ error: 'Insumo no encontrado' });
    }

    const qty = parseInt(quantity);
    let newStock = item.currentStock;

    if (type === 'INGRESO') {
      newStock += qty;
    } else {
      if (item.currentStock < qty) {
        return res.status(400).json({
          error: `Stock insuficiente. Stock actual: ${item.currentStock} ${item.unit}. Solicitado: ${qty}.`,
        });
      }
      newStock -= qty;
    }

    const [movement, updatedItem] = await prisma.$transaction([
      prisma.inventoryMovement.create({
        data: {
          itemId,
          userId: user.id,
          type,
          quantity: qty,
          reference: reference ? reference.trim() : null,
        },
        include: {
          item: true,
          user: { select: { id: true, name: true, role: true } },
        },
      }),
      prisma.inventoryItem.update({
        where: { id: itemId },
        data: { currentStock: newStock },
      }),
    ]);

    return res.json({ success: true, movement, newStock: updatedItem.currentStock });
  } catch (error) {
    console.error('Error al registrar movimiento:', error);
    return res.status(500).json({ error: 'Error al registrar movimiento de stock' });
  }
});

export default router;
