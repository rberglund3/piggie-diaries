// Get the mongoose object
import express from 'express';
import mongoose from 'mongoose';
import 'dotenv/config';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { randomUUID } from 'crypto';
import convertHeic from 'heic-convert';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'pets');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname) || '.jpg';
        cb(null, `${Date.now()}-${randomUUID()}${ext}`);
    }
});

const IMAGE_EXTENSIONS = /\.(jpe?g|png|gif|webp|heic|heif)$/i;

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        cb(null, /^image\//.test(file.mimetype) || IMAGE_EXTENSIONS.test(file.originalname));
    }
});

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// browsers can't render HEIC/HEIF, so convert iPhone photos to JPEG on upload
async function convertIfHeic(file) {
    if (!/\.(heic|heif)$/i.test(file.filename)) {
        return file.filename;
    }

    const inputBuffer = fs.readFileSync(file.path);
    const outputBuffer = await convertHeic({ buffer: inputBuffer, format: 'JPEG', quality: 0.9 });
    const newFilename = file.filename.replace(/\.(heic|heif)$/i, '.jpg');
    fs.writeFileSync(path.join(UPLOAD_DIR, newFilename), outputBuffer);
    fs.unlinkSync(file.path);
    return newFilename;
}

let connection = undefined;

/**
 * This function connects to the MongoDB server.
 */
async function connect(){
    try{
        await mongoose.connect(process.env.MONGODB_CONNECT_STRING);
        connection = mongoose.connection;
        console.log("Successfully connected to MongoDB using Mongoose!");
    } catch(err){
        console.log(err);
        throw Error(`Could not connect to MongoDB ${err.message}`)
    }
}

export { connect };

// define schema and model
const petSchema = new mongoose.Schema({
    owner: {
        type: String,
        required: true,
        index: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    color: {
        type: String,
        default: 'unknown'
    },
    age: {
        type: Number,
        default: 0
    },
    profileImage: {
        type: String,
        default: null
    },
    photos: {
        type: [String],
        default: []
    }
}, { timestamps: true });

petSchema.index({ owner: 1, name: 1 }, { unique: true });

const Pet = mongoose.model('Pet', petSchema);

// store weight data points
const metricSchema = new mongoose.Schema({
    owner: {
        type: String,
        required: true,
        index: true
    },
    petName: {
        type: String,
        required: true,
        index: true
    },
    type: {
        type: String,
        required: true,
        enum: ['weight']
    },
    value: {
        type: Number,
        required: true
    },
    unit: {
        type: String,
        default: 'g'
    },
    createdAt: {
        type: Date,
        immutable: false
    }
}, { timestamps: true });

const Metric = mongoose.model('Metric', metricSchema);

// curated foods and whether they're safe for guinea pigs
const foodSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    safety: {
        type: String,
        required: true,
        enum: ['safe', 'moderation', 'unsafe']
    },
    notes: {
        type: String,
        default: ''
    },
    portion: {
        type: String,
        default: ''
    },
    category: {
        type: String,
        default: 'other'
    }
}, { timestamps: true });

const Food = mongoose.model('Food', foodSchema);

async function seedFoodsIfEmpty() {
    const count = await Food.countDocuments();
    if (count === 0) {
        const seedData = (await import('./seed/foods.json', { with: { type: 'json' } })).default;
        await Food.insertMany(seedData);
        console.log(`Seeded ${seedData.length} foods`);
    }
}

function deletePetFiles(pet) {
    const files = [pet.profileImage, ...pet.photos].filter(Boolean);
    files.forEach(url => fs.unlink(path.join(process.cwd(), url), () => {}));
}

// middleware that requires a valid JWT in the Authorization header
function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

// ROUTES

//get all pets
app.get('/pet/all', requireAuth, async (req, res) => {
    try {
        const pets = await Pet.find({ owner: req.user.username });
        res.json(pets);
    } catch (err) {
        res.status(500).json({ error: "Could not fetch pets", details: err.message });
    }
});

// get metrics for a pet (or all pets, if name is omitted)
app.get('/pet/getHealth', requireAuth, async (req, res) => {
    try {
        const { name, type } = req.query;
        let filter = { owner: req.user.username };

        if (name) filter.petName = name;
        if (type) filter.type = type;

        const results = await Metric.find(filter).sort({ createdAt: -1 });
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: "Could not retrieve metrics", details: err.message });
    }
});

// get a single pet
app.get('/pet/:name', requireAuth, async (req, res) => {
    try {
        const pet = await Pet.findOne({ owner: req.user.username, name: req.params.name });
        if (!pet) {
            return res.status(404).json({ error: 'Pet not found' });
        }
        res.json(pet);
    } catch (err) {
        res.status(500).json({ error: "Could not fetch pet", details: err.message });
    }
});

