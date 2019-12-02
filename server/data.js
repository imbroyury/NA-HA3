const path = require('path');
const fs = require('fs');
const util = require('util');
const etag = require('etag');
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

const PATH_TO_OPTIONS = path.join(__dirname, 'options.json');
const PATH_TO_SUBMISSIONS = path.join(__dirname, 'submissions.json');

const readJSON = async (path) => {
    const contents = await readFile(path, { encoding: 'utf8' });
    return JSON.parse(contents);
};

const writeJSON = async (path, contents) => {
    return writeFile(path, contents, { encoding: 'utf8'});
}

const getOptions = async () => {
    const options = await readJSON(PATH_TO_OPTIONS);
    return options;
};

const getItemCountMap = (array, keysToInclude) => {
    const seedMap = keysToInclude.reduce((map, key) => {
        map[key] = 0;
        return map;
    }, {});

    return array.reduce((map, item) => {
        if (keysToInclude.includes(item)) {
            map[item] = map[item] + 1;
        }
        return map;
    }, seedMap);
};

const getAvailableOptionKeys = async () => {
    const options = await getOptions();
    const keys = options.map(option => option.id);
    return keys;
}

const getIsOptionKeyAvailable = async (key) => {
    const availableKeys = await getAvailableOptionKeys();
    return availableKeys.includes(key);
}

const getVotingStatistics = async () => {
    const availableKeys = await getAvailableOptionKeys();
    const existing = await readJSON(PATH_TO_SUBMISSIONS);
    const map = getItemCountMap(existing, availableKeys);
    return map;
};

const getStatisticsEtag = async () => {
    const contents = await readFile(PATH_TO_SUBMISSIONS, { encoding: 'utf8' });
    return etag(contents);
};

const XML_START = '<?xml version="1.0" encoding="UTF-8" ?><root>';
const XML_END = '</root>';

const entryArrayToXML = array => array.reduce((xml, entry) => {
    const entryKeys = Object.keys(entry);
    const xmlKeys = entryKeys.map((key) => `<${key}>${entry[key]}</${key}>`);
    const xmlEntry = `<row>${xmlKeys.join('')}</row>`;
    return xml + xmlEntry;
}, XML_START) + XML_END;

const HTML_START = '<!doctype html><html><body>';
const HTML_END = '</body></html>';

const entryArrayToHTML = array => array.reduce((html, entry) => {
    const entryKeys = Object.keys(entry);
    const htmlKeys = entryKeys.map((key) => `<p>${key}: ${entry[key]}</p>`);
    const htmlEntry = `<div>${htmlKeys.join('')}</div>`;
    return html + htmlEntry;
}, HTML_START) + HTML_END;

const getStatisticsFile = async (fileType) => {
    const options = await getOptions();
    const stat = await getVotingStatistics();
    const entryArray = options.map(option => ({
        ...option,
        count: stat[option.id],
    }));

    switch(fileType) {
        case 'JSON': return JSON.stringify(entryArray);
        case 'XML': return entryArrayToXML(entryArray);
        case 'HTML': return entryArrayToHTML(entryArray);
    }
};

// very naive implementation
const writeVote = async (vote) => {
    const existing = await readJSON(PATH_TO_SUBMISSIONS);
    const modified = [...existing, vote];
    const json = JSON.stringify(modified, null, 2);
    return writeJSON(PATH_TO_SUBMISSIONS, json);
};

module.exports = {
    getOptions,
    writeVote,
    getVotingStatistics,
    getIsOptionKeyAvailable,
    getStatisticsFile,
    getStatisticsEtag,
};
