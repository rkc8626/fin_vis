window.addEventListener('load', init);

var startDateInput, dateAInput, dateBInput, endDateInput, colorBar, submitButton, saveButton;

function init() {
  startDateInput = id("startDate");
  dateAInput = id("dateA");
  dateBInput = id("dateB");
  endDateInput = id("endDate");
  colorBar = id("colorBar");
  submitButton = document.querySelector("button[type='submit']");
  saveButton = document.querySelector("button#saveButton");

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
    var resultTable = id("resultTable");
    resultTable.innerHTML = "";
    event.preventDefault();
    var startDate = startDateInput.value;
    var dateA = dateAInput.value;
    var dateB = dateBInput.value;
    var endDate = endDateInput.value;
    var startDate = startDateInput.value;
    var tAb = tAbInput.value;
    var tBc = tBcInput.value;
    var tOther = tOtherInput.value;

    fetchData(dateB, endDate, tAb);
    fetchData(dateA, dateB, tBc);
    fetchData(startDate, dateA,tOther);
    toggleSectionVisibility(resultSection, chartSection);

  });

  saveButton.addEventListener("click", function (event) {
    event.preventDefault();
    var endDate = endDateInput.value;
    saveScores(endDate);
  });

  chartButton.addEventListener("click", function (event) {
    event.preventDefault();
    fetchScores();
    toggleSectionVisibility(chartSection, resultSection);
  });

  clearButton.addEventListener("click", function (event) {
    event.preventDefault();
    clearResults();
  });

  searchButton.addEventListener("click", function (event) {
    event.preventDefault();
    var 商户名 = id("searchInput").value;
    clearResults();
    resultSection.classList.remove("hidden");
    searchRecords(商户名);
  });

  document.getElementById("toggleButton").onclick = function() {
    var optionDiv = document.getElementById("option");
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
  var chartCanvas = id("barChart");

  resultTable.innerHTML = "";
  var chartContainer = chartCanvas.parentNode;
  chartContainer.removeChild(chartCanvas);
  chartContainer.innerHTML = '<canvas id="barChart"></canvas>';
  chartSection.classList.add("hidden");
  resultSection.classList.add("hidden");
}

function toggleSectionVisibility(showSection, hideSection) {
  showSection.classList.remove("hidden");
  hideSection.classList.add("hidden");
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
    redBar.style.backgroundColor = "red";
    redBar.style.width = percentageA + "%";
    redBar.textContent = "T_other: " + tOtherInput.value;
    colorBar.appendChild(redBar);
  }

  if (percentageB > 0) {
    var blueBar = gen("span");
    blueBar.style.backgroundColor = "blue";
    blueBar.style.width = percentageB + "%";
    blueBar.textContent = "T_bc: " + tBcInput.value;
    colorBar.appendChild(blueBar);
  }

  if (percentageC > 0) {
    var greenBar = gen("span");
    greenBar.style.backgroundColor = "green";
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

function fetchData(startDate, endDate, index) {
  fetch(`/dates?startDate=${startDate}&endDate=${endDate}`)
    .then(response => response.json())
    .then(data => {
      displayResults(data, index);
      showMessage('Calculating Data...');
    })
    .catch(error => {
      console.error(error);
      alert("An error occurred while calculating scores.");
    });
}

function caculetfetchData(startDate, endDate) {
  fetch(`/dates?startDate=${startDate}&endDate=${endDate}`)
    .then(response => response.json())
    .then(data => {
      return data;
    })
    .catch(error => {
      console.error(error);
      alert("An error occurred while calculating scores.");
    });
}


function displayResults(data, index) {
  var resultTable = id("resultTable");

  var minDaysMap = {};
  var displayedMerchants = new Set();

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

    var span = gen("p");
    var lineBreak = gen('br');

    if (getDaysBetweenDates(item.收费日期, endDateInput.value) === minDaysMap[商户名]) {
      var score_R = fRInput.value * parseInt(getDaysBetweenDates(item.收费日期, endDateInput.value));

      // in start to dateA
      var score_F = fFInput.value * parseInt(countOccurrences(data, item.商户名));
      var score_M = fMInput.value * parseInt(sumEstimationValues(data, item.商户名));
      // in dateA to dateB
      var score_F = fFInput.value * parseInt(countOccurrences(data, item.商户名));
      var score_M = fMInput.value * parseInt(sumEstimationValues(data, item.商户名));
      // in dateB to end
      var score_F = fFInput.value * parseInt(countOccurrences(data, item.商户名));
      var score_M = fMInput.value * parseInt(sumEstimationValues(data, item.商户名));

      var score = parseInt(index * (score_F - score_R + score_M));

      var searchButton = gen("button");
      searchButton.textContent = "View History";
      searchButton.addEventListener("click", function () {
        searchRecords(商户名);
      });

      span.textContent = `${index.toString()}  商户名: ${item.商户名} last purcahse: ${item.收费日期} score_R: ${score_R.toString()} score_F: ${score_F.toString()} score_M: ${score_M.toString()} score: ${score.toString()}`;
      span.appendChild(searchButton);

      resultTable.appendChild(span);
      resultTable.appendChild(lineBreak);

      displayedMerchants.add(商户名);
    }

  });
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
        console.log('Scores saved successfully!');
        showMessage('Scores saved successfully!');
      } else {
        throw new Error('Error saving scores');
      }
    })
    .catch((error) => {
      console.error(error);
      showMessage('An error occurred while saving scores');
    });
}

