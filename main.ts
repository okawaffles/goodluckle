import express from 'express';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const app = express();
app.set('views', join(__dirname, 'web'));
app.set('view engine', 'ejs');
app.use(express.static(join(__dirname, 'web', 'assets')));
app.use('/.proxy', express.static(join(__dirname, 'web', 'assets')));
app.use('/pwa', express.static(join(__dirname, 'web', 'pwa')));

app.use((req, res, next) => {
    let IPAddress: string | undefined = 'IP Unavailable';

    // cloudflare proxies include this header, must use or else get a cloudflare IP 
    if (req.headers['x-forwarded-for'])
        IPAddress = (req.headers['x-forwarded-for'] as string).split(',')[0];
    else
        IPAddress = req.ip as string;

    if (IPAddress.startsWith('::ffff:')) IPAddress = IPAddress.split('::ffff:')[1];

    console.log(`${IPAddress} ${req.method} ${req.originalUrl}`);
    next();
});

const all_words = readFileSync(join(__dirname, 'assets', 'picks.txt'), 'utf-8').split('\n').map(word => word.trim());

app.get('/', (req, res) => {
    res.render('game');
});

// eg: POST /validate?word=beans&date=2025-07-06
// @ts-ignore
app.post('/validate', (req, res) => {
    if (!req.query || !req.query.word) return res.status(400).end();
    if (!req.query.date) return res.status(400).end();

    const date = (<string>req.query.date).split('-');
    if (isNaN(parseInt(date[0])) || isNaN(parseInt(date[1])) || isNaN(parseInt(date[2]))) return res.status(400).end();

    const f = new Date(date.join('-'));
    const n = new Date('2025-07-06'); // game started on july 6th 2025
    const diff = f.getTime() - n.getTime();
    const days_since = Math.floor(diff / 86400000) + 1;

    res.json({ result: wordleCompare(req.query.word as string, getWordOnDate(req.query.date as string)), day: days_since });
});

// @ts-ignore FUCK YOU
app.get('/solution', (req, res) => {
    const dt = (<string>req.query.date).split('-');
    if (isNaN(parseInt(dt[0])) || isNaN(parseInt(dt[1])) || isNaN(parseInt(dt[2]))) return res.status(400).end();

    res.json({ word: getWordOnDate(req.query.date as string, false) });
});

function getWordOnDate(date: string, create: boolean = true) {
    // console.log(date);
    // date ex: 2025-07-06 YYYY-MM-DD
    const history = JSON.parse(readFileSync(join(__dirname, 'solutions.json'), 'utf-8'));
    if (history[date]) return history[date];

    if (!create) return '?????';

    history[date] = all_words[Math.floor(Math.random() * (all_words.length + 1)) - 1];
    writeFileSync(join(__dirname, 'solutions.json'), JSON.stringify(history));
    return history[date];
}

function wordleCompare(guess: string, solution: string) {
    const result = Array(guess.length).fill('x');
    const used = Array(guess.length).fill(false);

    // First pass: correct letters (green -> 'c')
    for (let i = 0; i < guess.length; i++) {
        if (guess[i] === solution[i]) {
            result[i] = 'c';
            used[i] = true; // Mark this position as used
        }
    }

    // Second pass: misplaced letters (yellow -> 'm')
    for (let i = 0; i < guess.length; i++) {
        if (result[i] === 'x') {
            for (let j = 0; j < solution.length; j++) {
                if (!used[j] && guess[i] === solution[j]) {
                    result[i] = 'm';
                    used[j] = true;
                    break;
                }
            }
        }
    }

    return result.join('');
}

app.listen(80);