const express = require('express');
const sql =  require('./db.js')
const cors = require('cors');
const path = require('path');

// routes
// const userRoutes = require('./routes/userRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// routes use
// app.use('/api/users', userRoutes);

app.listen(3000,async()=>{
    try {
        await sql.getConnection();
        console.log("Database connection is successful");
    } catch (error) {
        console.log(error)
    }
})