const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static('public'));

function analyzeTransactions(transactions) {
  return transactions.map((tx) => {
    let riskScore = 15;
    let flags = [];

    if (tx.amount > 5000) {
      riskScore += 45;
      flags.push('High transaction amount exceeding baseline threshold (> $5,000)');
    }

    const txHour = new Date(tx.timestamp).getHours();
    if (txHour >= 1 && txHour <= 4) {
      riskScore += 30;
      flags.push('Off-hours velocity spike (Executed between 1:00 AM - 4:00 AM)');
    }

    if (tx.currency && tx.currency !== 'USD') {
      riskScore += 20;
      flags.push('Cross-border currency conversion detected');
    }

    let riskLevel = 'LOW';
    if (riskScore >= 70) riskLevel = 'HIGH';
    else if (riskScore >= 40) riskLevel = 'MEDIUM';

    return {
      ...tx,
      riskScore,
      riskLevel,
      flags: flags.length > 0 ? flags : ['Standard user behavior pattern']
    };
  });
}

app.post('/api/analyze', (req, res) => {
  try {
    const { transactions } = req.body;
    if (!transactions || !Array.isArray(transactions)) {
      return res.status(400).json({ error: 'Invalid payload: Array required.' });
    }
    const results = analyzeTransactions(transactions);
    res.json({
      status: 'success',
      totalAnalyzed: results.length,
      highRiskCount: results.filter(r => r.riskLevel === 'HIGH').length,
      data: results
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
