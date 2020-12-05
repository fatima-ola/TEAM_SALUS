import express from 'express';
import bodyParser from 'body-parser';
import { MongoClient } from 'mongodb';
import path from 'path';

const app = express();

//app.use(express.static(path.join(__dirname, '/build')));
app.use(bodyParser.json());

app.get('/api/analytics/', async (req, res) => {
        try {
        const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true });
        const db = client.db('my-project');
        const analyticsInfo = await db.collection('analytics').find({ 'type': 'analytics' }).toArray()
        res.status(200).json(analyticsInfo);
        client.close()
        } catch (error) {
            res.status(500).json({ message: 'Error connecting to db', error });
        }
       
    })


const withDB = async (operations, res) => {
    try {
        const client = await MongoClient.connect('mongodb://localhost:27017', { useNewUrlParser: true });
        const db = client.db('my-project');
    
        await operations(db);
    
        client.close();
    } catch (error) {
        res.status(500).json({ message: 'Error connecting to db', error });
    }
}

app.get('/api/analytics/:name', async (req, res) => {
    withDB(async (db) => {
        const articleName = req.params.name;

        const articleInfo = await db.collection('analytics').findOne({ name: articleName })
        res.status(200).json(articleInfo);
    }, res);
})

app.post('/api/analytics/:name/like', async (req, res) => {
    withDB(async (db) => {
        const articleName = req.params.name;
    
        const articleInfo = await db.collection('analytics').findOne({ name: articleName });
        await db.collection('analytics').updateOne({ name: articleName }, {
            '$set': {
                likes: articleInfo.likes + 1,
            },
        });
        const updatedArticleInfo = await db.collection('analytics').findOne({ name: articleName });
    
        res.status(200).json(updatedArticleInfo);
    }, res);
});

app.post('/api/analytics/:name/add-comment', (req, res) => {
    const { username, text } = req.body;
    const articleName = req.params.name;

    withDB(async (db) => {
        const articleInfo = await db.collection('analytics').findOne({ name: articleName });
        await db.collection('analytics').updateOne({ name: articleName }, {
            '$set': {
                comments: articleInfo.comments.concat({ username, text }),
            },
        });
        const updatedArticleInfo = await db.collection('analytics').findOne({ name: articleName });

        res.status(200).json(updatedArticleInfo);
    }, res);
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/build/index.html'));
});

app.listen(8000, () => console.log('Listening on port 8000'));