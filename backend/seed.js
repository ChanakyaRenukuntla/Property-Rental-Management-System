const mongoose = require('mongoose');

// Load models
const User = require('./models/User');
const Property = require('./models/Property');
const Payment = require('./models/Payment');
const Maintenance = require('./models/Maintenance');
const Message = require('./models/Message');
const BookingRequest = require('./models/BookingRequest');

async function seed() {
    try {
        console.log('Connecting to database...');
        await mongoose.connect('mongodb://127.0.0.1:27017/propease');
        console.log('Connected. Clearing existing data...');

        await User.deleteMany({});
        await Property.deleteMany({});
        await Payment.deleteMany({});
        await Maintenance.deleteMany({});
        await Message.deleteMany({});
        await BookingRequest.deleteMany({});

        console.log('Seeding Users...');

        // Plain password here — the User model's pre('save') hook hashes it automatically.
        const owner = await User.create({
            name: 'PropEase Admin Owner',
            email: 'owner@gmail.com',
            password: 'password123',
            role: 'owner',
            phone: '555-0100'
        });

        const tenant = await User.create({
            name: 'Bob Tenant',
            email: 'tenant@gmail.com',
            password: 'password123',
            role: 'tenant',
            phone: '555-0200'
        });

        console.log('Seeding Real-World Mock Properties...');

        const mockLocations = [
            { title: 'Koramangala PG', city: 'Bangalore', type: 'villa', lat: 12.9352, lng: 77.6245, rent: 15000 },
            { title: 'Indiranagar Premium Studio', city: 'Bangalore', type: 'studio', lat: 12.9719, lng: 77.6412, rent: 18000 },
            { title: 'Andheri West Villa', city: 'Mumbai', type: 'villa', lat: 19.1363, lng: 72.8277, rent: 45000 },
            { title: 'Bandra Bandstand Apartment', city: 'Mumbai', type: 'apartment', lat: 19.0558, lng: 72.8227, rent: 55000 },
            { title: 'Hauz Khas Student Housing', city: 'Delhi', type: 'apartment', lat: 28.5494, lng: 77.2001, rent: 12000 },
            { title: 'Vasant Vihar Mansion', city: 'Delhi', type: 'villa', lat: 28.5583, lng: 77.1593, rent: 60000 },
            { title: 'Koregaon Park Studio', city: 'Pune', type: 'studio', lat: 18.5362, lng: 73.8939, rent: 20000 },
            { title: 'Viman Nagar Hostel', city: 'Pune', type: 'apartment', lat: 18.5679, lng: 73.9143, rent: 10000 },
            { title: 'T-Nagar Central Villa', city: 'Chennai', type: 'villa', lat: 13.0418, lng: 80.2341, rent: 35000 },
            { title: 'Adyar River View Apartment', city: 'Chennai', type: 'apartment', lat: 13.0033, lng: 80.2555, rent: 25000 },
            { title: 'Banjara Hills Retreat', city: 'Hyderabad', type: 'villa', lat: 17.4169, lng: 78.4385, rent: 40000 },
            { title: 'Gachibowli Tech PG', city: 'Hyderabad', type: 'apartment', lat: 17.4401, lng: 78.3489, rent: 8000 }
        ];

        for (const loc of mockLocations) {
            await Property.create({
                owner: owner._id,
                title: loc.title,
                description: 'A great ' + loc.type + ' located right in the heart of ' + loc.city + '.',
                address: { street: 'Main Road', city: loc.city, state: 'State' },
                location: { lat: loc.lat, lng: loc.lng },
                type: loc.type,
                rent: loc.rent,
                deposit: loc.rent * 2,
                bedrooms: loc.type === 'studio' ? 1 : 2,
                bathrooms: 1,
                area: loc.rent / 20,
                amenities: ['WiFi', 'AC', 'Parking'],
                paymentOptions: ['UPI', 'Netbanking'],
                status: 'available',
                currentTenant: null
            });
        }

        console.log('✅ Database seeded successfully!');
        console.log('----------------------------------------------------');
        console.log('You can now log in with:');
        console.log('Owner  -> email: owner@gmail.com | password: password123');
        console.log('Tenant -> email: tenant@gmail.com | password: password123');
        console.log('----------------------------------------------------');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding database:', err);
        process.exit(1);
    }
}

seed();
