const fs = require('fs'); const csvText = fs.readFileSync('temp.csv', 'utf8'); console.log(csvText.substring(0, 500));
