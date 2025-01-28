// client.js

document.addEventListener('DOMContentLoaded', () => {
    const searchBtn        = document.getElementById('searchBtn');
    const startInput       = document.getElementById('startInput');
    const endInput         = document.getElementById('endInput');
    const mustPassInput    = document.getElementById('mustPassInput');
    const ignoreLinesInput = document.getElementById('ignoreLinesInput');
    const errorBox         = document.getElementById('errorBox');
  
    const summary          = document.getElementById('summary');
    const stationsList     = document.getElementById('stationsList');
  
    searchBtn.addEventListener('click', async () => {
      // Clear previous results
      errorBox.style.display = 'none';
      errorBox.textContent = '';
      summary.textContent = '';
      stationsList.innerHTML = '';
  
      // Read user input
      const startVal = startInput.value.trim();
      const endVal   = endInput.value.trim();
      const mustPass = mustPassInput.value.trim();
      const ignore   = ignoreLinesInput.value.trim();
  
      // Check which mode is selected
      const modeEls = document.getElementsByName('mode');
      let comfortMode = false; // default to speed
      for (const m of modeEls) {
        if (m.checked && m.value === 'comfort') {
          comfortMode = true;
          break;
        }
      }
  
      // Build query
      const params = new URLSearchParams();
      params.append('start', startVal);
      params.append('end', endVal);
      if (comfortMode) {
        params.append('comfort', '1');
      }
      if (mustPass) {
        params.append('through', mustPass);
      }
      if (ignore) {
        params.append('ignore', ignore);
      }
  
      // Call the API endpoint
      let url = `/api/route?` + params.toString();
      try {
        const res = await fetch(url);
        const data = await res.json();
  
        if (data.error) {
          // Show the error
          errorBox.style.display = 'block';
          errorBox.textContent = data.error;
        } else {
          // Display route info
          summary.textContent = `Počet stanic na trase: ${data.stationCount}`;
          for (const step of data.route) {
            const li = document.createElement('li');
            li.textContent = step.station;
            if (step.line) {
              li.textContent += ` (Linka: ${step.line})`;
            }
            stationsList.appendChild(li);
          }
        }
      } catch (err) {
        errorBox.style.display = 'block';
        errorBox.textContent = 'Chyba spojení se serverem.';
        console.error(err);
      }
    });
  });
  