// create pet
app.post('/pet/createPet', requireAuth, upload.single('profileImage'), async (req, res) => {
    try {
        const { Name, Color, Age } = req.body;
        const filename = req.file ? await convertIfHeic(req.file) : null;

        const newPet = new Pet({
            owner: req.user.username,
            name: Name,
            color: Color,
            age: Age,
            profileImage: filename ? `/uploads/pets/${filename}` : null
        });

        await newPet.save();
        res.status(201).json({ message: `Pet ${Name} created successfully`, pet: newPet });
    } catch (err) {
        res.status(400).json({ error: "Could not create pet", details: err.message });
    }
});

// add metric
app.post('/pet/addMetric', requireAuth, async (req, res) => {
    try {
        const pet = await Pet.findOne({ owner: req.user.username, name: req.body.Pet });
        if (!pet) {
            return res.status(404).json({ error: 'Pet not found' });
        }

        const newMetric = new Metric({
            owner: req.user.username,
            petName: req.body.Pet,
            type: req.body.Type,
            value: req.body.Value,
            unit: req.body.Unit || 'g'
        });

        const savedMetric = await newMetric.save();
        res.status(201).json(savedMetric);
    } catch (err) {
        res.status(400).json({ error: "Could not save metric", details: err.message });
    }
});

// update the date of a previously logged metric
app.patch('/pet/metric/:id', requireAuth, async (req, res) => {
    try {
        const metric = await Metric.findOne({ _id: req.params.id, owner: req.user.username });
        if (!metric) {
            return res.status(404).json({ error: 'Metric not found' });
        }
        metric.createdAt = new Date(req.body.createdAt);
        await metric.save();
        res.json(metric);
    } catch (err) {
        res.status(400).json({ error: "Could not update metric date", details: err.message });
    }
});

// set or replace a pet's profile picture
app.post('/pet/:name/profileImage', requireAuth, upload.single('profileImage'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image provided' });
        }
        const pet = await Pet.findOne({ owner: req.user.username, name: req.params.name });
        if (!pet) {
            return res.status(404).json({ error: 'Pet not found' });
        }
        const oldImage = pet.profileImage;
        const filename = await convertIfHeic(req.file);
        pet.profileImage = `/uploads/pets/${filename}`;
        await pet.save();
        if (oldImage) fs.unlink(path.join(process.cwd(), oldImage), () => {});
        res.json(pet);
    } catch (err) {
        res.status(400).json({ error: "Could not update profile picture", details: err.message });
    }
});

// add photos to a pet's gallery
app.post('/pet/:name/photos', requireAuth, upload.array('photos', 10), async (req, res) => {
    try {
        const urls = await Promise.all(req.files.map(async file => `/uploads/pets/${await convertIfHeic(file)}`));
        const pet = await Pet.findOneAndUpdate(
            { owner: req.user.username, name: req.params.name },
            { $push: { photos: { $each: urls } } },
            { new: true }
        );
        if (!pet) {
            return res.status(404).json({ error: 'Pet not found' });
        }
        res.status(201).json(pet);
    } catch (err) {
        res.status(400).json({ error: "Could not add photos", details: err.message });
    }
});

// remove a photo from a pet's gallery
app.delete('/pet/:name/photos', requireAuth, async (req, res) => {
    try {
        const { url } = req.body;
        const pet = await Pet.findOneAndUpdate(
            { owner: req.user.username, name: req.params.name },
            { $pull: { photos: url } },
            { new: true }
        );
        if (!pet) {
            return res.status(404).json({ error: 'Pet not found' });
        }
        fs.unlink(path.join(process.cwd(), url), () => {});
        res.json(pet);
    } catch (err) {
        res.status(400).json({ error: "Could not remove photo", details: err.message });
    }
});

// delete a pet
app.delete('/pet/:name', requireAuth, async (req, res) => {
    try {
        const { name } = req.params;

        const pet = await Pet.findOneAndDelete({ owner: req.user.username, name: name });
        if (pet) deletePetFiles(pet);
        await Metric.deleteMany({ owner: req.user.username, petName: name });

        res.status(200).json({ message: `Successfully deleted ${name}`});
    } catch (err) {
        res.status(500).json({ error: "Could not delete pet", details: err.message });
    }
});

// search foods for guinea pig safety
app.get('/food/search', async (req, res) => {
    try {
        const { q } = req.query;
        const filter = q ? { name: { $regex: q, $options: 'i' } } : {};
        const results = await Food.find(filter).sort({ name: 1 }).limit(100);
        res.json(results);
    } catch (err) {
        res.status(500).json({ error: "Could not search foods", details: err.message });
    }
});

// login route
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ username });
        const passwordMatches = user && await bcrypt.compare(password, user.password);
        if (passwordMatches) {
            const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET, { expiresIn: '2h' });
            res.json({ message: 'Login successful', username: user.username, token });
        } else {
            res.status(401).json({ error: 'Invalid username or password' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

// register route
app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

connect().then(async () => {
    await seedFoodsIfEmpty();
    await Pet.syncIndexes();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
