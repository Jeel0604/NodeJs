const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();
const port = 4200;



app.use(cors({
    origin: ['http://localhost:4200', 'https://cute-red-fox-tie.cyclic.app']
}));

app.use(bodyParser.json());
app.use(express.json());


const DB_URL = `mongodb+srv://ToDOapp:JeelPatel@cluster0.8cdouox.mongodb.net/TodoDatabase`;

mongoose.connect(DB_URL, {
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('MongoDB database connection established successfully');
});

const todoSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' }, // Reference to Users collection
    title: String,
    description: String,
    completed: Boolean,
    date: String
}, { collection: "CollectionTodo" });



const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    email: String
}, { collection: "Users" });

const todos = [];
const Todo = mongoose.model('Todo', todoSchema);
const Users = mongoose.model('Users', userSchema);


app.get('/api/users', async (req, res) => {
    try {
        const users = await Users.find();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.get('/api/todos', async (req, res) => {
    try {
        const userId = req.user.userId; // Assuming userId is available in req.user after authentication

        const todos = await Todo.find({ userId: userId });
        res.json(todos);
    } catch (error) {
        console.error('Error fetching todos:', error);
        res.status(500).json({ error: 'Failed to fetch todos' });
    }
});


function getCurrentDate() {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const day = String(currentDate.getDate()).padStart(2, '0');

    const formattedDate = `${year}-${month}-${day}`;

    return formattedDate;
}


app.post('/api/todos', async (req, res) => {
    try {
        const newTodoData = req.body;
        const currentDate = getCurrentDate();

        const userId = req.user.userId;

        const newTodo = new Todo({
            userId: userId,
            title: newTodoData.title,
            description: newTodoData.description,
            completed: newTodoData.completed || false,
            date: newTodoData.date || currentDate,
        });

        const savedTodo = await newTodo.save();
        res.status(201).json(savedTodo);

        console.log("Data added:", savedTodo);
    } catch (error) {
        // Handle errors
        console.error("Error saving todo:", error);
        res.status(500).json({ error: 'Failed to save todo' });
    }
});


app.get('/api/todos/:id', async (req, res) => {
    const todoId = req.params.id;

    try {

        const todo = await Todo.findOne({ _id: todoId });

        if (!todo) {
            return res.status(404).json({ error: 'Todo not found' });
        }

        res.json(todo);

        console.log('Todo retrieved successfully:', todo);
    } catch (error) {
        console.error('Error fetching todo:', error);
        res.status(500).json({ error: 'Failed to fetch todo' });
    }
});


app.put('/api/todos/:id', async (req, res) => {
    const todoId = req.params.id;
    const updatedTodoData = req.body;

    try {

        const updatedTodo = await Todo.findByIdAndUpdate(todoId, updatedTodoData);

        if (!updatedTodo) {
            return res.status(404).json({ error: 'Todo not found' });
        }

        res.json(updatedTodo);

        console.log('Todo updated successfully:', updatedTodo);
    } catch (error) {
        console.error('Error updating todo:', error);
        res.status(500).json({ error: 'Failed to update todo' });
    }
});

app.delete('/api/todos/:id', async (req, res) => {
    const todoId = req.params.id;
    try {

        if (!todoId) {
            return res.status(404).json({ error: 'Todo not found' });
        }
        const deletedTodo = await Todo.deleteOne({ _id: todoId });

        res.json(deletedTodo);

        console.log('Todo Deleted successfully:', deletedTodo);
    } catch (error) {
        console.error('Error updating todo:', error);
        res.status(500).json({ error: 'Failed to update todo' });
    }
});


// Registration
app.post('/api/register', async (req, res) => {
    try {
        const { username, password, email } = req.body;

        // Check if the username or email already exists
        const existingUser = await Users.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 5);

        // Create new user
        const newUser = new Users({ username, password: hashedPassword, email });

        await newUser.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
});

// Login
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if the user exists
        const user = await Users.findOne({ username });
        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Check if the password is correct
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Generate JWT token
        const token = jwt.sign({ userId: user._id }, 'jeel', { expiresIn: '1h' });

        res.json({ token });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Failed to login' });
    }
});



app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});