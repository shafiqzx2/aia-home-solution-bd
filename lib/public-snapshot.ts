import {company,categories,productConcepts,publicServices,portfolio,jobs,solutionPreviews} from "./public-content";
import type {z} from "zod";
import type {contentBodySchema} from "./business/validation";
export type PublishedPage={title:string;body:z.infer<typeof contentBodySchema>;seo:{title?:string;description?:string}};
export type PublicSnapshot={trustBadges:{id:string;label:{en:string;bn:string};value:string}[];connected:boolean;company:typeof company;categories:typeof categories;products:typeof productConcepts;services:typeof publicServices;portfolio:typeof portfolio;jobs:typeof jobs;solutionPreviews:{id:string;icon:typeof solutionPreviews[number]["icon"];name:{en:string;bn:string};description:{en:string;bn:string}}[];pages:Record<string,{en?:PublishedPage;bn?:PublishedPage}>};
export const staticSnapshot:PublicSnapshot={trustBadges:[],connected:false,company,categories,products:productConcepts,services:publicServices,portfolio,jobs,solutionPreviews:[...solutionPreviews],pages:{}};
