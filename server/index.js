const express = require('express');
const bodyParser = require('body-parser')
const server = express();
const {
    getOptions,
    writeVote,
    getVotingStatistics,
    getIsOptionKeyAvailable,
    getStatisticsFile,
    getStatisticsEtag,
} = require('./data.js');

const PORT = 8280;

server.use(bodyParser.urlencoded({extended:true}));
server.use(bodyParser.json());
server.use(express.static('public'));

server.get('/variants', async (req, res) => {
    const options = await getOptions();
    res.send(options);
});

server.get('/stat', async (req, res) => {
    const [stat, etag] = await Promise.all([getVotingStatistics(), getStatisticsEtag()]);
    res.setHeader("Cache-Control", "max-age=0"); 
    res.setHeader('ETag', etag);
    res.send(stat);
});

const contentTypeHeaderMap = {
    'JSON': 'application/json',
    'XML': 'text/xml',
    'HTML': 'text/html',
};

server.get('/dl-stat', async (req, res) => {
    const { fileType } = req.query;
    if (!Object.keys(contentTypeHeaderMap).includes(fileType)) {
        return res.status(400).send('Unsupported file type');
    }
    res.setHeader('Content-Disposition', 'attachment');
    res.setHeader('Content-Type', contentTypeHeaderMap[fileType]);
    const stat = await getStatisticsFile(fileType);
    res.send(stat);
});

server.post('/vote', async (req, res) => {
    const { vote: optionKey } = req.body;
    const isVoteValid = await getIsOptionKeyAvailable(optionKey);
    if (isVoteValid) {
        await writeVote(optionKey);
        res.send('OK');
    } else {
        res.status(400).send('Invalid voting submission');
    }
});

server.listen(PORT, () => console.log(`Accepting votes on ${PORT} ...`));