import "server-only";
import type {Prisma} from '@prisma/client';
export async function assertPublicIdentitySafe(tx:Prisma.TransactionClient,value:unknown) {
 const [roots,pending]=await Promise.all([
  tx.user.findMany({where:{roles:{some:{role:{kind:'SUPER_ADMIN'}}}},select:{email:true}}),
  tx.staffInvitation.findMany({where:{rootBootstrap:true},select:{email:true}}),
 ]);
 const text=JSON.stringify(value).toLowerCase();
 if([...roots,...pending].some(r=>text.includes(r.email.toLowerCase())))throw new Error('PRIVATE_IDENTITY_IN_PUBLIC_CONTENT');
}
export async function privateIdentityEmails(tx:Prisma.TransactionClient){const [users,invites]=await Promise.all([tx.user.findMany({where:{roles:{some:{role:{kind:'SUPER_ADMIN'}}}},select:{email:true}}),tx.staffInvitation.findMany({where:{rootBootstrap:true},select:{email:true}})]);return [...new Set([...users,...invites].map(r=>r.email))];}
