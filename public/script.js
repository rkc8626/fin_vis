window.addEventListener('load', init);

function init() {
  var clearButton = id("clearButton");
  submitButton = document.querySelector("button[type='submit']");
  saveButton = document.querySelector("button#saveButton");
  colorBar = id("colorBar");

  startDateInput = id("startDate");
  dateAInput = id("dateA");
  dateBInput = id("dateB");
  endDateInput = id("endDate");
  fRInput = id("fR");
  fFInput = id("fF");
  fMInput = id("fM");
  tAbInput = id("tAb");
  tBcInput = id("tBc");
  tOtherInput = id("tOther");

  startDateInput.addEventListener("change", updateColorBar);
  dateAInput.addEventListener("change", updateColorBar);
  dateBInput.addEventListener("change", updateColorBar);
  endDateInput.addEventListener("change", updateColorBar);
  fRInput.addEventListener("input", updateColorBar);
  fFInput.addEventListener("input", updateColorBar);
  fMInput.addEventListener("input", updateColorBar);
  tAbInput.addEventListener("input", updateColorBar);
  tBcInput.addEventListener("input", updateColorBar);
  tOtherInput.addEventListener("input", updateColorBar);

  submitButton.addEventListener("click", function (event) {
    showMessage('Loading…… May Take a Whlie');
    var resultTable = id("resultTable");
    resultTable.innerHTML = "";
    event.preventDefault();
    displayResults()
    resultSection.classList.remove("hidden");
    clearResults()
  });

  saveButton.addEventListener("click", function (event) {
    event.preventDefault();
    var endDate = endDateInput.value;
    saveScores(endDate);
  });

  chartButton.addEventListener("click", function (event) {
    event.preventDefault();
    fetchScores();
    clearResults();
    showMessage('Loading……');
    chartSection.classList.remove("hidden");
    pieSection.classList.remove("hidden");
  });

  clearButton.addEventListener("click", function (event) {
    event.preventDefault();
    clearResults();
  });

  searchButton.addEventListener("click", function (event) {
    event.preventDefault();
    var 商户名 = id("searchInput").value;
    toggleSectionVisibility(searchSection, resultSection);

    searchRecords(商户名);
  });

  backButton.addEventListener("click", function (event) {
    toggleSectionVisibility(resultSection, searchSection);
  });

  id("toggleButton").onclick = function() {
    var optionDiv = id("option");
    if (optionDiv.classList.contains("hidden")) {
      optionDiv.classList.remove("hidden");
    } else {
      optionDiv.classList.add("hidden");
    }
  };

  id("settingsButton").onclick = function() {
    var optionDiv = id("settings");
    if (optionDiv.classList.contains("hidden")) {
      optionDiv.classList.remove("hidden");
    } else {
      optionDiv.classList.add("hidden");
    }
  };

  updateColorBar();
}

function clearResults() {
  var resultTable = id("resultTable");
  resultTable.innerHTML = "";
  resultSection.classList.add("hidden");

  chartSection.classList.add("hidden");
  var chartCanvas = id("barChart");
  var chartContainer = chartCanvas.parentNode;
  chartContainer.removeChild(chartCanvas);
  chartContainer.innerHTML = '<canvas id="barChart"></canvas>';

  pieSection.classList.add("hidden");
  var pieCanvas = id("pieChart");
  var pieContainer = pieCanvas.parentNode;
  pieContainer.removeChild(pieCanvas);
  pieContainer.innerHTML = '<canvas id="pieChart"></canvas>';
  pieSection.classList.add("hidden");
}

function toggleSectionVisibility(showSection, hideSection) {
  showSection.classList.remove("hidden");
  hideSection.classList.add("hidden");
}

function mergeResults() {
  var startDate = startDateInput.value;
  var dateA = dateAInput.value;
  var dateB = dateBInput.value;
  var endDate = endDateInput.value;
  var tAb = tAbInput.value;
  var tBc = tBcInput.value;
  var tOther = tOtherInput.value;

  // Initialize alldata as an empty array
  var alldata = [];

  // Fetch data from different sources
  var dataAB = fetchData(dateB, endDate, tAb);
  var dataBC = fetchData(dateA, dateB, tBc);
  var dataOther = fetchData(startDate, dateA, tOther);
  var dataall = fetchRecency(startDate, endDate);

  // Resolve promises and merge the data
  return Promise.all([dataAB, dataBC, dataOther, dataall]).then(results => {
    // Iterate over the results
    results.forEach(data => {
      // Merge the data into alldata
      data.forEach(item => {
        var existingItem = alldata.find(i => i.商户名 === item.商户名);

        if (existingItem) {
          // If the item already exists in alldata, update the scores and 收费日期
          existingItem.score_R += item.score_R;
          existingItem.score_F += item.score_F;
          existingItem.score_M += item.score_M;
          existingItem.score += item.score;

          // Update 收费日期 if item.收费日期 is newer
          if (item.收费日期 > existingItem.收费日期) {
            existingItem.收费日期 = item.收费日期;
          }
        } else {
          // If the item doesn't exist in alldata, add it
          alldata.push(item);
        }
      });
    });

    alldata = normalizeScores(alldata);
    return alldata;

  }).catch(error => {
    // Handle any errors during data fetching or merging
    showMessage('An error occurred:', error);
  });
}

