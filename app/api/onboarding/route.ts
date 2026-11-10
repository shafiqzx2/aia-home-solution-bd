import {ZodError} from "zod";
import {acceptInvitation} from "@/lib/server/onboarding";
import {businessEnabled} from "@/lib/server/config";
import {jsonBody,requireOrigin,HttpError} from "@/lib/server/security";
export async function POST(request:Request) {
  const headers={"Cache-Control":"private, no-store"};
  if(!businessEnabled())return Response.json({error:'AUTHENTICATION_NOT_CONFIGURED'},{status:503,headers});
  try{requireOrigin(request);return Response.json(await acceptInvitation(await jsonBody(request)),{headers});}
  catch(error){return Response.json({error:error instanceof HttpError?error.code:error instanceof ZodError?'INVALID_ONBOARDING_INPUT':'ONBOARDING_UNAVAILABLE'},{status:error instanceof HttpError?error.status:error instanceof ZodError?422:503,headers});}
}