function fetchScores() {
  fetch('/scores')
    .then(response => response.json())
    .then(data => {
      displayChart(data);
    })
    .catch(error => {
      console.error(error);
      alert("An error occurred while fetching scores.");
    });
}

function displayChart(data) {
  var chartData = {
    labels: [],
    datasets: [
      {
        label: 'ScoreR',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        data: []
      },
      {
        label: 'ScoreF',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        data: []
      },
      {
        label: 'ScoreM',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        data: []
      },
    ]
  };

  data.forEach(item => {
    chartData.labels.push(`${item.商户名}\nScore: ${item.Score}`);
    chartData.datasets[0].data.push(-item.ScoreR);
    chartData.datasets[1].data.push(item.ScoreF);
    chartData.datasets[2].data.push(item.ScoreM);
  });

  var chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        stacked: true
      },
      y: {
        stacked: true
      }
    },
    plugins: {
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

function searchRecords(商户名) {
  fetch(`/search?商户名=${商户名}`)
    .then(response => response.json())
    .then(data => {
      displaySearchResults(data);
    })
    .catch(error => {
      console.error(error);
      alert("An error occurred while searching records.");
    });
}

function displaySearchResults(data) {
  var resultTable = id("resultTable");
  resultTable.innerHTML = "";

  var 商户记录 = data.商户记录;
  if (商户记录) {
    var h2 = gen("h2");
    var h3 = gen("h3");
    h2.textContent = `商户名: ${商户记录.商户名}, ScoreR: ${商户记录.ScoreR}, ScoreF: ${商户记录.ScoreF}, ScoreM: ${商户记录.ScoreM}, Score: ${商户记录.Score}`;
    h3.textContent = `Update Time: ${商户记录.updateTime}, Last Purchase: ${商户记录.lastTime}`;
    resultTable.appendChild(h2);
    resultTable.appendChild(h3);


    var 场内交易记录 = data.场内交易记录;
    场内交易记录.forEach(record => {
      var span = gen("p");
      span.textContent = `商户名: ${record.商户名}, 收费日期: ${record.收费日期}, 单次货品估值: ${record.单次货品估值}`;
      resultTable.appendChild(span);
    });
  }
  else {
    var h2 = gen("h2");
    h2.textContent = `No such 商户记录 is found in Database`;
    resultTable.appendChild(h2);
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
  }, 1000);
}
