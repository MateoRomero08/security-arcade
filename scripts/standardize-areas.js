const fs = require('fs');
let content = fs.readFileSync('src/data/seed-phishing-scenarios.ts', 'utf8');

const mapping = {
  '"Operations"': '"S-OPS"',
  '"Customer Service"': '"EX"',
  '"IT & Security"': '"IT"',
  '"Human Resources (HR)"': '"HR"',
  '"Cashier / Payments"': '"LSS"',
  '"Accounting & Finance"': '"LSS"',
  '"Legal & Compliance"': '"FACILITIES"',
  '"Sales & Commercial"': '"RECRUITMENT"'
};

for (const [k, v] of Object.entries(mapping)) {
  content = content.replaceAll(k, v);
}

fs.writeFileSync('src/data/seed-phishing-scenarios.ts', content, 'utf8');
console.log('Successfully standardized area_objetivo in seed-phishing-scenarios.ts');

