import {z} from 'zod';
import {navigationKeys as navigation} from '../navigation.ts';
const localized=z.object({en:z.string().trim().min(1).max(3000),bn:z.string().max(3000)}).strict();
export const reviewSchema=z.object({name:z.string().trim().min(2).max(160),quote:localized,rating:z.number().int().min(1).max(5)}).strict();
export const navigationSchema=z.array(z.object({key:z.enum(navigation),visible:z.boolean(),label:z.object({en:z.string().trim().max(60),bn:z.string().trim().max(60)}).strict()}).strict()).length(navigation.length).refine(rows=>new Set(rows.map(r=>r.key)).size===navigation.length&&['home','contact'].every(key=>rows.some(r=>r.key===key&&r.visible)),{message:'Keep every approved page once; Home and Contact must stay visible.'});
