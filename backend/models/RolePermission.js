const mongoose = require('mongoose');

const rolePermissionSchema = new mongoose.Schema(
  {
    matrix: {
      type: Object,
      required: true,
      default: {},
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RolePermission', rolePermissionSchema);
