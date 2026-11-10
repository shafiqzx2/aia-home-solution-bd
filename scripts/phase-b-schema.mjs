// Compose the reviewed domain foundation with the maintained auth adapter.
// Generates source/client-review SQL only; never connects or applies migrations.
import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
let schema=fs.readFileSync('prisma/proposals/phase-a1.prisma','utf8');
schema=schema.replace(/^\/\/ REVIEW ONLY[^\n]*\n\/\/[^\n]*\n/,'// Phase B integrated schema. Execution requires the migration review gate.\n');
schema=schema.replace(/\s+output\s+= "[^\n]+"/,'');
schema=schema.replace('  providerId     String             @unique','  email String @unique\n  emailVerified Boolean @default(false)\n  image String?\n  accounts Account[]\n  overrides UserPermission[]');
schema=schema.replace('  providerSessionId String    @unique','  token String @unique\n  ipAddress String?\n  userAgent String?\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt');
schema=schema.replace('model Product {','model Product {\n  draft Json?\n  publicData Json?\n  unit String @default("pcs")\n  revision Int @default(0)\n  sortOrder Int @default(0)');
schema=schema.replace('model Category {','model Category {\n  sortOrder Int @default(0)\n  revision Int @default(0)');
schema=schema.replace('model Service {','model Service {\n  draft Json?\n  publicData Json?\n  revision Int @default(0)\n  sortOrder Int @default(0)');
schema=schema.replace('model ContentEntry {','model ContentEntry {\n  draft Json?\n  revision Int @default(0)\n  revisions ContentRevision[]');
schema=schema.replace('model Role {','model Role {\n  invitationRoles InvitationRole[]');
schema=schema.replace('model CompanySettings {','model CompanySettings {\n  draft Json?');
schema+=`\nmodel Account {
  id String @id @default(cuid())
  accountId String
  providerId String
  userId String
  user User @relation(fields:[userId],references:[id],onDelete:Cascade)
  accessToken String?
  refreshToken String?
  idToken String?
  accessTokenExpiresAt DateTime?
  refreshTokenExpiresAt DateTime?
  scope String?
  password String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@unique([providerId,accountId])
  @@index([userId])
}
model Verification {
  id String @id @default(cuid())
  identifier String
  value String
  expiresAt DateTime
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  @@index([identifier])
}
model RateLimit {
  id String @id @default(cuid())
  key String @unique
  count Int
  lastRequest BigInt
}
enum PermissionEffect {
  ALLOW
  DENY
}
model UserPermission {
  userId String
  scope String
  effect PermissionEffect
  user User @relation(fields:[userId],references:[id],onDelete:Restrict)
  @@id([userId,scope])
}
model StaffInvitation {
  id String @id @default(cuid())
  email String
  tokenHash String @unique
  purpose String
  rootBootstrap Boolean @default(false)
  expiresAt DateTime
  consumedAt DateTime?
  createdById String?
  createdAt DateTime @default(now())
  roles InvitationRole[]
  @@index([email,expiresAt])
}
model InvitationRole {
  invitationId String
  roleId String
  invitation StaffInvitation @relation(fields:[invitationId],references:[id],onDelete:Cascade)
  role Role @relation(fields:[roleId],references:[id],onDelete:Restrict)
  @@id([invitationId,roleId])
}
model ContentRevision {
  id String @id @default(cuid())
  entryId String
  entry ContentEntry @relation(fields:[entryId],references:[id],onDelete:Restrict)
  revision Int
  snapshot Json
  actorId String
  createdAt DateTime @default(now())
  @@unique([entryId,revision])
}
`;
fs.writeFileSync('prisma/schema.prisma',schema);
const env={...process.env,DATABASE_URL:'postgresql://review:review@127.0.0.1:1/review',DIRECT_URL:'postgresql://review:review@127.0.0.1:1/review'};
function prisma(args){const r=spawnSync(process.execPath,['node_modules/prisma/build/index.js',...args],{env,encoding:'utf8',windowsHide:true});if(r.status)throw Error(r.stderr||r.stdout);return r.stdout;}
console.log(prisma(['validate']));
const old='prisma/proposals/phase-b-from.prisma';
if(!fs.existsSync(old))fs.copyFileSync('D:/AIA/phase-b-checkpoint-20261109/prisma/schema.prisma',old,fs.constants.COPYFILE_EXCL);
const sql=prisma(['migrate','diff','--from-schema-datamodel',old,'--to-schema-datamodel','prisma/schema.prisma','--script']);
if(/\b(DROP|TRUNCATE)\b/i.test(sql)||/ALTER TABLE "DatabaseHealthCheck"/i.test(sql))throw Error('Non-additive diff');
const names=[...sql.matchAll(/CREATE TABLE "([^"]+)"/g)].map(m=>m[1]);
const extra=fs.readFileSync('prisma/proposals/invariants.sql','utf8').replace('__TABLES__',names.map(n=>`'${n}'`).join(','));
const a1=fs.readFileSync('prisma/proposals/phase-a1-invariants.sql','utf8');
fs.writeFileSync('prisma/proposals/phase-b.sql','-- REVIEW ONLY. Requires target approval and verified restore before execution.\nBEGIN;\n'+sql+'\n'+extra+'\n'+a1+'\nCOMMIT;\n');
console.log(`Prepared ${names.length} additive tables; no migration executed.`);
