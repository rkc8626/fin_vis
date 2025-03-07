const bodyParser = require('body-parser');
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = 3000;

// Connect to the SQLite database
const db = new sqlite3.Database('交易记录.db');

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint to query the database
app.get('/dates', async (req, res) => {
  const startDate = req.query.startDate;
  const endDate = req.query.endDate;

  const query = `
    SELECT 商户名, 单次货品估值, 收费日期
    FROM 场内交易记录
    WHERE 收费日期 BETWEEN ? AND ?
    ORDER BY 收费日期 DESC
  `;

  // Execute the query with the provided start and end dates
  db.all(query, [startDate, endDate], (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.json(rows);
    }
  });
});

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));

// Endpoint to update scores in the database
app.post('/updateScores', express.json(), async (req, res) => {
  const scores = req.body;
  const query = `
    UPDATE 商户记录
    SET ScoreF = $scoreF, ScoreR = $scoreR, ScoreM = $scoreM, Score = $score, updateTime = $updateTime, lastTime = $lastTime
    WHERE 商户名 = $商户名
  `;

  try {
    await db.serialize(() => {
      scores.forEach(async (score) => {
        await db.run(query, {
          $scoreF: score.ScoreF,
          $scoreR: score.ScoreR,
          $scoreM: score.ScoreM,
          $score: score.Score,
          $updateTime: score.updateTime,
          $lastTime: score.lastTime,
          $商户名: score.商户名,
        });
      });
    });

    res.sendStatus(200);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



app.get('/scores', async (req, res) => {
  const query = `
    SELECT 商户名, Score, ScoreR, ScoreF, ScoreM
    FROM 商户记录
    WHERE Score IS NOT NULL
    ORDER BY Score DESC
  `;

  // Execute the query
  db.all(query, (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    } else {
      res.json(rows);
    }
  });
});


app.get('/search', async (req, res) => {
  const 商户名 = req.query.商户名;

  const 商户记录Query = `
    SELECT *
    FROM 商户记录
    WHERE 商户名 = ?
    LIMIT 1
  `;

  const 场内交易记录Query = `
    SELECT *
    FROM 场内交易记录
    WHERE 商户名 = ?
    ORDER BY 收费日期 DESC
  `;

  // Execute the queries with the provided 商户名
  try {
    const 商户记录 = await new Promise((resolve, reject) => {
      db.get(商户记录Query, [商户名], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });

    const 场内交易记录 = await new Promise((resolve, reject) => {
      db.all(场内交易记录Query, [商户名], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });

    res.json({
      商户记录,
      场内交易记录
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});





// Serve the index.html file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
