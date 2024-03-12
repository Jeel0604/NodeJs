const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const port = 4200;



app.use(cors({
    origin: 'https://cute-red-fox-tie.cyclic.app'
}));
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:4200');
    next();
});
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
    title: String,
    description: String,
    completed: Boolean,
    date: String

}, { collection: "CollectionTodo" });

const Todo = mongoose.model('Todo', todoSchema);

app.get('/api/todos', async (req, res) => {
    try {
        const todos = await Todo.find();
        res.json(todos);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
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
        const newTodo = new Todo({
            title: newTodoData.title,
            description: newTodoData.description,
            completed: newTodoData.completed || false,
            date: newTodoData.date || currentDate,
        });

        const savedTodo = await newTodo.save();

        res.status(201).json(savedTodo);

        console.log("Data added:", savedTodo);
    } catch (error) {
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

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});