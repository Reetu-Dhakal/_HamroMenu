import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config({ path: new URL('../../.env', import.meta.url) });

import config from '../config/index.js';
import Restaurant from '../models/Restaurant.js';
import Table from '../models/Table.js';
import QRCode from '../models/QRCode.js';
import Category from '../models/Category.js';
import MenuItem from '../models/MenuItem.js';
import Customer from '../models/Customer.js';
import Staff from '../models/Staff.js';
import KitchenStaff from '../models/KitchenStaff.js';
import Admin from '../models/Admin.js';
import Coupon from '../models/Coupon.js';
import QRCodeLib from 'qrcode';

const img = (id, w = 600, h = 400) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&h=${h}&fit=crop&auto=format&q=70`;

const images = {
  momo: img('1546069901-ba9599a7e63c'),
  chowmein: img('1585032226651-759b368d7246'),
  dalbhat: img('1547592180-85f173990554'),
  thukpa: img('1504674900247-0877df9cc836'),
  chicken: img('1604503468506-a8da13d82791'),
  paneer: img('1631452180519-c014fe946bc7'),
  burger: img('1568901346375-23c9450c58cd'),
  pizza: img('1513104890138-7c749659a591'),
  fries: img('1573080496219-bb080dd4f877'),
  momo2: img('1563245372-f21724e3856d'),
  salad: img('1512621776951-a57141f2eefd'),
  dessert: img('1551024506-0bccd828d307'),
  drink: img('1544145945-f90425340c7e'),
  coffee: img('1495474472287-4d71bcdd2085'),
  naan: img('1601050690597-df0568f70950'),
  curry: img('1631452180519-c014fe946bc7'),
  fish: img('1580476262798-bddd9f4b7369'),
  roll: img('1626700051175-6818013e1d4f'),
  special: img('1540189549336-e6e99c3679fe'),
  biryani: img('1565299624946-b28f40a0ae38'),
};

const dishFallback = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop&auto=format&q=70';

async function hash(pw) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(pw, salt);
}

const now = new Date();
const hoursFor = (day, open, close) => ({
  day,
  open,
  close,
  closed: false,
});

async function seed() {
  const shouldReset = process.argv.includes('--reset');
  if (shouldReset) {
    const cols = await mongoose.connection.db.listCollections().toArray();
    for (const c of cols) {
      await mongoose.connection.db.dropCollection(c.name);
    }
    console.log('Dropped all collections');
  } else {
    const existing = await Restaurant.countDocuments();
    if (existing > 0) {
      console.log('Database already seeded. Use `npm run seed:reset` to reseed.');
      await mongoose.disconnect();
      process.exit(0);
    }
  }

  console.log('Seeding HamroMenu demo data...');

  const restaurant = await Restaurant.create({
    name: 'Himalayan Flavors',
    slug: 'himalayan-flavors',
    tagline: 'Taste the mountains, one plate at a time',
    description:
      'A contemporary Nepali kitchen serving hand-made momos, soul-warming thukpa and mountain classics with a modern twist.',
    cuisine: ['Nepali', 'Asian', 'Momo', 'Thukpa'],
    address: { street: '12 Thamel Marg', city: 'Kathmandu', state: 'Bagmati', country: 'Nepal', zip: '44600' },
    contact: { phone: '+977-1-4412345', email: 'hello@himalayanflavors.com', website: 'himalayanflavors.com' },
    logoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&h=200&fit=crop&auto=format&q=70',
    coverUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&h=800&fit=crop&auto=format&q=80',
    currency: 'NPR',
    taxRate: 0.13,
    serviceChargeRate: 0.1,
    operatingHours: [
      hoursFor('monday', '09:00', '22:00'),
      hoursFor('tuesday', '09:00', '22:00'),
      hoursFor('wednesday', '09:00', '22:00'),
      hoursFor('thursday', '09:00', '22:00'),
      hoursFor('friday', '09:00', '23:00'),
      hoursFor('saturday', '10:00', '23:00'),
      hoursFor('sunday', '10:00', '22:00'),
    ],
  });

  const categories = await Category.create([
    { restaurant: restaurant._id, name: 'Steamed & Fried Momo', description: 'Our famous dumplings', displayOrder: 1, imageUrl: images.momo },
    { restaurant: restaurant._id, name: 'Noodles & Chowmein', description: 'Wok-tossed favorites', displayOrder: 2, imageUrl: images.chowmein },
    { restaurant: restaurant._id, name: 'Dal Bhat & Rice', description: 'Hearty mountain plates', displayOrder: 3, imageUrl: images.dalbhat },
    { restaurant: restaurant._id, name: 'Soups & Thukpa', description: 'Warm bowls of comfort', displayOrder: 4, imageUrl: images.thukpa },
    { restaurant: restaurant._id, name: 'Grills & Curries', description: 'Charred & spiced', displayOrder: 5, imageUrl: images.chicken },
    { restaurant: restaurant._id, name: 'Sides & Breads', description: 'To share or to savor', displayOrder: 6, imageUrl: images.naan },
    { restaurant: restaurant._id, name: 'Drinks & Desserts', description: 'Sweet endings & cool sips', displayOrder: 7, imageUrl: images.drink },
  ]);

  const cat = (name) => categories.find((c) => c.name === name)?._id;

  const itemsData = [
    { name: 'Chicken Steam Momo', category: 'Steamed & Fried Momo', price: 320, description: '10 hand-pleated dumplings, chicken & scallion, served with fiery tomato achar.', prep: 12, veg: false, popular: true, featured: true, img: images.momo, spice: 'medium' },
    { name: 'Buff Steam Momo', category: 'Steamed & Fried Momo', price: 300, description: '10 juicy buffalo dumplings with ginger-garlic dip.', prep: 12, veg: false, popular: true, img: images.momo2, spice: 'medium' },
    { name: 'Veg Steam Momo', category: 'Steamed & Fried Momo', price: 260, description: '10 vegetable & paneer dumplings, light and fragrant.', prep: 12, veg: true, img: images.momo, spice: 'mild' },
    { name: 'Fried Chicken Momo', category: 'Steamed & Fried Momo', price: 360, description: 'Golden-crisp momo tossed in garlic-chili butter.', prep: 15, veg: false, featured: true, img: images.momo2, spice: 'hot' },
    { name: 'Kothey Momo', category: 'Steamed & Fried Momo', price: 380, description: 'Pan-seared dumplings with a sizzling sesame crust.', prep: 15, veg: false, img: images.momo, spice: 'medium' },
    { name: 'Veg Chowmein', category: 'Noodles & Chowmein', price: 240, description: 'Wok-tossed noodles, seasonal veggies, soy-garlic glaze.', prep: 10, veg: true, popular: true, img: images.chowmein, spice: 'mild' },
    { name: 'Chicken Chowmein', category: 'Noodles & Chowmein', price: 290, description: 'Egg noodles, chicken strips, spring onion & sesame.', prep: 10, veg: false, popular: true, featured: true, img: images.chowmein, spice: 'medium' },
    { name: 'Buff Chowmein', category: 'Noodles & Chowmein', price: 280, description: 'The classic street favorite, loaded with buffalo.', prep: 10, veg: false, img: images.chowmein, spice: 'medium' },
    { name: 'Schezwan Chowmein', category: 'Noodles & Chowmein', price: 320, description: 'Fiery schezwan sauce, crispy garlic, extra wok-hei.', prep: 12, veg: false, img: images.chowmein, spice: 'hot' },
    { name: 'Chicken Choila Naanwich', category: 'Noodles & Chowmein', price: 350, description: 'Spiced grilled choila stuffed in charred naan.', prep: 12, veg: false, img: images.roll, spice: 'hot' },
    { name: 'Dal Bhat Power Set', category: 'Dal Bhat & Rice', price: 450, description: 'The classic: dal, rice, seasonal tarkari, achar & papad. Fuel for the day.', prep: 15, veg: true, popular: true, featured: true, img: images.dalbhat, spice: 'mild' },
    { name: 'Chicken Sekuwa Rice', category: 'Dal Bhat & Rice', price: 480, description: 'Charred sekuwa chicken over steamed rice, spicy jhol.', prep: 18, veg: false, img: images.chicken, spice: 'hot' },
    { name: 'Khasi Ko Masu', category: 'Dal Bhat & Rice', price: 520, description: 'Slow-cooked goat curry with garlic rice.', prep: 20, veg: false, img: images.curry, spice: 'medium' },
    { name: 'Mushroom Pulao', category: 'Dal Bhat & Rice', price: 330, description: 'Fragrant basmati with mushrooms, peas & ghee.', prep: 15, veg: true, img: images.biryani, spice: 'mild' },
    { name: 'Chicken Thukpa', category: 'Soups & Thukpa', price: 340, description: 'Tibetan noodle soup, ginger broth, chicken, vegetables.', prep: 12, veg: false, popular: true, img: images.thukpa, spice: 'medium' },
    { name: 'Veg Thukpa', category: 'Soups & Thukpa', price: 300, description: 'Slurp-worthy broth, noodles, seasonal greens.', prep: 12, veg: true, img: images.thukpa, spice: 'mild' },
    { name: 'Beef Chilli Momo Soup', category: 'Soups & Thukpa', price: 400, description: 'Momo in a rich chili-garlic broth, topped with scallion.', prep: 15, veg: false, img: images.soup || images.thukpa, spice: 'hot' },
    { name: 'Chicken Sekuwa Platter', category: 'Grills & Curries', price: 650, description: 'Jumbo platter of chargrilled chicken, mint chutney & onion salad.', prep: 22, veg: false, featured: true, img: images.chicken, spice: 'hot' },
    { name: 'Butter Paneer Curry', category: 'Grills & Curries', price: 420, description: 'Silky tomato-makhani gravy, house paneer, fenugreek.', prep: 15, veg: true, popular: true, img: images.paneer, spice: 'mild' },
    { name: 'Chicken Tikka', category: 'Grills & Curries', price: 460, description: 'Charred yogurt-marinated chicken, tandoor smoke.', prep: 18, veg: false, img: images.chicken, spice: 'medium' },
    { name: 'Grilled Fish Curry', category: 'Grills & Curries', price: 540, description: 'River fish in tangy mustard-tomato curry.', prep: 18, veg: false, img: images.fish, spice: 'medium' },
    { name: 'Garlic Naan', category: 'Sides & Breads', price: 120, description: 'Tandoor-baked, brushed with garlic butter.', prep: 8, veg: true, popular: true, img: images.naan, spice: 'mild' },
    { name: 'Butter Naan', category: 'Sides & Breads', price: 100, description: 'Soft, pillowy, brushed with butter.', prep: 8, veg: true, img: images.naan, spice: 'mild' },
    { name: 'Mixed Salad', category: 'Sides & Breads', price: 180, description: 'Crisp leaves, cucumber, tomato & tangy achar dressing.', prep: 6, veg: true, img: images.salad, spice: 'mild' },
    { name: 'French Fries', category: 'Sides & Breads', price: 220, description: 'Golden fries with chili-salt dusting.', prep: 8, veg: true, img: images.fries, spice: 'mild' },
    { name: 'Masala Lemonade', category: 'Drinks & Desserts', price: 150, description: 'Fresh lime, roasted cumin, black salt & mint.', prep: 4, veg: true, img: images.drink, spice: 'mild' },
    { name: 'Lassi (Sweet/Salt)', category: 'Drinks & Desserts', price: 180, description: 'Thick churned yogurt drink.', prep: 4, veg: true, popular: true, img: images.drink, spice: 'mild' },
    { name: 'Himalayan Chiya', category: 'Drinks & Desserts', price: 120, description: 'Spiced milk tea with cardamom & ginger.', prep: 6, veg: true, img: images.coffee, spice: 'mild' },
    { name: 'Juju Dhau', category: 'Drinks & Desserts', price: 200, description: 'The royal Bhaktapur yogurt, set in a clay pot.', prep: 2, veg: true, img: images.dessert, spice: 'mild' },
    { name: 'Sel Roti', category: 'Drinks & Desserts', price: 90, description: 'Crispy ring-shaped rice bread, dusted with sugar.', prep: 8, veg: true, img: images.dessert, spice: 'mild' },
  ];

  const items = [];
  for (const it of itemsData) {
    items.push(
      await MenuItem.create({
        restaurant: restaurant._id,
        category: cat(it.category),
        name: it.name,
        description: it.description,
        price: it.price,
        imageUrl: it.img,
        prepTimeMinutes: it.prep,
        isVeg: it.veg,
        isFeatured: it.featured,
        isPopular: it.popular,
        spiceLevel: it.spice,
        tags: it.name.toLowerCase().split(' '),
        orderCount: Math.floor(Math.random() * 300) + 20,
      })
    );
  }

  const tables = [];
  for (let i = 1; i <= 12; i++) {
    const area = i <= 4 ? 'Terrace' : i <= 8 ? 'Main Hall' : 'Garden';
    tables.push(
      await Table.create({
        restaurant: restaurant._id,
        label: `T${i}`,
        number: i,
        capacity: [2, 2, 4, 4, 2, 4, 6, 6, 4, 4, 8, 8][i - 1],
        area,
        status: 'free',
      })
    );
  }

  for (const table of tables) {
    const payload = JSON.stringify({ restaurantId: restaurant._id.toString(), tableId: table._id.toString(), tableNumber: table.number, token: `seed-${table.number}` });
    const target = `${config.clientUrl}/order?r=${restaurant._id}&t=${table._id}`;
    const dataUrl = await QRCodeLib.toDataURL(target, { width: 256, margin: 1 });
    const qr = await QRCode.create({
      restaurant: restaurant._id,
      table: table._id,
      payload,
      dataUrl,
    });
    await Table.updateOne({ _id: table._id }, { qrCode: qr._id });
  }

  const pwd = 'password123';
  const [adminPw, staffPw, kitchenPw, customerPw] = await Promise.all([hash(pwd), hash(pwd), hash(pwd), hash(pwd)]);

  await Admin.create({
    name: 'Ramesh Shrestha',
    email: 'admin@himalayanflavors.com',
    phone: '+977-9800000001',
    password: adminPw,
    role: 'admin',
  });

  const staff = await Staff.create({
    name: 'Prakash Tamang',
    email: 'staff@himalayanflavors.com',
    phone: '+977-9800000002',
    password: staffPw,
    role: 'staff',
    restaurant: restaurant._id,
    staffRole: 'waiter',
  });

  const kitchen = await KitchenStaff.create({
    name: 'Suresh Gurung',
    email: 'kitchen@himalayanflavors.com',
    phone: '+977-9800000003',
    password: kitchenPw,
    role: 'kitchen',
    restaurant: restaurant._id,
    station: 'main',
  });

  const [customer1, customer2] = await Promise.all([
    Customer.create({
      name: 'Anita Rai',
      email: 'customer@himalayanflavors.com',
      phone: '+977-9800000004',
      password: customerPw,
      role: 'customer',
      favorites: [items[0]._id, items[5]._id, items[10]._id],
    }),
    Customer.create({
      name: 'Demo Customer',
      email: 'demo@hamromenu.com',
      phone: '+977-9800000005',
      password: customerPw,
      role: 'customer',
    }),
  ]);

  await Coupon.create([
    { restaurant: restaurant._id, code: 'WELCOME10', discountType: 'percentage', discountValue: 10, maxDiscount: 200, minOrder: 500, description: '10% off your first order over NPR 500' },
    { restaurant: restaurant._id, code: 'MOMO50', discountType: 'flat', discountValue: 50, minOrder: 400, description: 'NPR 50 off any order over NPR 400' },
    { restaurant: restaurant._id, code: 'FEAST20', discountType: 'percentage', discountValue: 20, maxDiscount: 500, minOrder: 1500, description: '20% off big group orders over NPR 1500' },
  ]);

  console.log('Seeding complete!');
  console.log('-------------------------------------');
  console.log('Demo accounts (password: password123):');
  console.log(`  Admin:   admin@himalayanflavors.com`);
  console.log(`  Staff:   staff@himalayanflavors.com`);
  console.log(`  Kitchen: kitchen@himalayanflavors.com`);
  console.log(`  Customer: customer@himalayanflavors.com`);
  console.log(`  Customer: demo@hamromenu.com`);
  console.log(`Restaurant: ${restaurant.slug} (${restaurant._id})`);
  console.log('-------------------------------------');

  await mongoose.disconnect();
}

connectAndSeed();

async function connectAndSeed() {
  try {
    await mongoose.connect(config.mongoUri);
    await seed();
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}