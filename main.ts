import express from 'express';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const app = express();
app.set('views', join(__dirname, 'web'));
app.set('view engine', 'ejs');
app.use(express.static(join(__dirname, 'web', 'assets')));

const all_words = readFileSync(join(__dirname, 'assets', 'picks.txt'), 'utf-8').split('\n').map(word => word.trim());

app.get('/', (req, res) => {
    res.render('game');
});

// eg: POST /validate?word=beans&date=2025-07-06
// @ts-ignore
app.post('/validate', (req, res) => {
    if (!req.query || !req.query.word) return res.status(400).end();
    if (!req.query.date) return res.status(400).end();

    const date = (<string> req.query.date).split('-');
    if (isNaN(parseInt(date[0])) || isNaN(parseInt(date[1])) || isNaN(parseInt(date[2]))) return res.status(400).end();

    const f = new Date(date.join('-'));
    const n = new Date();
    const diff = n.getTime() - f.getTime();
    const days_since = Math.floor(diff / 86400000);

    res.json({result:wordleCompare(req.query.word as string, getWordOnDate(req.query.date as string)),day:days_since});
});


function getWordOnDate(date: string) {
    // date ex: 2025-07-06 YYYY-MM-DD
    const history = JSON.parse(readFileSync(join(__dirname, 'solutions.json'), 'utf-8'));
    if (history[date]) return history[date];

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

app.listen(3000);