function normalizeScores(alldata) {
  // Find the minimum and maximum scores in the dataset
  var [minScore, minScoreR, minScoreF, minScoreM] = Array(4).fill(Infinity);
  var [maxScore, maxScoreR, maxScoreF, maxScoreM] = Array(4).fill(-Infinity);

  alldata.forEach(item => {
    minScore = Math.min(minScore, item.score);
    maxScore = Math.max(maxScore, item.score);
    minScoreR = Math.min(minScoreR, item.score_R);
    maxScoreR = Math.max(maxScoreR, item.score_R);
    minScoreF = Math.min(minScoreF, item.score_F);
    maxScoreF = Math.max(maxScoreF, item.score_F);
    minScoreM = Math.min(minScoreM, item.score_M);
    maxScoreM = Math.max(maxScoreM, item.score_M);
  });

  // Normalize the scores
  alldata.forEach(item => {
    // Normalize using the formula: normalized_score = (score - minScore) / (maxScore - minScore))
    item.score = (item.score - minScore) * (100 / (maxScore - minScore));
    item.score_R = (item.score_R - minScoreR) * (100 / (maxScoreR - minScoreR));
    item.score_F = (item.score_F - minScoreF) * (100 / (maxScoreF - minScoreF));
    item.score_M = (item.score_M - minScoreM) * (100 / (maxScoreM - minScoreM));

  });

  return alldata;
}

function displayResults() {
  var resultTable = id("resultTable");

  // Clear the existing content of the resultTable
  resultTable.innerHTML = "";

  // Call the mergeResults function to get the merged data
  mergeResults().then(mergedData => {
    mergedData.forEach((item, index) => {
      var span = gen("p");
      var count = gen("h3");

      var searchButton = gen("button");
      searchButton.textContent = "View History";
      searchButton.addEventListener("click", function () {
        searchRecords(item.商户名);
        toggleSectionVisibility(searchSection, resultSection);
      });

      var displayIndex = index + 1;
      count.textContent = `${displayIndex.toString()}`
      span.textContent = `商户名: ${item.商户名} 最后日期: ${item.收费日期} score_R: ${item.score_R.toString()} score_F: ${item.score_F.toString()} score_M: ${item.score_M.toString()} score: ${item.score.toString()}`;
      count.appendChild(searchButton);

      resultTable.appendChild(count);
      resultTable.appendChild(span);
    });
    showMessage('Loading Results…')
  }).catch(error => {
    showMessage('An error occurred:', error);
  });
}

function fetchData(startDate, endDate, index) {
  return fetch(`/dates?startDate=${startDate}&endDate=${endDate}`)
    .then(response => response.json())
    .then(data => {
      return calculatingData(data, index); // Return the result
    })
    .catch(error => {
      showMessage(error);
      alert("An error occurred while calculating scores.");
    });
}

function fetchRecency(startDate, endDate) {
  return fetch(`/dates?startDate=${startDate}&endDate=${endDate}`)
    .then(response => response.json())
    .then(data => {
      return calcualatingRecency(data); // Return the result
    })
    .catch(error => {
      showMessage(error);
      alert("An error occurred while calculating scores.");
    });
}

function calcualatingRecency(data) {
  var minDaysMap = {};
  var displayedMerchants = new Set();

  var records = []; // Variable to store the records

  data.forEach(item => {
    var 商户名 = item.商户名;
    var days = getDaysBetweenDates(item.收费日期, endDateInput.value);

    if (!minDaysMap[商户名] || days < minDaysMap[商户名]) {
      minDaysMap[商户名] = days;
    }
  });

  data.forEach(item => {
    var 商户名 = item.商户名;

    if (displayedMerchants.has(商户名)) {
      return;
    }

    if (getDaysBetweenDates(item.收费日期, endDateInput.value) === minDaysMap[商户名]) {
      var score_R = fRInput.value * parseInt(getDaysBetweenDates(item.收费日期, endDateInput.value));
      var score_F = 0;
      var score_M = 0;

      var score = parseInt(score_F - score_R + score_M);

      displayedMerchants.add(商户名);

      // Store the record in the array
      records.push({
        商户名: item.商户名,
        收费日期: item.收费日期,
        score_R: score_R,
        score_F: score_F,
        score_M: score_M,
        score: score
      });
    }
  });

  // Return the records
  return records;

}

