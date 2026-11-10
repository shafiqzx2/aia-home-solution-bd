import {ZodError} from "zod";
import {submitInquiry} from "@/lib/server/inquiries";
import {businessEnabled} from "@/lib/server/config";
import {requireOrigin,jsonBody,HttpError} from "@/lib/server/security";
export async function POST(request:Request) {
  const headers={"Cache-Control":"private, no-store"};
  if(!businessEnabled())return Response.json({error:"REQUEST_SUBMISSION_NOT_CONFIGURED"},{status:503,headers});
  try {requireOrigin(request);const result=await submitInquiry(request,await jsonBody(request));return Response.json(result,{status:201,headers});}
  catch(error){const status=error instanceof HttpError?error.status:error instanceof ZodError?422:503;return Response.json({error:error instanceof HttpError?error.code:error instanceof ZodError?"INVALID_REQUEST":"REQUEST_SUBMISSION_UNAVAILABLE"},{status,headers});}
}
