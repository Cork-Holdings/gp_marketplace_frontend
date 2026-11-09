import test from 'node:test';
import assert from 'node:assert/strict';
import {parseBankCSV} from '../src/lib/erpBankCSV.ts';
test('bank CSV reads signed exact amounts, quoted commas, quotes and CRLF',()=>{
 assert.deepEqual(parseBankCSV('date,reference,amount\r\n2026-11-01,"Deposit, ref ""A""",1.05\r\n2026-11-02,Withdrawal,-2.00'),[{date:'2026-11-01',reference:'Deposit, ref "A"',amount_minor:105},{date:'2026-11-02',reference:'Withdrawal',amount_minor:-200}]);
});
test('bank CSV rejects malformed dates, unfinished fields, zero amounts and silent rounding',()=>{
 for(const csv of ['2026-02-30,Test,1','2026-11-01,"Test,1','2026-11-01,Test,0','2026-11-01,Test,1.001','2026-11-01,,1'])assert.throws(()=>parseBankCSV(csv));
});