function calculatingData(data, index) {
  var minDaysMap = {};
  var displayedMerchants = new Set();

  var records = []; // Variable to store the records

  data.forEach(item => {
    var 商户名 = item.商户名;
    var days = getDaysBetweenDates(item.收费日期, endDateInput.value);

    if (!minDaysMap[商户名] || days < minDaysMap[商户名]) {
      minDaysMap[商户名] = days;
    }
  });

  data.forEach(item => {
    var 商户名 = item.商户名;

    if (displayedMerchants.has(商户名)) {
      return;
    }

    if (getDaysBetweenDates(item.收费日期, endDateInput.value) === minDaysMap[商户名]) {
      var score_R = fRInput.value * 0;
      var score_F = fFInput.value * parseInt(countOccurrences(data, item.商户名));
      var score_M = fMInput.value * parseInt(sumEstimationValues(data, item.商户名));

      var score = parseInt(index * (score_F - score_R + score_M));

      displayedMerchants.add(商户名);

      // Store the record in the array
      records.push({
        商户名: item.商户名,
        收费日期: item.收费日期,
        score_R: score_R,
        score_F: score_F,
        score_M: score_M,
        score: score
      });
    }
  });

  // Return the records
  return records;
}

function countOccurrences(data, 商户名) {
  var count = 0;
  data.forEach(item => {
    if (item.商户名 === 商户名) {
      count++;
    }
  });
  return count;
}

function getDaysBetweenDates(date1, date2) {
  var oneDay = 24 * 60 * 60 * 1000;
  var startDate = new Date(date1);
  var endDate = new Date(date2);
  var diffDays = Math.round(Math.abs((startDate - endDate) / oneDay));
  return diffDays;
}

function sumEstimationValues(data, 商户名) {
  var sum = 0;
  data.forEach(item => {
    if (item.商户名 === 商户名) {
      sum += parseInt(item.单次货品估值);
    }
  });
  return sum;
}

function saveScores(endDate) {
  const spans = document.querySelectorAll('#resultTable p');

  const scores = [];
  spans.forEach((span) => {
    const data = span.textContent.split(/\s+/);
    const 商户名 = data[1];
    const lastTime = data[3];
    const updateTime = endDate;
    const score_R = parseFloat(data[5]);
    const score_F = parseFloat(data[7]);
    const score_M = parseFloat(data[9]);
    const score = parseFloat(data[11]);

    scores.push({
      商户名,
      lastTime,
      updateTime,
      ScoreF: score_F,
      ScoreR: score_R,
      ScoreM: score_M,
      Score: score,
    });
  });

  fetch('/updateScores', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(scores),
  })
    .then((response) => {
      if (response.ok) {
        showMessage('Scores saved successfully!');
      } else {
        throw new Error('Error saving scores');
      }
    })
    .catch((error) => {
      showMessage(error);
    });
}

function fetchScores() {
  fetch('/scores')
    .then(response => response.json())
    .then(data => {
      displayChart(data);
      displayPieChart(data);
    })
    .catch(error => {
      showMessage(error);
    });
}

function displayChart(data) {
  var chartData = {
    labels: [],
    datasets: [
      {
        label: 'Score',
        backgroundColor: 'rgba(255, 215, 0, 0.5)',
        data: []
      },
      {
        label: 'ScoreR',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        data: [],
        hidden: true
      },
      {
        label: 'ScoreF',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        data: [],
        hidden: true
      },
      {
        label: 'ScoreM',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        data: [],
        hidden: true
      },
    ]
  };

  data.forEach(item => {
    var score = item.Score.toFixed(4); // Round to four decimal places
    chartData.labels.push(`${item.商户名}\nScore: ${score}`);
    chartData.datasets[0].data.push(parseFloat(score));
    chartData.datasets[1].data.push(-item.ScoreR);
    chartData.datasets[2].data.push(item.ScoreF);
    chartData.datasets[3].data.push(item.ScoreM);
  });

  var chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Bar Chart of all Merchants'
      },
      zoom: {
        zoom: {
          wheel: {
            enabled: true
          },
          mode: 'x',
        }
      }
    }
  };

  var ctx = id('barChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: chartData,
    options: chartOptions,
    plugins: [ChartZoom]
  });
}

