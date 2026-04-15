class VendorApplication {
  constructor(db) {
    this.collection = db.collection("vendorApplications");
  }

  async applyVendor(vendorData) {
    const vendorApplicant = await this.collection.insertOne(vendorData);

    return vendorApplicant;
  }

  async findVendorByUserId(id) {
    const vendor = await this.collection.findOne({ userId: id });
    return vendor;
  }

  async findbVendorApplicationById(id) {
    return await this.collection.findOne({ _id: id });
  }

  async updateVendorApplication(id, status) {
    return await this.collection.updateOne(
      { _id: id },
      {
        $set: {
          "verification.verified_at": Date.now(),
          "verification.status": status,
        },
      },
    );
  }

  async deleteVendorApplicat(id) {
    await this.collection.deleteOne({ _id: id });
  }
}

// class Vendor extends VendorApplication {
//   constructor(db) {
//     super(db);
//     this.collection = db.collection("vendors");
//   }

//   async createVendor(vendorData) {
//     return await this.collection.insertOne(vendorData);
//   }

//   async findByVendorId(id) {
//     return await this.collection.findOne({ userId: id });
//   }

//   async findVendorOrderByParent(parenOrderId) {
//     return await this.collection
//       .find({
//         parent_order_id: parenOrderId,
//       })
//       .toArray();
//   }
//   /**
//    * Get Vendor Dashboard Overview - AGGREGATION
//    * @param {ObjectId} vendorId
//    * @returns {Promise<Object>}
//    */
//   async getVendorDashboardOverview(vendorId) {
//     const todayStart = new Date();
//     todayStart.setHours(0, 0, 0, 0);

//     const sevenDaysAgo = new Date();
//     sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

//     const pipeline = [
//       { $match: { userId: vendorId } },

//       {
//         $facet: {
//           stats: [
//             {
//               $group: {
//                 _id: null,
//                 totalOrders: { $sum: 1 },
//                 totalSales: { $sum: "$total" },
//                 avgOrderValue: { $avg: "$total" },
//                 pendingOrders: {
//                   $sum: {
//                     $cond: [{ $eq: ["$order_status", "pending"] }, 1, 0],
//                   },
//                 },
//                 pendingSettlementAmount: {
//                   $sum: {
//                     $cond: [
//                       { $in: ["$order_status", ["pending", "processing"]] },
//                       "$total",
//                       0,
//                     ],
//                   },
//                 },
//               },
//             },
//           ],

//           todayOrders: [
//             { $match: { created_at: { $gte: todayStart } } },
//             { $count: "count" },
//           ],

//           sevenDaySales: [
//             { $match: { created_at: { $gte: sevenDaysAgo } } },
//             {
//               $group: {
//                 _id: {
//                   $dateToString: { format: "%Y-%m-%d", date: "$created_at" },
//                 },
//                 totalSales: { $sum: "$total" },
//                 orderCount: { $sum: 1 },
//               },
//             },
//             { $sort: { _id: 1 } },
//           ],

//           recentOrders: [
//             { $sort: { created_at: -1 } },
//             { $limit: 5 },
//             {
//               $project: {
//                 _id: 1,
//                 total: 1,
//                 order_status: 1,
//                 podStatus: 1,
//                 payment: 1,
//                 created_at: 1,
//               },
//             },
//           ],

//           topProducts: [
//             { $unwind: "$products" },
//             {
//               $group: {
//                 _id: "$products.productId",
//                 name: { $first: "$products.name" },
//                 totalSold: { $sum: "$products.quantity" },
//                 revenue: {
//                   $sum: {
//                     $multiply: [
//                       "$products.priceAtPurchase",
//                       "$products.quantity",
//                     ],
//                   },
//                 },
//               },
//             },
//             { $sort: { revenue: -1 } },
//             { $limit: 5 },
//           ],

//           ordersByStatus: [
//             {
//               $group: {
//                 _id: "$order_status",
//                 count: { $sum: 1 },
//                 revenue: { $sum: "$total" },
//               },
//             },
//           ],

//           podStats: [
//             {
//               $group: {
//                 _id: "$podStatus",
//                 count: { $sum: 1 },
//               },
//             },
//           ],
//         },
//       },

//       {
//         $project: {
//           totalOrders: { $arrayElemAt: ["$stats.totalOrders", 0] },
//           totalSales: { $arrayElemAt: ["$stats.totalSales", 0] },
//           avgOrderValue: {
//             $round: [{ $arrayElemAt: ["$stats.avgOrderValue", 0] }, 0],
//           },
//           todayOrders: { $arrayElemAt: ["$todayOrders.count", 0] },
//           pendingOrders: { $arrayElemAt: ["$stats.pendingOrders", 0] },
//           pendingSettlementAmount: {
//             $arrayElemAt: ["$stats.pendingSettlementAmount", 0],
//           },

//           sevenDaySales: 1,
//           recentOrders: 1,
//           topProducts: 1,
//           ordersByStatus: 1,
//           podStats: 1,
//         },
//       },
//     ];

//     const result = await this.collection.aggregate(pipeline).toArray();

//     return (
//       result[0] || {
//         totalOrders: 0,
//         totalSales: 0,
//         avgOrderValue: 0,
//         todayOrders: 0,
//         pendingOrders: 0,
//         pendingSettlementAmount: 0,
//         sevenDaySales: [],
//         recentOrders: [],
//         topProducts: [],
//         ordersByStatus: [],
//         podStats: [],
//       }
//     );
//   }

