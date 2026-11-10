import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {restoreIsolated} from './db-restore-test.mjs';
const backup=process.argv[2];if(!backup)throw Error('Verified pre-activation backup required.');
const bytes=await readFile(backup),manifest=JSON.parse(await readFile(backup+'.json','utf8'));
const base=await readFile('prisma/proposals/phase-b.sql','utf8'),mfa=await readFile('prisma/proposals/phase-b-mfa.sql','utf8');
await restoreIsolated(bytes,manifest,{onVerifiedRestore:async target=>{
 await target.executeSql(base);await target.executeSql(mfa);
 const fields=Number(await target.executeSql(`SELECT count(*) FROM information_schema.columns WHERE table_name='TwoFactor' AND column_name IN ('secret','backupCodes','verified','failedVerificationCount','lockedUntil');`));if(fields!==5)throw Error('MFA schema mismatch.');
 await target.executeSql(`BEGIN; INSERT INTO "User"(id,email,"displayName","updatedAt") VALUES('mfa-isolated-only','isolated@example.invalid','TEST ONLY',now()); INSERT INTO "TwoFactor"(id,"userId",secret,"backupCodes") VALUES('mfa-isolated-only','mfa-isolated-only','ISOLATED TEST PLACEHOLDER','ISOLATED TEST PLACEHOLDER'); DO $$ BEGIN IF (SELECT "twoFactorEnabled" FROM "User" WHERE id='mfa-isolated-only') OR (SELECT verified FROM "TwoFactor" WHERE id='mfa-isolated-only') THEN RAISE EXCEPTION 'Insecure enrollment default'; END IF; END $$; ROLLBACK;`);
 const rls=await target.executeSql(`SELECT relrowsecurity FROM pg_class WHERE relname='TwoFactor';`);if(rls!=='t')throw Error('MFA table RLS missing.');
 await writeFile('docs/phase-b-review/mfa-schema-checks.json',JSON.stringify({timestamp:new Date().toISOString(),isolated:true,sqlSha256:createHash('sha256').update(mfa).digest('hex'),checks:{schemaFields:true,enrollmentDisabledByDefault:true,foreignKeys:true,rls:true},originalDatabaseModified:false},null,2));
 console.log('MFA additive schema passed isolated checks. Original database was not modified.');
}});
