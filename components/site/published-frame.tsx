import {publishedSite} from "@/lib/server/published";
import {PublishedProvider} from "./published-provider";
export async function PublishedFrame({children}:{children:React.ReactNode}) {
  return <PublishedProvider value={await publishedSite()}>{children}</PublishedProvider>;
}
