import fs from 'fs';
import path from 'path';

export function saveReport(reportData, prefixOverride = null) {
    const projectRoot = process.cwd();
    const reportsDir = path.join(projectRoot, 'reports');
    
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Determine nomenclature from env, default to yyyymmdd_n
    const nomenclature = process.env.REPORT_NOMENCLATURE || 'yyyymmdd_n';
    
    // Parse yyyymmdd
    const now = new Date();
    const yyyymmdd = now.toISOString().split('T')[0].replace(/-/g, '');
    const timestamp = now.getTime();

    let prefix = prefixOverride || (nomenclature.includes('yyyymmdd') ? yyyymmdd : 'report');

    // Find existing reports with the same prefix to determine 'n'
    const existingFiles = fs.readdirSync(reportsDir).filter(f => f.startsWith(prefix));
    let n = 1;
    if (existingFiles.length > 0) {
        const numbers = existingFiles.map(f => {
            const match = f.match(new RegExp(`^${prefix}_(\\d+)\\.json$`));
            return match ? parseInt(match[1], 10) : 0;
        });
        n = Math.max(...numbers, 0) + 1;
    }

    let filename = `${prefix}_${n}.json`;
    
    // Fallback if nomenclature doesn't contain _n
    if (!nomenclature.includes('_n')) {
         filename = `${prefix}_${timestamp}.json`;
    }

    const reportPath = path.join(reportsDir, filename);
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    
    console.log(`\n======================================================`);
    console.log(`Test Report saved to: ${reportPath}`);
    console.log(`======================================================\n`);
    
    return reportPath;
}
