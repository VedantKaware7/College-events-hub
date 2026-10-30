// Summarise a Trivy JSON report: CRITICAL/HIGH counts per target and overall.
// Usage: node scripts/da3/trivy-summary.js docs/da3-results/trivy-before.json
const fs = require('fs');

const report = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const totals = { CRITICAL: 0, HIGH: 0 };

for (const result of report.Results || []) {
    const vulns = result.Vulnerabilities || [];
    if (!vulns.length) continue;
    const counts = { CRITICAL: 0, HIGH: 0 };
    for (const v of vulns) counts[v.Severity] = (counts[v.Severity] || 0) + 1;
    totals.CRITICAL += counts.CRITICAL;
    totals.HIGH += counts.HIGH;
    console.log(`${result.Target}: CRITICAL=${counts.CRITICAL} HIGH=${counts.HIGH}`);
    for (const v of vulns) console.log(`  ${v.Severity.padEnd(8)} ${v.VulnerabilityID.padEnd(20)} ${v.PkgName}@${v.InstalledVersion} -> ${v.FixedVersion || 'no fix'}`);
}

console.log(`TOTAL (${report.ArtifactName}): CRITICAL=${totals.CRITICAL} HIGH=${totals.HIGH}`);
