/**
 * Network
 */ 
const getVotingOptions = async () => {
    const response = await fetch('/variants');
    const json = await response.json();
    return json;
};

const getStatistics = async () => {
    const response = await fetch('/stat');
    const json = await response.json();
    return json;
};

const submitVote = async (vote) => {
    return fetch('/vote', {
        method: 'POST',
        body: JSON.stringify({ vote }),
         headers: {
            'Content-Type': 'application/json',
        },
    });
};

/**
 * DOM
 */
const getVotingLabel = option => {
    const label = document.createElement('div');
    label.textContent = option.description;
    return label;
};

const getVotingButton = option => {
    const button = document.createElement('button');
    button.dataset.optionId = option.id;
    button.textContent = `Vote`;
    return button;
};

const buttonClickHandler = async (e) => {
    const { target } = e;
    const { tagName } = target;
    if (tagName.toLowerCase() !== 'button') return;

    await submitVote(target.dataset.optionId);

    const [options, statistics] = await Promise.all([getVotingOptions(), getStatistics()]);

    updateStatistics(options, statistics);
};

const initVotingOptions = options => {
    const optionsWrapper = document.getElementById('options');

    const optionsElements = options.map(option => {
        const wrapper = document.createElement('div');
        wrapper.classList.add('option-wrapper');
        const label = getVotingLabel(option);
        const button = getVotingButton(option);
        [label, button].forEach(el => wrapper.appendChild(el));
        return wrapper;
    });

    optionsElements.forEach((optionElement) => optionsWrapper.appendChild(optionElement));

    optionsWrapper.addEventListener('click', buttonClickHandler);
}

const getStatisticsEntry = (description, result) => {
    const li = document.createElement('li');
    li.textContent = `${description}: ${result}`;
    return li;
};

const updateStatistics = async (options, statistics) => {
    const listWrapper = document.createElement('ul');
    const entries = options.map(option => getStatisticsEntry(option.description, statistics[option.id]));
    entries.forEach(entry => listWrapper.appendChild(entry));
    
    const statisticsWrapper = document.getElementById('statistics');
    while (statisticsWrapper.firstChild) { statisticsWrapper.firstChild.remove(); }
    statisticsWrapper.appendChild(listWrapper);
}

/**
 * Entry point
 */
(async () => {
    const options = await getVotingOptions();
    const statistics = await getStatistics();
    
    initVotingOptions(options);
    updateStatistics(options, statistics);
})();