function displayPieChart(data) {
  var chartData = {
    labels: ['重要价值容户', '高价值容户', '重要潜力客户', '高潜力客户', '深耕客户', '唤回容户', '一般客户'],
    datasets: [
      {
        label: 'Score',
        backgroundColor: [
          'rgba(255, 215, 0, 0.5)',
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(255, 0, 0, 0.5)',
          'rgba(0, 255, 0, 0.5)',
          'rgba(0, 0, 255, 0.5)'
        ],
        data: [0, 0, 0, 0, 0, 0, 0]
      }
    ]
  };

  var totalCount = 0;

  data.forEach(item => {
    if (item.Score > 50) {
      chartData.datasets[0].data[0]++;
    } else if (item.Score > 20) {
      chartData.datasets[0].data[1]++;
    } else if (item.Score > 10) {
      chartData.datasets[0].data[2]++;
    } else if (item.Score > 5) {
      chartData.datasets[0].data[3]++;
    } else if (item.Score > 1) {
      chartData.datasets[0].data[4]++;
    } else if (item.Score > 0.5) {
      chartData.datasets[0].data[5]++;
    } else {
      chartData.datasets[0].data[6]++;
    }

    totalCount++;
  });

  var chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: 'Disturbution of Merchants'
      },
      legend: {
        position: 'bottom'
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            var label = chartData.labels[context.dataIndex];
            var value = chartData.datasets[context.datasetIndex].data[context.dataIndex];
            var percentage = ((value / totalCount) * 100).toFixed(2);
            return label + ': ' + value + ' (' + percentage + '%)';
          }
        }
      }
    }
  };

  var ctx = document.getElementById('pieChart').getContext('2d');
  new Chart(ctx, {
    type: 'pie',
    data: chartData,
    options: chartOptions
  });
}


function searchRecords(商户名) {
  fetch(`/search?商户名=${商户名}`)
    .then(response => response.json())
    .then(data => {
      displaySearchResults(data);
    })
    .catch(error => {
      showMessage(error);
      alert("An error occurred while searching records.");
    });
}

function displaySearchResults(data) {
  var searchTable = id("searchTable");
  searchTable.innerHTML = "";

  var 商户记录 = data.商户记录;
  if (商户记录) {
    var h2 = gen("h2");
    var h3 = gen("h3");
    h2.textContent = `商户名: ${商户记录.商户名}, ScoreR: ${商户记录.ScoreR}, ScoreF: ${商户记录.ScoreF}, ScoreM: ${商户记录.ScoreM}, Score: ${商户记录.Score}`;
    h3.textContent = `Update Time: ${商户记录.updateTime}, Last Purchase: ${商户记录.lastTime}`;
    searchTable.appendChild(h2);
    searchTable.appendChild(h3);

    var 场内交易记录 = data.场内交易记录;
    场内交易记录.forEach(record => {
      var span = gen("p");
      span.textContent = `商户名: ${record.商户名}, 收费日期: ${record.收费日期}, 单次货品估值: ${record.单次货品估值}`;
      searchTable.appendChild(span);
    });
  }
  else {
    var h2 = gen("h2");
    h2.textContent = `No such 商户记录 is found in Database`;
    searchTable.appendChild(h2);
  }
}

function gen(tagName) {
  return document.createElement(tagName);
}

function id(id) {
  return document.getElementById(id);
}

function showMessage(message) {
  let messageBox = id('messageBox');
  messageBox.innerHTML = '';
  let p = gen('p');
  p.textContent = message;
  messageBox.appendChild(p);
  id('messageSection').classList.remove('hidden');
  setTimeout(function () {
    id('messageSection').classList.add('hidden');
  }, 1500);
}

function updateColorBar() {
  var startDate = new Date(startDateInput.value);
  var dateA = new Date(dateAInput.value);
  var dateB = new Date(dateBInput.value);
  var endDate = new Date(endDateInput.value);

  var totalDuration = endDate - startDate;
  var durationA = dateA - startDate;
  var durationB = dateB - dateA;
  var durationC = endDate - dateB;

  var percentageA = (durationA / totalDuration) * 100;
  var percentageB = (durationB / totalDuration) * 100;
  var percentageC = (durationC / totalDuration) * 100;

  colorBar.innerHTML = "";

  if (percentageA > 0) {
    var redBar = gen("span");
    redBar.style.backgroundColor = "rgba(255, 215, 0, 0.5)";
    redBar.style.width = percentageA + "%";
    redBar.textContent = "T_other: " + tOtherInput.value;
    colorBar.appendChild(redBar);
  }

  if (percentageB > 0) {
    var blueBar = gen("span");
    blueBar.style.backgroundColor = "rgba(0, 0, 255, 0.5)";
    blueBar.style.width = percentageB + "%";
    blueBar.textContent = "T_bc: " + tBcInput.value;
    colorBar.appendChild(blueBar);
  }

  if (percentageC > 0) {
    var greenBar = gen("span");
    greenBar.style.backgroundColor = "rgba(255, 0, 0, 0.5)";
    greenBar.style.width = percentageC + "%";
    greenBar.textContent = "T_ab: " + tAbInput.value;
    colorBar.appendChild(greenBar);
  }

  var startLabel = gen("span");
  startLabel.textContent = "Start";
  colorBar.prepend(startLabel);

  var endLabel = gen("span");
  endLabel.textContent = "End";
  colorBar.appendChild(endLabel);
}