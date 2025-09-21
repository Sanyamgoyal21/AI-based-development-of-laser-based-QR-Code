// MongoDB initialization script
db = db.getSiblingDB('railqr');

// Create collections
db.createCollection('users');
db.createCollection('items');
db.createCollection('qrscanlogs');

// Create indexes for better performance
db.users.createIndex({ "username": 1 }, { unique: true });
db.items.createIndex({ "uuidToken": 1 }, { unique: true });
db.items.createIndex({ "createdBy": 1 });
db.qrscanlogs.createIndex({ "itemId": 1 });
db.qrscanlogs.createIndex({ "scannedBy": 1 });
db.qrscanlogs.createIndex({ "scannedAt": 1 });

// Create default admin user with properly hashed password
// Password: admin123 - hashed with bcrypt (salt rounds: 12)
db.users.insertOne({
  username: "admin",
  password: "$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi",
  fullName: "System Administrator",
  role: "admin",
  createdAt: new Date(),
  updatedAt: new Date()
});

// Create a sample worker user
// Password: worker123 - hashed with bcrypt (salt rounds: 12)
db.users.insertOne({
  username: "worker",
  password: "$2a$12$TKh8H1.PfQx37YgCzwiKb.KjNyWgaHb9cbcoQgdIVFlYg7B77UdFm",
  fullName: "Railway Worker",
  role: "worker",
  createdAt: new Date(),
  updatedAt: new Date()
});

print("Database initialized successfully!");
print("Default users created:");
print("- Admin: username='admin', password='admin123'");
print("- Worker: username='worker', password='worker123'");