// }

// models/Vendor.js

class Vendor extends VendorApplication {
  constructor(db) {
    super(db);
    this.collection = db.collection("vendors");
    this.orderCollection = db.collection("orders"); // Important: Reference to orders collection
  }

  async createVendor(vendorData) {
    return await this.collection.insertOne(vendorData);
  }

  async findByVendorId(id) {
    return await this.collection.findOne({ userId: id });
  }

  async findVendorOrderByParent(parentOrderId) {
    return await this.collection
      .find({ parent_order_id: parentOrderId })
      .toArray();
  }

  /**
   * Get Vendor Dashboard Overview - AGGREGATION
   * @param {ObjectId} userId   // Note: We receive userId, then find vendor _id
   * @returns {Promise<Object>}
   */
  async getVendorDashboardOverview(userId) {
    try {

      // Step 1: Find the vendor document to get its real _id
      const vendorDoc = await this.collection.findOne({ userId: userId });

      if (!vendorDoc) {
        return this.getEmptyDashboardData();
      }

      const vendorRealId = vendorDoc._id;

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const pipeline = [
        { $match: { vendor_id: vendorRealId } }, // Use the correct vendor _id

        {
          $facet: {
            stats: [
              {
                $group: {
                  _id: null,
                  totalOrders: { $sum: 1 },
                  totalSales: { $sum: "$total" },
                  avgOrderValue: { $avg: "$total" },
                  pendingOrders: {
                    $sum: {
                      $cond: [{ $eq: ["$order_status", "pending"] }, 1, 0],
                    },
                  },
                  pendingSettlementAmount: {
                    $sum: {
                      $cond: [
                        { $in: ["$order_status", ["pending", "processing"]] },
                        "$total",
                        0,
                      ],
                    },
                  },
                },
              },
            ],

            todayOrders: [
              { $match: { created_at: { $gte: todayStart } } },
              { $count: "count" },
            ],

            sevenDaySales: [
              { $match: { created_at: { $gte: sevenDaysAgo } } },
              {
                $group: {
                  _id: {
                    $dateToString: { format: "%Y-%m-%d", date: "$created_at" },
                  },
                  totalSales: { $sum: "$total" },
                  orderCount: { $sum: 1 },
                },
              },
              { $sort: { _id: 1 } },
            ],

            recentOrders: [
              { $sort: { created_at: -1 } },
              { $limit: 5 },
              {
                $project: {
                  _id: 1,
                  total: 1,
                  order_status: 1,
                  podStatus: 1,
                  payment: 1,
                  created_at: 1,
                },
              },
            ],

            topProducts: [
              { $unwind: "$products" },
              {
                $group: {
                  _id: "$products.productId",
                  name: { $first: "$products.name" },
                  totalSold: { $sum: "$products.quantity" },
                  revenue: {
                    $sum: {
                      $multiply: [
                        "$products.priceAtPurchase",
                        "$products.quantity",
                      ],
                    },
                  },
                },
              },
              { $sort: { revenue: -1 } },
              { $limit: 5 },
            ],

            ordersByStatus: [
              {
                $group: {
                  _id: "$order_status",
                  count: { $sum: 1 },
                  revenue: { $sum: "$total" },
                },
              },
            ],

            podStats: [
              {
                $group: {
                  _id: "$podStatus",
                  count: { $sum: 1 },
                },
              },
            ],
          },
        },

        {
          $project: {
            totalOrders: {
              $ifNull: [{ $arrayElemAt: ["$stats.totalOrders", 0] }, 0],
            },
            totalSales: {
              $ifNull: [{ $arrayElemAt: ["$stats.totalSales", 0] }, 0],
            },
            avgOrderValue: {
              $round: [
                { $ifNull: [{ $arrayElemAt: ["$stats.avgOrderValue", 0] }, 0] },
                0,
              ],
            },
            todayOrders: {
              $ifNull: [{ $arrayElemAt: ["$todayOrders.count", 0] }, 0],
            },
            pendingOrders: {
              $ifNull: [{ $arrayElemAt: ["$stats.pendingOrders", 0] }, 0],
            },
            pendingSettlementAmount: {
              $ifNull: [
                { $arrayElemAt: ["$stats.pendingSettlementAmount", 0] },
                0,
              ],
            },

            sevenDaySales: 1,
            recentOrders: 1,
            topProducts: 1,
            ordersByStatus: 1,
            podStats: 1,
          },
        },
      ];

      const result = await this.orderCollection.aggregate(pipeline).toArray();

      return result[0] || this.getEmptyDashboardData();
    } catch (error) {
      console.error("Error in getVendorDashboardOverview:", error);
      return this.getEmptyDashboardData();
    }
  }

  // Helper method for empty data
  getEmptyDashboardData() {
    return {
      totalOrders: 0,
      totalSales: 0,
      avgOrderValue: 0,
      todayOrders: 0,
      pendingOrders: 0,
      pendingSettlementAmount: 0,
      sevenDaySales: [],
      recentOrders: [],
      topProducts: [],
      ordersByStatus: [],
      podStats: [],
    };
  }
}

module.exports = Vendor;

module.exports = { VendorApplication, Vendor };
